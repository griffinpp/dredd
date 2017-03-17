import Pouch from 'pouchdb';
import uuid from 'uuid';

import { exists } from './Helper.service';
import * as errors from './errors';

const db = new Pouch('http://127.0.0.1:5984/lucy');

export async function getAllAnalyzers() {
  const result = await db.query('names/all');
  return result.rows;
}

export function getAnalyzerRecord(id) {
  return db.get(id);
}

export function saveAnalyzerRecord(analyzer) {
  return db.put(analyzer);
}

export async function addAnalyzer(name, categories) {
  // create id, save record for analyzer
  const id = generateAnalyzerId();
  const analyzer = {
    _id: id,
    name,
    totalDocCount: 0,
    totalTokenCount: 0,
    categories: [],
    type: 'analyzer',
  };
  await saveRecord(analyzer);

  // if categories exists and is longer than 0
  if (exists(categories) && exists(categories.length) && categories.length > 0) {
    for (let i = 0; i < categories.length; i++) {
      await addCategory(id, categories[i]);
    }
  }
  return id;
}

export async function addCategory(analyzerId, name) {
  // fetch analyzer
  const analyzer = await fetchAnalyzer(analyzerId);

  // make sure we don't already have this category in this analyzer
  if (analyzer.categories.includes(name)) {
    throw new errors.ConflictingRecordError('That category already exists in this analyzer');
  }

  // use analyzer id to create category id, save record for category
  const catId = getCategoryId(analyzerId, name);
  const category = {
    _id: catId,
    name,
    totalDocCount: 0,
    totalTokenCount: 0,
    type: 'category',
  };
  await saveRecord(category);

  // update categories list on analyzer and save
  analyzer.categories.push(name);
  const cat = await saveRecord(analyzer);

  return cat;
}

// note that we're not updating the total count on the analyzer itself, that will need to happen elsewhere
export async function addAnalyzerToken(analyzerId, token) {
  const existing = await fetchAnalyzerToken(analyzerId, token);
  if (exists(existing)) {
    existing.count += 1;
    await saveRecord(existing);
  } else {
    const newToken = {
      _id: getAnalyzerTokenId(analyzerId, token),
      type: 'analyzerToken',
      count: 1,
    };
    await saveRecord(newToken);
  }
}

export async function removeAnalyzerToken(analyzerId, token) {
  const existing = await fetchAnalyzerToken(analyzerId, token);
  if (existing.count > 0) {
    existing.count -= 1;
    await saveRecord(existing);
  }
}

// note that we're not updating the total count on the category itself, that will need to happen elsewhere
export async function addCategoryToken(analyzerId, category, token) {
  const existing = await fetchCategoryToken(analyzerId, category, token);
  if (exists(existing)) {
    existing.count += 1;
    await saveRecord(existing);
  } else {
    const newToken = {
      _id: getCategoryTokenId(analyzerId, category, token),
      type: 'categoryToken',
      count: 1,
    };
    await saveRecord(newToken);
  }
}

export async function removeCategoryToken(analyzerId, category, token) {
  const existing = await fetchCategoryToken(analyzerId, category, token);
  if (existing.count > 0) {
    existing.count -= 1;
    await saveRecord(existing);
  }
}

export function fetchAnalyzer(analyzerId) {
  return fetchRecord(analyzerId);
}

export function fetchCategory(analyzerId, name) {
  const categoryId = getCategoryId(analyzerId, name);
  return fetchRecord(categoryId);
}

export function fetchAnalyzerToken(analyzerId, token) {
  const tokenId = getAnalyzerTokenId(analyzerId, token);
  return fetchRecord(tokenId);
}

export function fetchCategoryToken(analyzerId, category, token) {
  const tokenId = getCategoryTokenId(analyzerId, category, token);
  return fetchRecord(tokenId);
}

export function fetchAnalyzerRecords() {
  return db.query('analyzers', {
    include_docs: false,
  });
}

export function fetchCategoryRecords(analyzerId) {
  return db.query('categories', {
    startkey: `${analyzerId}`,
    endkey: `${analyzerId}uffff`,
    include_docs: true,
  });
}

export function fetchCategoryTokens(analyzerId, category) {
  return db.allDocs({ 
    startkey: `${analyzerId}/$CAT$${category}/$TOKEN$`,
    endkey: `${analyzerId}/$CAT$${category}/$TOKEN$uffff`,
    include_docs: true,
  });
}

export function fetchAnalyzerTokens(analyzerId) {
  return db.allDocs({
    startkey: `${analyzerId}/$TOKEN$`,
    endkey: `${analyzerId}/$TOKEN$uffff`,
    include_docs: true,
  });
}

export function saveRecord(record) {
  return db.put(record);
}

export function fetchRecord(id) {
  return db.get(id)
    .catch((err) => {
      if (err.status === 404) {
        return null;
      }
      throw err;
    })
}

function generateAnalyzerId() {
  return uuid.v4();
}

export function getCategoryId(analyzerId, category) {
  return `${analyzerId}/$CAT$${category}`
}

export function getAnalyzerTokenId(analyzerId, token) {
  return `${analyzerId}/$TOKEN$${token}`
}

export function getCategoryTokenId(analyzerId, category, token) {
  const catId = getCategoryId(analyzerId, category);
  return `${catId}/$TOKEN$${token}`;
}
