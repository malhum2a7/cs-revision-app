// src/utils/idbNotes.js

const DB_NAME = "cs_revision_db";
const DB_VERSION = 1;
const STORE = "notes";

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetNote(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const req = store.get(key);

    req.onsuccess = () => resolve(req.result?.html || "");
    req.onerror = () => reject(req.error);

    tx.oncomplete = () => db.close();
  });
}

export async function idbSetNote(key, html) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.put({ key, html: html || "" });

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);

    tx.oncomplete = () => db.close();
  });
}

export async function idbDeleteNote(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    const req = store.delete(key);

    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);

    tx.oncomplete = () => db.close();
  });
}
