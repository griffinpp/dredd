// import uuid from 'uuid';
import tokenizer from './tokenizer';
import { exists } from './Helper.service';
import * as aDbService from './Analyzer.dbService';
// import TextAnalyzer from './TextAnalyzer';

export async function learn(userId, analyzerId, text, category) {
  const analyzer = await aDbService.fetchAnalyzer(userId, analyzerId);
  let cat = await aDbService.fetchCategory(userId, analyzerId, category);
  // create the category if it doesn't exist
  if (!exists(cat)) {
    cat = await aDbService.addCategory(userId, analyzerId, category);
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
    await aDbService.addAnalyzerToken(userId, analyzerId, token);
    // increment count for category token
    await aDbService.addCategoryToken(userId, analyzerId, category, token);
  }
}

export async function unlearn(userId, analyzerId, text, category) {
  const analyzer = await aDbService.fetchAnalyzer(userId, analyzerId);
  const cat = await aDbService.fetchCategory(userId, analyzerId, category);
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
    await aDbService.removeAnalyzerToken(userId, analyzerId, token);
    // decrement count for category token
    await aDbService.removeCategoryToken(userId, analyzerId, category, token);
  }
}

export async function relearn(userId, analyzerId, text, oldCategory, newCategory) {
  await unlearn(userId, analyzerId, text, oldCategory);
  await learn(userId, analyzerId, text, newCategory);
}

export async function categorize(userId, analyzerId, text) {
  const rawResults = [];
  let totalSum = 0.0;
  const analyzer = await aDbService.fetchAnalyzer(userId, analyzerId);
  const aTokens = await aDbService.fetchAnalyzerTokens(userId, analyzerId);
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
    const cat = await aDbService.fetchCategory(userId, analyzerId, category);
    const catTokens = await aDbService.fetchCategoryTokens(userId, analyzerId, category);
    // calculate pCategory (category.totalDocCount /analyzer.totalDocCount)
    const pCategory = cat.totalDocCount / analyzer.totalDocCount;
    // console.log('pCategory', pCategory);
    // for each token
    for (let j = 0; j < tokens.length; j++) {
      const token = tokens[j];
      const aTokenId = aDbService.getAnalyzerTokenId(userId, analyzerId, token);
      const catTokenId = aDbService.getCategoryTokenId(userId, analyzerId, category, token);
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
