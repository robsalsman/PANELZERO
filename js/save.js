// IndexedDB persistence — chapter progress, flags, badges, verb tutorial counts.
const DB_NAME = 'panelzero';
const STORE = 'kv';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise = null;
function db() {
  if (!dbPromise) dbPromise = openDB();
  return dbPromise;
}

export async function saveGet(key, fallback = null) {
  try {
    const d = await db();
    return await new Promise((resolve, reject) => {
      const req = d.transaction(STORE, 'readonly').objectStore(STORE).get(key);
      req.onsuccess = () => resolve(req.result === undefined ? fallback : req.result);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return fallback; // e.g. private-mode Safari — play without persistence
  }
}

export async function saveSet(key, value) {
  try {
    const d = await db();
    return await new Promise((resolve, reject) => {
      const tx = d.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    /* non-fatal */
  }
}

export async function saveClear(key) {
  try {
    const d = await db();
    const tx = d.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(key);
  } catch {
    /* non-fatal */
  }
}
