'use strict';

class SimpleDB {

  constructor(dbName) {
    if (!window.indexedDB) {
      throw new Error('browser does not support IndexedDB');
    }

    if (!dbName || typeof dbName !== 'string' || dbName.length <= 0) {
      throw new Error('invalid database names');
    }

    this.dbName = '__sdb_' + dbName;
    this._idb = window.indexedDB;

    this.init();
  }

  get db() {
    return this.init();
  }

  get _data() {
    return '_data';
  }

  destroy(key) {
    var ctx = this;
    return ctx.db
      .then(function(db) {
        return new Promise(function(resolve, reject) {
          var write = db.transaction(ctx._data, 'readwrite').objectStore(ctx._data).delete(key);
          write.onerror = function(e) {
            reject(e);
          };
          write.onsuccess = function(e) {
            resolve(write.result);
          };
        });
      });
  }

  get(key) {
    var ctx = this;
    return ctx.db
      .then(function(db) {
        return new Promise(function(resolve, reject) {
          var read = db.transaction(ctx._data).objectStore(ctx._data).get(key);
          read.onerror = function(e) {
            reject(e);
          };
          read.onsuccess = function(e) {
            resolve(read.result);
          };
        });
      });
  }

  init() {
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

  save(obj) {
    var ctx = this;
    return ctx.db
      .then(function(db) {
        return new Promise(function(resolve, reject) {
          var write = db.transaction(ctx._data, 'readwrite').objectStore(ctx._data).put(obj);
          write.onerror = function(e) {
            reject(e);
          };
          write.onsuccess = function(e) {
            resolve(obj);
          };
        });
      });
  }

  _error(e) {
    console.error('simple-db error', e.target.errorCode);
  }
}
