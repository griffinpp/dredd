import tokenizer from './tokenizer';
import { exists, binarySearchByKey, resetNegative } from './Helper.service';
import * as aDbService from './Analyzer.dbService';
import { BadRequestError } from './errors';

// records are distinguished from docs here.  Records are the raw data returned from the db and contain a doc in the .doc property
// records may also contain a .error property instead of a .doc property, usually indicating that an id could not be found
// docs are the actual data we are generally interested in.

export async function learn(userId, analyzerId, text, category) {
  // generate tokens
  const tokens = tokenizer(text);

  const analyzerDbId = aDbService.getAnalyzerId(userId, analyzerId);
  const categoryId = aDbService.getCategoryId(userId, analyzerId, category);
  const tokenIds = getSortedTokenIds(userId, analyzerId, tokens);
  const analyzerRecords = await aDbService.fetchRecords([analyzerDbId, categoryId, ...tokenIds]);
  const analyzerDoc = analyzerRecords.rows[0].doc;
  const categoryRecord = analyzerRecords.rows[1];
  let categoryDoc;
  // create the category if it doesn't exist
  if (exists(categoryRecord.error)) {
    categoryDoc = aDbService.generateNewCategoryDoc(userId, analyzerId, category);
  } else {
    categoryDoc = categoryRecord.doc;
  }
  // increment analyzer doc count
  analyzerDoc.totalDocCount += 1;
  // increment category doc count
  categoryDoc.totalDocCount += 1;

  // add tokens length to analyzer token count
  analyzerDoc.totalTokenCount += tokens.length;
  // add tokens length to category token count
  categoryDoc.totalTokenCount += tokens.length;

  const updates = [analyzerDoc, categoryDoc];

  let prevTokenRecord = null;
  tokens.forEach((token) => {
    const tokenId = aDbService.getAnalyzerTokenId(userId, analyzerId, token);
    const tokenRecord = binarySearchByKey(tokenId, analyzerRecords.rows, 'key');
    updateTokenRecord(tokenRecord, category, 'increment');
    addToChain(token, prevTokenRecord, category);
    // if we've already added the doc to the updates list, don't add it again
    if (!updates.find((item) => { return item._id === tokenId; })) {
      updates.push(tokenRecord.doc);
    }
    prevTokenRecord = tokenRecord;
  });

  // save everything in a bulk update
  await aDbService.saveRecords(updates);
}

function addToChain(token, tokenRecord, category) {
  if (exists(tokenRecord) && !exists(tokenRecord.error)) {
    const doc = tokenRecord.doc;
    // we know the category exists because we were just dealing with that token in the last iteration
    if (!exists(doc[category].chain[token])) {
      doc[category].chain[token] = 0;
    }
    doc[category].chainSize += 1;
    doc[category].chain[token] += 1;
  }
}

function removeFromChain(token, tokenRecord, category) {
  if (exists(tokenRecord) && !exists(tokenRecord.error)) {
    const doc = tokenRecord.doc;
    if (exists(doc[category].chain[token])) {
      doc[category].chainSize -= 1;
      doc[category].chain[token] -= 1;
      doc[category].chainSize = resetNegative(doc[category].chainSize);
      doc[category].chain[token] = resetNegative(doc[category].chain[token]);
    }
  }
}

export async function unlearn(userId, analyzerId, text, category) {
  // generate tokens
  const tokens = tokenizer(text);

  const analyzerDbId = aDbService.getAnalyzerId(userId, analyzerId);
  const categoryId = aDbService.getCategoryId(userId, analyzerId, category);
  const tokenIds = getSortedTokenIds(userId, analyzerId, tokens);
  const analyzerRecords = await aDbService.fetchRecords([analyzerDbId, categoryId, ...tokenIds]);
  const analyzerDoc = analyzerRecords.rows[0].doc;
  const categoryRecord = analyzerRecords.rows[1];
  if (exists(categoryRecord.error)) {
    throw new BadRequestError(`${category} does not exist`);
  }

  const categoryDoc = categoryRecord.doc;

  // decrement analyzer doc count
  analyzerDoc.totalDocCount -= 1;
  analyzerDoc.totalDocCount = resetNegative(analyzerDoc.totalDocCount);
  // decrement category doc count
  categoryDoc.totalDocCount -= 1;
  categoryDoc.totalDocCount = resetNegative(categoryDoc.totalDocCount);

  // decrement tokens length from analyzer token count
  analyzerDoc.totalTokenCount -= tokens.length;
  analyzerDoc.totalTokenCount = resetNegative(analyzerDoc.totalTokenCount);
  // decrement tokens length from category token count
  categoryDoc.totalTokenCount -= tokens.length;
  categoryDoc.totalTokenCount = resetNegative(categoryDoc.totalTokenCount);

  const updates = [analyzerDoc, categoryDoc];

  let prevTokenRecord = null;
  tokens.forEach((token) => {
    const tokenId = aDbService.getAnalyzerTokenId(userId, analyzerId, token);
    const tokenRecord = binarySearchByKey(tokenId, analyzerRecords.rows, 'key');
    updateTokenRecord(tokenRecord, category, 'decrement');
    removeFromChain(token, prevTokenRecord, category);
    // if we've already added the doc to the updates list,
    if (!updates.find((item) => { return item._id === tokenId; })) {
      updates.push(tokenRecord.doc);
    }

    prevTokenRecord = tokenRecord;
  });

  // save everything in a bulk update
  await aDbService.saveRecords(updates);
}

// doing everything in one read and one write rather than calling .learn and .unlearn to speed things up
export async function relearn(userId, analyzerId, text, oldCategory, newCategory) {
  // generate tokens
  const tokens = tokenizer(text);

  const analyzerDbId = aDbService.getAnalyzerId(userId, analyzerId);
  const oldCategoryId = aDbService.getCategoryId(userId, analyzerId, oldCategory);
  const newCategoryId = aDbService.getCategoryId(userId, analyzerId, newCategory);
  const tokenIds = getSortedTokenIds(userId, analyzerId, tokens);
  const analyzerRecords = await aDbService.fetchRecords([analyzerDbId, oldCategoryId, newCategoryId, ...tokenIds]);
  const analyzerDoc = analyzerRecords.rows[0].doc;
  const oldCategoryRecord = analyzerRecords.rows[1];
  const newCategoryRecord = analyzerRecords.rows[2];
  if (exists(oldCategoryRecord.error)) {
    throw new BadRequestError(`${oldCategory} does not exist`);
  }

  const oldCategoryDoc = oldCategoryRecord.doc;
  let newCategoryDoc;
  if (exists(newCategoryRecord.error)) {
    newCategoryDoc = aDbService.generateNewCategoryDoc(userId, analyzerId, newCategory);
  } else {
    newCategoryDoc = newCategoryRecord.doc;
  }

  // decrement analyzer doc count
  analyzerDoc.totalDocCount -= 1;
  analyzerDoc.totalDocCount = resetNegative(analyzerDoc.totalDocCount);
  // decrement category doc count
  oldCategoryDoc.totalDocCount -= 1;
  oldCategoryDoc.totalDocCount = resetNegative(oldCategoryDoc.totalDocCount);

  // decrement tokens length from analyzer token count
  analyzerDoc.totalTokenCount -= tokens.length;
  analyzerDoc.totalTokenCount = resetNegative(analyzerDoc.totalTokenCount);
  // decrement tokens length from category token count
  oldCategoryDoc.totalTokenCount -= tokens.length;
  oldCategoryDoc.totalTokenCount = resetNegative(oldCategoryDoc.totalTokenCount);

  analyzerDoc.totalDocCount += 1;
  newCategoryDoc.totalDocCount += 1;
  analyzerDoc.totalTokenCount += tokens.length;
  newCategoryDoc.totalTokenCount += tokens.length;

  const updates = [analyzerDoc, oldCategoryDoc, newCategoryDoc];

  let prevTokenRecord = null;
  tokens.forEach((token) => {
    const tokenId = aDbService.getAnalyzerTokenId(userId, analyzerId, token);
    const tokenRecord = binarySearchByKey(tokenId, analyzerRecords.rows, 'key');
    updateTokenRecord(tokenRecord, oldCategory, 'decrement');
    updateTokenRecord(tokenRecord, newCategory, 'increment');
    removeFromChain(token, prevTokenRecord, oldCategory);
    addToChain(token, prevTokenRecord, newCategory);
    // if we've already added the doc to the updates list, don't do it again
    if (!updates.find((item) => { return item._id === tokenId; })) {
      updates.push(tokenRecord.doc);
    }

    prevTokenRecord = tokenRecord;
  });

  // save everything in a bulk update
  await aDbService.saveRecords(updates);
}

export function updateTokenRecord(tokenRecord, category, operation) {
  let increment = 1;
  let defaultValue = 1;

  if (operation === 'decrement') {
    increment = -1;
    defaultValue = 0;
  }

  if (!exists(tokenRecord.error)) {
    const doc = tokenRecord.doc;
    if (exists(doc[category])) {
      doc[category].count += increment;
      doc[category].count = resetNegative(doc[category].count);
    } else {
      doc[category] = {
        count: defaultValue,
        chain: {},
        chainSize: 0,
      };
    }
  } else {
    // reconfigure the doc to be recognized as one that came from the db so we can update it later in the loop
    delete tokenRecord.error; // eslint-disable-line
    const newDoc = { // eslint-disable-line
      _id: tokenRecord.key,
      type: 'token',
    };
    newDoc[category] = {
      count: defaultValue,
      chain: {},
      chainSize: 0,
    };
    tokenRecord.doc = newDoc; // eslint-disable-line
  }
}

export async function categorize(userId, analyzerId, text) {
  const NAIVE_BAYES_WEIGHT = 0.4;
  const MARKOV_WEIGHT = 0.6; // weighting things more if we've seen this run of words in this category before

  const rawResults = [];

  // generate tokens
  const tokens = tokenizer(text);

  const analyzerDbId = aDbService.getAnalyzerId(userId, analyzerId);
  const tokenIds = getSortedTokenIds(userId, analyzerId, tokens);

  // have to fetch category docs separately, since we don't know what they are without talking to the db anyway
  const analyzerRecords = await aDbService.fetchRecords([analyzerDbId, ...tokenIds]);
  const categoryRecords = await aDbService.fetchCategoryRecords(userId, analyzerId);

  const categories = categoryRecords.rows.map((catDoc) => {
    return catDoc.doc.name;
  });

  const analyzer = analyzerRecords.rows[0].doc;
  // console.log('ANALYZER TOTAL DOC COUNT', analyzer.totalDocCount);
  // console.log('ANALYZER TOTAL TOKEN COUNT', analyzer.totalTokenCount);

  // for each category
  categories.forEach((category) => {
    let pSum = 0.0;
    console.log('********');
    console.log('********');
    console.log('CATEGORY', category);
    const categoryId = aDbService.getCategoryId(userId, analyzerId, category);
    // console.log('categoryId', categoryId);
    // console.log('rows', categoryRecords.rows);
    const categoryDoc = binarySearchByKey(categoryId, categoryRecords.rows, 'key').doc;
    // const pCategory = calculatePCategory(analyzer.totalDocCount, categoryDoc.totalDocCount);
    const pCategory = calculatePCategoryViaTokenCount(analyzer.totalTokenCount, categoryDoc.totalTokenCount);
    // for each token
    let prevTokenRecord = null;
    tokens.forEach((token) => {
      console.log('token', token);
      // calculate Naive Bayes Probability for category given token
      const tokenId = aDbService.getAnalyzerTokenId(userId, analyzerId, token);
      const tokenRecord = binarySearchByKey(tokenId, analyzerRecords.rows, 'key');
      const catTokenCount = getTokenCountInCategory(tokenRecord, category);
      const allCatTokenCount = getTokenCountAllCategories(tokenRecord, categories);
      const pCategoryGivenToken = calculatePCategoryGivenToken(
        catTokenCount,
        categoryDoc.totalTokenCount,
        allCatTokenCount,
        analyzer.totalTokenCount,
        pCategory,
      );

      // calculate probability that this category's markov chain could have generated this token
      const pMarkov = calculatePCategoryGivenMarkovChain(prevTokenRecord, token, category);

      // sum probabilities so far
      console.log('pCategoryGivenToken', pCategoryGivenToken);
      console.log('pMarkov', pMarkov);
      pSum += (pCategoryGivenToken * NAIVE_BAYES_WEIGHT) + (pMarkov * MARKOV_WEIGHT);
      console.log('pSum', pSum);

      prevTokenRecord = tokenRecord;
    });
    // push total probability for this category
    rawResults.push({
      category,
      // average the sum to get the total probability
      probability: (pSum / tokens.length),
    });
  });

  const results = appendRelativeProbabilities(rawResults);

  console.log('TEXT: ', text);
  console.log('----');
  console.log('RESULTS:');
  results.forEach((result) => {
    console.log('  CATEGORY: ', result.category);
    console.log('  PROBABILITY: ', result.probability);
    console.log('  RELATIVE: ', result.relativeProbability);
    // console.log('  CONFIDENCE: ', result.confidence);
    console.log('  ------------');
  });

  // return category with highest probability
  return results.reduce((a, b) => {
    if (a.probability > b.probability) {
      return a;
    }
    return b;
  });
}

function appendRelativeProbabilities(results) {
  const pSum = results.reduce((sum, item) => {
    return sum + item.probability;
  }, 0.0);
  return results.map((item) => {
    return {
      category: item.category,
      probability: item.probability,
      relativeProbability: item.probability / pSum,
      // confidence: getConfidence(item.probability / pSum),
    };
  });
}

// function getConfidence(relativeProbability) {
//   if (relativeProbability > 0.90) {
//     return 'very strong';
//   }
//   if (relativeProbability > 0.70) {
//     return 'strong';
//   }
//   if (relativeProbability > 0.55) {
//     return 'fair';
//   }
//   if (relativeProbability > 0.50) {
//     return 'weak';
//   }
//   return 'none';
// }

// function calculatePCategory(analyzerDocCount, categoryDocCount) {
//   return categoryDocCount / analyzerDocCount;
// }

function calculatePCategoryViaTokenCount(analyzerTotalTokenCount, categoryTotalTokenCount) {
  return analyzerTotalTokenCount === 0 ? 0 : categoryTotalTokenCount / analyzerTotalTokenCount;
}

function calculatePTokenGivenCategory(tokenCountInCategory, categoryTotalTokenCount) {
  return categoryTotalTokenCount === 0 ? 0 : tokenCountInCategory / categoryTotalTokenCount;
}

function calculatePTokenGivenNotCategory(tokenCountAllCategories, tokenCountInCategory, analyzerTotalTokenCount, categoryTotalTokenCount) {
  return analyzerTotalTokenCount === 0 ? 0 : (tokenCountAllCategories - tokenCountInCategory) / (analyzerTotalTokenCount - categoryTotalTokenCount);
}

function calculatePToken(pTokenGivenCategory, pTokenGivenNotCategory, pCategory) {
  return (pTokenGivenCategory * pCategory) + (pTokenGivenNotCategory * (1 - pCategory));
}

function calculatePCategoryGivenToken(tokenCountInCategory, categoryTotalTokenCount, tokenCountAllCategories, analyzerTotalTokenCount, pCategory) {
  const pTokenGivenCategory = calculatePTokenGivenCategory(tokenCountInCategory, categoryTotalTokenCount);
  const pTokenGivenNotCategory = calculatePTokenGivenNotCategory(tokenCountAllCategories, tokenCountInCategory, analyzerTotalTokenCount, categoryTotalTokenCount);
  const pToken = calculatePToken(pTokenGivenCategory, pTokenGivenNotCategory, pCategory);
  return pToken === 0 ? 0 : (pTokenGivenCategory * pCategory) / pToken;
}

function getTokenCountInCategory(tokenRecord, category) {
  if (exists(tokenRecord) && !exists(tokenRecord.error) && exists(tokenRecord.doc[category])) {
    return tokenRecord.doc[category].count;
  }
  return 0.0;
}

function getTokenCountAllCategories(tokenRecord, categories) {
  if (exists(tokenRecord) && !exists(tokenRecord.error)) {
    return categories.reduce((sum, item) => {
      if (exists(tokenRecord.doc[item])) {
        return sum + tokenRecord.doc[item].count;
      }
      return sum;
    }, 0.0);
  }
  return 0.0;
}

// currentToken should be the word itself...
function calculatePCategoryGivenMarkovChain(prevTokenRecord, currentToken, category) {
  if (exists(prevTokenRecord)
    && !exists(prevTokenRecord.error)
    && exists(prevTokenRecord.doc[category])
    && exists(prevTokenRecord.doc[category].chain[currentToken])
  ) {
    // all words have been unlearned from the chain for this token
    if (prevTokenRecord.doc[category].chainSize === 0) {
      return 0.0;
    }
    // calculate the probability that this token could have been selected at random given the previous token
    // (number of times this token has followed the previous token / number of times any token has followed the previous token)
    return prevTokenRecord.doc[category].chain[currentToken] / prevTokenRecord.doc[category].chainSize;
  }
  return 0.0;
}

function getSortedTokenIds(userId, analyzerId, tokens) {
  const tokenIds = new Set();
  tokens.forEach((t) => {
    tokenIds.add(aDbService.getAnalyzerTokenId(userId, analyzerId, t));
  });
  return Array.from(tokenIds).sort();
}
