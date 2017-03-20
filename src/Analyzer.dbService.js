import Pouch from 'pouchdb';
import uuid from 'uuid';

import { exists } from './Helper.service';
import * as errors from './errors';

const db = new Pouch('http://127.0.0.1:5984/lucy');

export async function addUser(name) {
  const id = generateUserId();
  const user = {
    _id: id,
    name,
    type: 'user',
  };
  await saveRecord(user);
  return id;
}

export async function addAnalyzer(userId, name, categories) {
  // create id, save record for analyzer
  const analyzerId = generateAnalyzerId();
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  const analyzer = {
    _id: dbAnalyzerId,
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
      await addCategory(userId, analyzerId, categories[i]);
    }
  }
  return analyzer;
}

export async function removeAnalyzer(userId, analyzerId) {
  const records = await fetchAllRecordsForAnalyzer(userId, analyzerId);
  for (let i = 0; i < records.rows.length; i++) {
    const doc = records.rows[i].doc;
    doc._deleted = true;
    await saveRecord(doc);
  }
}

export async function editAnalyzerName(userId, analyzerId, name) {
  const analyzer = await fetchAnalyzer(userId, analyzerId);
  analyzer.name = name;
  await saveRecord(analyzer);
  return analyzer;
}

export async function addCategory(userId, analyzerId, name) {
  // fetch analyzer
  const analyzer = await fetchAnalyzer(userId, analyzerId);

  // make sure we don't already have this category in this analyzer
  if (analyzer.categories.includes(name)) {
    throw new errors.ConflictingRecordError('That category already exists in this analyzer');
  }

  // use analyzer id to create category id, save record for category
  const catId = getCategoryId(userId, analyzerId, name);
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
export async function addAnalyzerToken(userId, analyzerId, token) {
  const existing = await fetchAnalyzerToken(userId, analyzerId, token);
  if (exists(existing)) {
    existing.count += 1;
    await saveRecord(existing);
  } else {
    const newToken = {
      _id: getAnalyzerTokenId(userId, analyzerId, token),
      type: 'analyzerToken',
      count: 1,
    };
    await saveRecord(newToken);
  }
}

export async function removeAnalyzerToken(userId, analyzerId, token) {
  const existing = await fetchAnalyzerToken(userId, analyzerId, token);
  if (existing.count > 0) {
    existing.count -= 1;
    await saveRecord(existing);
  }
}

// note that we're not updating the total count on the category itself, that will need to happen elsewhere
export async function addCategoryToken(userId, analyzerId, category, token) {
  const existing = await fetchCategoryToken(userId, analyzerId, category, token);
  if (exists(existing)) {
    existing.count += 1;
    await saveRecord(existing);
  } else {
    const newToken = {
      _id: getCategoryTokenId(userId, analyzerId, category, token),
      type: 'categoryToken',
      count: 1,
    };
    await saveRecord(newToken);
  }
}

export async function removeCategoryToken(userId, analyzerId, category, token) {
  const existing = await fetchCategoryToken(userId, analyzerId, category, token);
  if (existing.count > 0) {
    existing.count -= 1;
    await saveRecord(existing);
  }
}

export function fetchAnalyzer(userId, analyzerId) {
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  return fetchRecord(dbAnalyzerId);
}

export function fetchCategory(userId, analyzerId, name) {
  const categoryId = getCategoryId(userId, analyzerId, name);
  return fetchRecord(categoryId);
}

export function fetchAnalyzerToken(userId, analyzerId, token) {
  const tokenId = getAnalyzerTokenId(userId, analyzerId, token);
  return fetchRecord(tokenId);
}

export function fetchCategoryToken(userId, analyzerId, category, token) {
  const tokenId = getCategoryTokenId(userId, analyzerId, category, token);
  return fetchRecord(tokenId);
}

export function fetchAnalyzerRecords(userId) {
  return db.query('analyzers', {
    startkey: userId,
    endkey: `${userId}uffff`,
    include_docs: true,
  });
}

// get all documents associated with an analyzer, presumably for deletion
export function fetchAllRecordsForAnalyzer(userId, analyzerId) {
  const startkey = getAnalyzerId(userId, analyzerId);
  return db.allDocs({
    startkey,
    endkey: `${startkey}uffff`,
    include_docs: true,
  });
}

export function fetchCategoryRecords(userId, analyzerId) {
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  return db.query('categories', {
    startkey: dbAnalyzerId,
    endkey: `${dbAnalyzerId}uffff`,
    include_docs: true,
  });
}

export function fetchCategoryTokens(userId, analyzerId, category) {
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  return db.allDocs({ 
    startkey: `${dbAnalyzerId}/$CAT$${category}/$TOKEN$`,
    endkey: `${dbAnalyzerId}/$CAT$${category}/$TOKEN$uffff`,
    include_docs: true,
  });
}

export function fetchAnalyzerTokens(userId, analyzerId) {
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  return db.allDocs({
    startkey: `${dbAnalyzerId}/$TOKEN$`,
    endkey: `${dbAnalyzerId}/$TOKEN$uffff`,
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

function generateUserId() {
  return uuid.v4();
}

function generateAnalyzerId() {
  return uuid.v4();
}

export function getAnalyzerId(userId, analyzerId) {
  return `${userId}/${analyzerId}`;
}

export function getCategoryId(userId, analyzerId, category) {
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  return `${dbAnalyzerId}/$CAT$${category}`
}

export function getAnalyzerTokenId(userId, analyzerId, token) {
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  return `${dbAnalyzerId}/$TOKEN$${token}`
}

export function getCategoryTokenId(userId, analyzerId, category, token) {
  const catId = getCategoryId(userId, analyzerId, category);
  return `${catId}/$TOKEN$${token}`;
}
