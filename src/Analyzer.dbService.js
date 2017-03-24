import Pouch from 'pouchdb';
import uuid from 'uuid';
import bcrypt from 'bcryptjs';

import { exists } from './Helper.service';

const db = new Pouch('https://pgriffin:8jiCZ8klsMPl93rM@rhinogram-backend.com:5984/lucy_test');

export async function addUser(name, password) {
  const id = generateUserId();
  const user = {
    _id: id,
    name,
    password: bcrypt.hashSync(password, 10),
    type: 'user',
  };
  await saveRecord(user);
  return id;
}

export async function addAnalyzer(userId, name, categories) {
  // create id, save record for analyzer
  const newRecords = [];
  const analyzerId = generateAnalyzerId();
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  const analyzer = {
    _id: dbAnalyzerId,
    name,
    totalDocCount: 0,
    totalTokenCount: 0,
    type: 'analyzer',
  };
  // await saveRecord(analyzer);
  newRecords.push(analyzer);

  // if categories exists and is longer than 0
  if (exists(categories) && exists(categories.length) && categories.length > 0) {
    categories.forEach((category) => {
      newRecords.push(generateNewCategoryDoc(userId, analyzerId, category));
    });
  }
  saveRecords(newRecords);
  return analyzer;
}

export async function removeAnalyzer(userId, analyzerId) {
  const records = await fetchAllRecordsForAnalyzer(userId, analyzerId);
  await Promise.all(records.rows.map(async (record) => {
    const doc = record.doc;
    doc._deleted = true;
    await saveRecord(doc);
  }));
}

export async function editAnalyzerName(userId, analyzerId, name) {
  const id = getAnalyzerId(userId, analyzerId);
  const analyzer = await fetchRecord(id);
  analyzer.name = name;
  await saveRecord(analyzer);
  return analyzer;
}

export async function addCategory(userId, analyzerId, name) {
  const category = generateNewCategoryDoc(userId, analyzerId, name);
  await saveRecord(category);
  return category;
}

export async function fetchAnalyzer(userId, analyzerId) {
  const startkey = getAnalyzerId(userId, analyzerId);
  const records = await db.allDocs({
    startkey,
    endkey: `${startkey}/$CAT$\uffff`,
    include_docs: true,
  });
  const [analyzer, ...categories] = records.rows;
  const categoryNames = categories.map((record) => {
    return record.doc.name;
  });
  analyzer.doc.categories = categoryNames;
  return analyzer;
}

export function fetchCategory(userId, analyzerId, name) {
  const categoryId = getCategoryId(userId, analyzerId, name);
  return fetchRecord(categoryId);
}

export function fetchAnalyzerToken(userId, analyzerId, token) {
  const tokenId = getAnalyzerTokenId(userId, analyzerId, token);
  return fetchRecord(tokenId);
}

export function fetchAnalyzerRecords(userId) {
  return db.query('analyzers', {
    startkey: userId,
    endkey: `${userId}\uffff`,
    include_docs: true,
  });
}

// get all documents associated with an analyzer
export function fetchAllRecordsForAnalyzer(userId, analyzerId) {
  const startkey = getAnalyzerId(userId, analyzerId);
  return db.allDocs({
    startkey,
    endkey: `${startkey}\uffff`,
    include_docs: true,
  });
}

export function fetchCategoryRecords(userId, analyzerId) {
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  return db.allDocs({
    startkey: `${dbAnalyzerId}/$CAT$`,
    endkey: `${dbAnalyzerId}/$CAT$\uffff`,
    include_docs: true,
  });
}

export function fetchAnalyzerTokens(userId, analyzerId) {
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  return db.allDocs({
    startkey: `${dbAnalyzerId}/$TOKEN$`,
    endkey: `${dbAnalyzerId}/$TOKEN$\uffff`,
    include_docs: true,
  });
}

export function saveRecord(record) {
  return db.put(record);
}

export function saveRecords(records) {
  return db.bulkDocs(records);
}

export function fetchRecord(id) {
  return db.get(id)
    .catch((err) => {
      if (err.status === 404) {
        return null;
      }
      throw err;
    });
}

export function fetchRecords(ids) {
  return db.allDocs({
    keys: ids,
    include_docs: true,
  });
}

function generateUserId() {
  return uuid.v4();
}

function generateAnalyzerId() {
  return uuid.v4();
}

export function generateNewCategoryDoc(userId, analyzerId, name) {
  // use analyzer id to create category id, save record for category
  const catId = getCategoryId(userId, analyzerId, name);
  return {
    _id: catId,
    name,
    totalDocCount: 0,
    totalTokenCount: 0,
    type: 'category',
  };
}

export function getAnalyzerId(userId, analyzerId) {
  return `${userId}/${analyzerId}`;
}

export function getCategoryId(userId, analyzerId, category) {
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  return `${dbAnalyzerId}/$CAT$${category}`;
}

export function getAnalyzerTokenId(userId, analyzerId, token) {
  const dbAnalyzerId = getAnalyzerId(userId, analyzerId);
  return `${dbAnalyzerId}/$TOKEN$${token}`;
}
