// import uuid from 'uuid';
import tokenizer from './tokenizer';
import { exists, binarySearchByKey, getCategoryDocs, resetNegative } from './Helper.service';
import * as aDbService from './Analyzer.dbService';
import { BadRequestError } from './errors';
// import TextAnalyzer from './TextAnalyzer';

export async function learn(userId, analyzerId, text, category) {
  // generate tokens
  const tokens = tokenizer(text);

  const analyzerDbId = aDbService.getAnalyzerId(userId, analyzerId);
  const categoryId = aDbService.getCategoryId(userId, analyzerId, category);
  const tokenIds = getSortedTokenIds(userId, analyzerId, tokens);
  const analyzerRecords = await aDbService.fetchRecords([analyzerDbId, categoryId, ...tokenIds]);
  const analyzer = analyzerRecords.rows[0].doc;
  const catRecord = analyzerRecords.rows[1];
  let cat;
  // create the category if it doesn't exist
  if (exists(catRecord.error)) {
    cat = aDbService.generateNewCategoryDoc(userId, analyzerId, category);
  } else {
    cat = catRecord.doc;
  }
  // increment analyzer doc count
  analyzer.totalDocCount += 1;
  // increment category doc count
  cat.totalDocCount += 1;

  // add tokens length to analyzer token count
  analyzer.totalTokenCount += tokens.length;
  // add tokens length to category token count
  cat.totalTokenCount += tokens.length;

  const updates = [analyzer, cat];

  tokens.forEach((token) => {
    const tokenId = aDbService.getAnalyzerTokenId(userId, analyzerId, token);
    const record = binarySearchByKey(tokenId, analyzerRecords.rows, 'key');
    const doc = getUpdatedTokenDoc(record, category, 'increment');
    // if we've already added the doc to the updates list,
    if (!updates.find((item) => { return item._id === tokenId; })) {
      updates.push(doc);
    }
  });

  // save everything in a bulk update
  await aDbService.saveRecords(updates);
}

export async function unlearn(userId, analyzerId, text, category) {
  // generate tokens
  const tokens = tokenizer(text);

  const analyzerDbId = aDbService.getAnalyzerId(userId, analyzerId);
  const categoryId = aDbService.getCategoryId(userId, analyzerId, category);
  const tokenIds = getSortedTokenIds(userId, analyzerId, tokens);
  const analyzerRecords = await aDbService.fetchRecords([analyzerDbId, categoryId, ...tokenIds]);
  const analyzer = analyzerRecords.rows[0].doc;
  const catRecord = analyzerRecords.rows[1];
  if (exists(catRecord.error)) {
    throw new BadRequestError(`${category} does not exist`);
  }

  const cat = catRecord.doc;

  // decrement analyzer doc count
  analyzer.totalDocCount -= 1;
  analyzer.totalDocCount = resetNegative(analyzer.totalDocCount);
  // decrement category doc count
  cat.totalDocCount -= 1;
  cat.totalDocCount = resetNegative(cat.totalDocCount);

  // decrement tokens length from analyzer token count
  analyzer.totalTokenCount -= tokens.length;
  analyzer.totalTokenCount = resetNegative(analyzer.totalTokenCount);
  // decrement tokens length from category token count
  cat.totalTokenCount -= tokens.length;
  cat.totalTokenCount = resetNegative(cat.totalTokenCount);

  const updates = [analyzer, cat];

  tokens.forEach((token) => {
    const tokenId = aDbService.getAnalyzerTokenId(userId, analyzerId, token);
    const record = binarySearchByKey(tokenId, analyzerRecords.rows, 'key');
    const doc = getUpdatedTokenDoc(record, category, 'decrement');
    // if we've already added the doc to the updates list,
    if (!updates.find((item) => { return item._id === tokenId; })) {
      updates.push(doc);
    }
  });

  // save everything in a bulk update
  await aDbService.saveRecords(updates);
}

// doing everything in one read and one write rather than calling .learn and .unlearn to speed things up
export async function relearn(userId, analyzerId, text, oldCategory, newCategory) {
  // generate tokens
  const tokens = tokenizer(text);
  // don't actually need the analyzer record, since none of its counts should change
  const oldCategoryId = aDbService.getCategoryId(userId, analyzerId, oldCategory);
  const newCategoryId = aDbService.getCategoryId(userId, analyzerId, newCategory);
  const tokenIds = getSortedTokenIds(userId, analyzerId, tokens);
  const analyzerRecords = await aDbService.fetchRecords([oldCategoryId, newCategoryId, ...tokenIds]);
  const oldCatRecord = analyzerRecords.rows[0];
  const newCatRecord = analyzerRecords.rows[1];

  if (exists(oldCatRecord.error)) {
    throw new BadRequestError(`${oldCategory} does not exist`);
  }

  const oldCat = oldCatRecord.doc;
  let newCat;

  if (exists(newCatRecord.error)) {
    newCat = aDbService.generateNewCategoryDoc(userId, analyzerId, newCategory);
  } else {
    newCat = newCatRecord.doc;
  }

  // decrement old category doc count
  oldCat.totalDocCount -= 1;
  oldCat.totalDocCount = resetNegative(oldCat.totalDocCount);
  // increment new category doc count
  newCat.totalDocCount += 1;

  // decrement tokens length from category token count
  oldCat.totalTokenCount -= tokens.length;
  oldCat.totalTokenCount = resetNegative(oldCat.totalTokenCount);

  newCat.totalTokenCount += tokens.length;

  const updates = [oldCat, newCat];

  tokens.forEach((token) => {
    const tokenId = aDbService.getAnalyzerTokenId(userId, analyzerId, token);
    const record = binarySearchByKey(tokenId, analyzerRecords.rows, 'key');
    getUpdatedTokenDoc(record, oldCategory, 'decrement');
    // note that record should have been passed by ref in the last function and the updates to it should be available here
    const doc = getUpdatedTokenDoc(record, newCategory, 'increment');
    // if we've already added the doc to the updates list,
    if (!updates.find((item) => { return item._id === tokenId; })) {
      updates.push(doc);
    }
  });

  // save everything in a bulk update
  await aDbService.saveRecords(updates);
}

export function getUpdatedTokenDoc(tokenRecord, category, operation) {
  let increment = 1;
  let defaultValue = 1;
  let doc;

  if (operation === 'decrement') {
    increment = -1;
    defaultValue = 0;
  }

  if (!exists(tokenRecord.error)) {
    doc = tokenRecord.doc;
    if (exists(doc.counts[category])) {
      doc.counts[category] += increment;
      doc.counts[category] = resetNegative(doc.counts[category]);
    } else {
      doc.counts[category] = defaultValue;
    }
  } else {
    // reconfigure the doc to be recognized as one that came from the db so we can update it later in the loop
    delete tokenRecord.error; // eslint-disable-line
    const newDoc = { // eslint-disable-line
      _id: tokenRecord.key,
      type: 'token',
      counts: {},
    };
    newDoc.counts[category] = defaultValue;
    tokenRecord.doc = newDoc; // eslint-disable-line
    doc = newDoc;
  }
  return doc;
}

export async function categorize(userId, analyzerId, text) {
  const rawResults = [];
  let totalSum = 0.0;

  const analyzerDocs = await aDbService.fetchAllRecordsForAnalyzer(userId, analyzerId);

  const categories = getCategoryDocs(analyzerDocs.rows).map((catDoc) => {
    return catDoc.doc.name;
  });

  const analyzer = analyzerDocs.rows[0].doc;
  // console.log('ANALYZER TOTAL DOC COUNT', analyzer.totalDocCount);
  // console.log('ANALYZER TOTAL TOKEN COUNT', analyzer.totalTokenCount);

  // generate tokens
  const tokens = tokenizer(text);
  // for each category
  categories.forEach((category) => {
    let pSum = 0.0;
    // console.log('********');
    // console.log('********');
    // console.log('CATEGORY', category);
    const categoryId = aDbService.getCategoryId(userId, analyzerId, category);
    const cat = binarySearchByKey(categoryId, analyzerDocs.rows, 'key').doc;
    // calculate pCategory (category.totalDocCount /analyzer.totalDocCount)
    // console.log('CAT DOC COUNT', cat.totalDocCount);
    // console.log('CAT TOKEN COUNT', cat.totalTokenCount);
    const pCategory = cat.totalDocCount / analyzer.totalDocCount;
    // console.log('pCategory', pCategory);
    // for each token
    tokens.forEach((token) => {
      const tokenId = aDbService.getAnalyzerTokenId(userId, analyzerId, token);
      // console.log('----');
      // console.log('TOKEN: ', token);
      const tokenDoc = binarySearchByKey(tokenId, analyzerDocs.rows, 'key');
      let catTokenCount = 0.0;
      let aTokenCount = 0.0;
      if (exists(tokenDoc)) {
        catTokenCount = exists(tokenDoc.doc.counts[category]) ? tokenDoc.doc.counts[category] : 0.0;
        aTokenCount = categories.reduce((sum, item) => {
          if (exists(tokenDoc.doc.counts[item])) {
            return sum + tokenDoc.doc.counts[item];
          }
          return sum;
        }, 0.0);
      }
      // console.log('aTokenCount', aTokenCount);
      // console.log('catTokenCount', catTokenCount);
      // calculate pTokenGivenCategory (category token count / category totalTokenCount)
      const pTokenGivenCategory = catTokenCount / cat.totalTokenCount;
      // console.log('pTokenGivenCategory', pTokenGivenCategory);
      // calculate pTokenGivenNotCategory (analyzer token count - category token count / analyzer totalTokenCount - category totalTokenCount)
      const pTokenGivenNotCategory = (aTokenCount - catTokenCount) / (analyzer.totalTokenCount - cat.totalTokenCount);
      // console.log('pTokenGivenNotCategory', pTokenGivenNotCategory);
      // calculate pToken (pTokenGivenCategory * pCategory) + (pTokenGivenNotCategory * (1 - pCategory))
      const pToken = (pTokenGivenCategory * pCategory) + (pTokenGivenNotCategory * (1 - pCategory));
      // console.log('pToken', pToken);
      // calculate pCategoryGivenToken ((pTokenGivenCategory * pCategory) / pToken)
      const pCategoryGivenToken = pToken === 0 ? 0 : (pTokenGivenCategory * pCategory) / pToken;
      // console.log('pCategoryGivenToken', pCategoryGivenToken);
      // sum probabilities so far
      pSum += pCategoryGivenToken;
      // console.log('pSum', pSum);
    });
    // push total probability for this category
    rawResults.push({
      category,
      probability: pSum,
    });
    // sum raw probabilities to calculate a relative probability later
    totalSum += pSum;
  });

  const results = rawResults.map((result) => {
    const { category, probability } = result;
    return {
      category,
      probability,
      relativeProbability: `${totalSum === 0 ? '0%' : ((probability / totalSum) * 100).toString()}%`,
    };
  });

  // return category with highest sum of pCategoryGivenToken
  return results.reduce((a, b) => {
    if (a.probability > b.probability) {
      return a;
    }
    return b;
  });
}

function getSortedTokenIds(userId, analyzerId, tokens) {
  const tokenIds = new Set();
  tokens.forEach((t) => {
    tokenIds.add(aDbService.getAnalyzerTokenId(userId, analyzerId, t));
  });
  return Array.from(tokenIds).sort();
}
