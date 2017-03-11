import Pouch from 'pouchdb';
// import uuid from 'uuid';

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
