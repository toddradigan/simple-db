'use strict';

class SimpleDB {

  constructor(dbName, workerUrl) {
    this._dbName = dbName;

    if (workerUrl && typeof SDBWorkerClient === 'function') {
      this._worker = new SDBWorkerClient(workerUrl, this._dbName);
    } else {
      if (!indexedDB) {
        throw new Error('browser does not support IndexedDB');
      }

      if (!dbName || typeof dbName !== 'string' || dbName.length <= 0) {
        throw new Error('invalid database name');
      }

      this.dbName = '__sdb_' + this._dbName;
      this._idb = indexedDB;
    }

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

    if (ctx._worker) {
      return ctx._worker.query({operation: 'destroy', key: key});
    }

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

    if (ctx._worker) {
      return ctx._worker.query({operation: 'find'});
    }

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

    if (ctx._worker) {
      return ctx._worker.query({operation: 'get', key: key});
    }

    return ctx.db
      .then(function(db) {
        return new Promise(function(resolve, reject) {
          const read = db.transaction(ctx._data).objectStore(ctx._data).get(key);
          read.onerror = function(e) {
            reject(e);
          };
          read.onsuccess = function(e) {
            resolve(read.result.data);
          };
        });
      });
  }

  init() {
    if (this._worker) {
      return Promise.resolve(this._worker);
    }

    if (this._db) {
      return Promise.resolve(this._db);
    }

    const ctx = this;
    return new Promise(function(resolve, reject) {
      let open = ctx._idb.open(ctx.dbName);
      open.onerror = function(e) {
        ctx._db = null;
        reject('could not open database');
      };
      open.onsuccess = function(e) {
        ctx._db = open.result;
        ctx._db.onerror = ctx._error;
        resolve(ctx._db);
      };
      open.onupgradeneeded = function(e) {
        ctx._db = open.result;

        if (!ctx._db.objectStoreNames.contains(ctx._data)) {
          ctx._db.createObjectStore(ctx._data, { keyPath: '_id' });
        }

        resolve(ctx._db);
      };
    });
  }

  save(key, data) {
    const ctx = this;

    if (ctx._worker) {
      return ctx._worker.query({operation: 'save', key: key, data: data});
    }

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
