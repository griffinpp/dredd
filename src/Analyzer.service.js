import uuid from 'uuid';
import * as aDbService from './Analyzer.dbService';
import TextAnalyzer from './TextAnalyzer';

export async function fetchAnalyzer(id) {
  const record = await aDbService.getAnalyzerRecord(id);
  const a = new TextAnalyzer();
  a.fromJSON(record.state);
  return a;
}

export async function saveAnalyzer(id, analyzer) {
  const record = await aDbService.getAnalyzerRecord(id);
  record.state = analyzer.toJSON();
  await aDbService.saveAnalyzerRecord(record);
}

export function fetchAllAnalyzers() {
  return aDbService.getAllAnalyzers();
}

export async function categorizeText(analyzerId, text) {
  const analyzer = await fetchAnalyzer(analyzerId);
  return analyzer.categorize(text)[0];
}

export async function learnText(analyzerId, category, text) {
  const analyzer = await fetchAnalyzer(analyzerId);
  analyzer.learn(text, category);
  await saveAnalyzer(analyzerId, analyzer);
}

export async function unlearnText(analyzerId, category, text) {
  const analyzer = await fetchAnalyzer(analyzerId);
  analyzer.unlearn(text, category);
  await saveAnalyzer(analyzerId, analyzer);
}

export async function categorizeAndLearnText(analyzerId, text) {
  const analyzer = await fetchAnalyzer(analyzerId);
  const category = analyzer.categorize(text)[0];
  analyzer.learn(category, text);
  await saveAnalyzer(analyzerId, analyzer);
  return category;
}

export async function createAnalyzer(name) {
  const analyzer = new TextAnalyzer();
  return aDbService.saveAnalyzerRecord({
    _id: uuid.v4(),
    name,
    state: analyzer.toJSON(),
  });
}

export async function deleteAnalyzer(id) {
  const record = await aDbService.getAnalyzerRecord(id);
  record._deleted = true;
  await aDbService.saveAnalyzerRecord(record);
}

export async function editAnalyzerName(id, name) {
  const record = await aDbService.getAnalyzerRecord(id);
  record.name = name;
  await aDbService.saveAnalyzerRecord(record);
}