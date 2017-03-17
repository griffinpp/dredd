// import uuid from 'uuid';
import tokenizer from './tokenizer';
import { exists } from './Helper.service';
import * as aDbService from './Analyzer.dbService';
// import TextAnalyzer from './TextAnalyzer';

export async function learn(analyzerId, text, category) {
  const analyzer = await aDbService.fetchAnalyzer(analyzerId);
  let cat = await aDbService.fetchCategory(analyzerId, category);
  // create the category if it doesn't exist
  if (!exists(cat)) {
    cat = await aDbService.addCategory(analyzerId, category);
  }
  // increment analyzer doc count
  analyzer.totalDocCount += 1;
  // increment category doc count
  cat.totalDocCount += 1;
  // generate tokens
  const tokens = tokenizer(text);
  // add tokens length to analyzer token count
  analyzer.totalTokenCount += tokens.length;
  // add tokens length to category token count
  cat.totalTokenCount += tokens.length;

  await aDbService.saveRecord(analyzer);
  await aDbService.saveRecord(cat);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    // increment count for analyzer token
    await aDbService.addAnalyzerToken(analyzerId, token);
    // increment count for category token
    await aDbService.addCategoryToken(analyzerId, category, token);
  }
}

export async function unlearn(analyzerId, text, category) {
  const analyzer = await aDbService.fetchAnalyzer(analyzerId);
  const cat = await aDbService.fetchCategory(analyzerId, category);
  // decrement analyzer doc count
  analyzer.totalDocCount -= 1;
  // decrement category doc count
  cat.totalDocCount -= 1;
  // generate tokens
  const tokens = tokenizer(text);
  // subtract tokens.length from analyzer token count
  analyzer.totalTokenCount -= tokens.length;
  // subtract tokens.length from category token count
  cat.totalTokenCount -= tokens.length;

  await aDbService.saveRecord(analyzer);
  await aDbService.saveRecord(cat);
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    // decrement count for analyzer token
    await aDbService.removeAnalyzerToken(analyzerId, token);
    // decrement count for category token
    await aDbService.removeCategoryToken(analyzerId, category, token);
  }
}

export async function categorize(analyzerId, text) {
  const rawResults = [];
  let totalSum = 0.0;
  const analyzer = await aDbService.fetchAnalyzer(analyzerId);
  const aTokens = await aDbService.fetchAnalyzerTokens(analyzerId);
  // get list of categories from analyzer
  // generate tokens
  const tokens = tokenizer(text);
  // for each category
  for (let i = 0; i < analyzer.categories.length; i++) {
    let pSum = 0.0;
    const category = analyzer.categories[i];
    // console.log('********');
    // console.log('********');
    // console.log('CATEGORY', category);
    const cat = await aDbService.fetchCategory(analyzerId, category);
    const catTokens = await aDbService.fetchCategoryTokens(analyzerId, category);
    // calculate pCategory (category.totalDocCount /analyzer.totalDocCount)
    const pCategory = cat.totalDocCount / analyzer.totalDocCount;
    // console.log('pCategory', pCategory);
    // for each token
    for (let j = 0; j < tokens.length; j++) {
      const token = tokens[j];
      const aTokenId = aDbService.getAnalyzerTokenId(analyzerId, token);
      const catTokenId = aDbService.getCategoryTokenId(analyzerId, category, token);
      // console.log('----');
      // console.log('TOKEN: ', token);
      const aToken = aTokens.rows.find((t) => {
        return t.id === aTokenId;
      });
      const aTokenCount = exists(aToken) ? aToken.doc.count : 0;
      // console.log('aTokenCount', aTokenCount);
      const catToken = catTokens.rows.find((t) => {
        return t.id === catTokenId;
      });
      const catTokenCount = exists(catToken) ? catToken.doc.count : 0;
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
    }
    // push total probability for this category
    rawResults.push({
      category,
      probability: pSum,
    });
    // sum raw probabilities to calculate a relative probability later
    totalSum += pSum;
  }

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

// export async function feedback(analyzerId, text) {
//   // categorize, then learn
// }

// export async function fetchAnalyzer(id) {
//   const record = await aDbService.getAnalyzerRecord(id);
//   const a = new TextAnalyzer();
//   a.fromJSON(record.state);
//   return a;
// }

// export async function saveAnalyzer(id, analyzer) {
//   const record = await aDbService.getAnalyzerRecord(id);
//   record.state = analyzer.toJSON();
//   await aDbService.saveAnalyzerRecord(record);
// }

// export function fetchAllAnalyzers() {
//   return aDbService.getAllAnalyzers();
// }

// export async function categorizeText(analyzerId, text) {
//   const analyzer = await fetchAnalyzer(analyzerId);
//   return analyzer.categorize(text)[0];
// }

// export async function learnText(analyzerId, category, text) {
//   const analyzer = await fetchAnalyzer(analyzerId);
//   analyzer.learn(text, category);
//   await saveAnalyzer(analyzerId, analyzer);
// }

// export async function unlearnText(analyzerId, category, text) {
//   const analyzer = await fetchAnalyzer(analyzerId);
//   analyzer.unlearn(text, category);
//   await saveAnalyzer(analyzerId, analyzer);
// }

// export async function categorizeAndLearnText(analyzerId, text) {
//   const analyzer = await fetchAnalyzer(analyzerId);
//   const category = analyzer.categorize(text)[0];
//   analyzer.learn(category, text);
//   await saveAnalyzer(analyzerId, analyzer);
//   return category;
// }

// export async function recategorizeText(analyzerId, oldCategory, newCategory, text) {
//   const analyzer = await fetchAnalyzer(analyzerId);
//   analyzer.unlearn(text, oldCategory);
//   analyzer.learn(text, newCategory);
//   await saveAnalyzer(analyzerId, analyzer);
// }

// export async function createAnalyzer(name) {
//   const analyzer = new TextAnalyzer();
//   return aDbService.saveAnalyzerRecord({
//     _id: uuid.v4(),
//     name,
//     state: analyzer.toJSON(),
//   });
// }

// export async function deleteAnalyzer(id) {
//   const record = await aDbService.getAnalyzerRecord(id);
//   record._deleted = true;
//   await aDbService.saveAnalyzerRecord(record);
// }

// export async function editAnalyzerName(id, name) {
//   const record = await aDbService.getAnalyzerRecord(id);
//   record.name = name;
//   await aDbService.saveAnalyzerRecord(record);
// }
