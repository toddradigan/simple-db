'use strict';

class SimpleDBConnection {

  constructor(dbName) {
    this._dbName = dbName;

    if (!indexedDB) {
      throw new Error('browser does not support IndexedDB');
    }

    if (!dbName || typeof dbName !== 'string' || dbName.length <= 0) {
      throw new Error('invalid database name');
    }

    this.dbName = '__sdb_' + this._dbName;

    this.init();
  }

  get db() {
    return this.init();
  }

  get _data() {
    return '_data';
  }

  destroy(key) {
    const ctx = this;

    return ctx.db
      .then(function(db) {
        return new Promise(function(resolve, reject) {
          const write = db.transaction(ctx._data, 'readwrite').objectStore(ctx._data).delete(key);
          write.onerror = function(e) {
            reject(e);
          };
          write.onsuccess = function(e) {
            resolve(write.result);
          };
        });
      });
  }

  find() {
    const ctx = this;

    return ctx.db
      .then(function(db) {
        return new Promise(function(resolve, reject) {
          const read = db.transaction(ctx._data).objectStore(ctx._data).openCursor();
          const results = [];
          read.onerror = function(e) {
            reject(e);
          };
          read.onsuccess = function(e) {
            const cursor = e.target.result;
            if (cursor) {
              if (cursor.value && cursor.value.data) {
                results.push(cursor.value.data);
              }
              cursor.continue();
            } else {
              resolve(results);
            }
          };
        });
      });
  }

  get(key) {
    const ctx = this;

    return ctx.db
      .then(function(db) {
        return new Promise(function(resolve, reject) {
          const read = db.transaction(ctx._data).objectStore(ctx._data).get(key);
          read.onerror = function(e) {
            reject(e);
          };
          read.onsuccess = function(e) {
            resolve(read.result && read.result.data);
          };
        });
      });
  }

  init() {
    if (this._db) {
      return this._db;
    }

    const ctx = this;
    this._db = new Promise(function(resolve, reject) {
      let open = indexedDB.open(ctx.dbName);
      open.onerror = function(e) {
        reject('could not open database');
      };
      open.onsuccess = function(e) {
        const db = open.result;
        db.onerror = ctx._error;
        resolve(db);
      };
      open.onupgradeneeded = function(e) {
        const db = open.result;

        if (!db.objectStoreNames.contains(ctx._data)) {
          db.createObjectStore(ctx._data, { keyPath: '_id' });
        }

        resolve(db);
      };
    });
  }

  save(key, data) {
    const ctx = this;

    const obj = {
      _id: key,
      data: data
    };

    return ctx.db
      .then(function(db) {
        return new Promise(function(resolve, reject) {
          const write = db.transaction(ctx._data, 'readwrite').objectStore(ctx._data).put(obj);
          write.onerror = function(e) {
            reject(e);
          };
          write.onsuccess = function(e) {
            resolve(data);
          };
        });
      });
  }

  _error(e) {
    console.error('simple-db error', e.target.errorCode);
  }
}
