self.db;
self.dbName;
self._data = '_data';

_init = function(dbName) {
  if (self.db) {
    return self.db;
  }

  if (!indexedDB) {
    throw new Error('browser does not support IndexedDB');
  }

  if (!dbName || typeof dbName !== 'string' || dbName.length <= 0) {
    throw new Error('invalid database names');
  }

  const ctx = self;
  ctx.dbName = '__sdb_' + dbName;

  self.db = new Promise(function(resolve, reject) {
    const open = indexedDB.open(ctx.dbName);
    open.onerror = function(e) {
      reject('could not open database');
    };
    open.onsuccess = function(e) {
      resolve(open.result);
    };
    open.onupgradeneeded = function(e) {
      const db = open.result;

      if (!db.objectStoreNames.contains(ctx._data)) {
        db.createObjectStore(ctx._data, { keyPath: '_id' });
      }

      resolve(db);
    };
  });

  return self.db;
}

const ops = {
  destroy: function(data) {
    if (!data.key) {
      data.error = 'key required';
      postMessage(data);
      return;
    }

    const ctx = self;
    return ctx._init()
      .then(function(db) {
        const write = db.transaction(ctx._data, 'readwrite').objectStore(ctx._data).delete(data.key);
        write.onerror = function(error) {
          data.error = e;
          postMessage(data);
        };
        write.onsuccess = function(e) {
          data.done = true;
          data.result = true;
          postMessage(data);
        };
      })
      .catch(function(error) {
        data.error = error;
        postMessage(data);
      });
  },

  find: function(data) {
    const ctx = self;
    return ctx._init()
      .then(function(db) {
        const read = db.transaction(ctx._data).objectStore(ctx._data).openCursor();
        const results = [];
        read.onerror = function(error) {
          data.error = error;
          postMessage(data);
        };
        read.onsuccess = function(e) {
          const cursor = e.target.result;
          if (cursor) {
            if (cursor.value && cursor.value.data) {
              results.push(cursor.value.data);
              postMessage(Object.assign({}, data, {partial: cursor.value.data}));
            }
            cursor.continue();
          } else {
            data.done = true;
            data.result = results;
            postMessage(data);
          }
        };
      })
      .catch(function(error) {
        data.error = error;
        postMessage(data);
      });
  },

  get: function(data) {
    if (!data.key) {
      data.error = 'key required';
      postMessage(data);
      return;
    }

    const ctx = self;
    return ctx._init()
      .then(function(db) {
        const read = db.transaction(ctx._data).objectStore(ctx._data).get(data.key);
        read.onerror = function(error) {
          data.error = error;
          postMessage(data);
        };
        read.onsuccess = function(e) {
          data.done = true;
          data.result = read.result && read.result.data;
          postMessage(data);
        };
      })
      .catch(function(error) {
        data.error = error;
        postMessage(data);
      });
  },

  init: function(data) {
    if (!data.dbName) {
      data.error = 'dbName name required';
      postMessage(data);
      return;
    }

    self._init(data.dbName)
      .then(function(db) {
        data.done = true;
        data.result = true;
        postMessage(data);
      })
      .catch(function(error) {
        data.error = error;
        postMessage(data);
      });
  },

  save: function(data) {
    const ctx = self;
    const obj = {
      _id: data.key,
      data: data.data
    };

    return ctx._init()
      .then(function(db) {
        const write = db.transaction(ctx._data, 'readwrite').objectStore(ctx._data).put(obj);
        write.onerror = function(e) {
          data.error = e;
          postMessage(data);
        };
        write.onsuccess = function(e) {
          data.done = true;
          data.result = obj.data;
          postMessage(data);
        };
      })
      .catch(function(error) {
        data.error = error;
        postMessage(data);
      });
  }
};

onmessage = function(e) {
  if (e.data && e.data.operation && ops[e.data.operation]) {
    ops[e.data.operation].call(self, e.data);
  } else {
    e.data.error = 'invalid operation';
    postMessage(e.data);
  }
}
