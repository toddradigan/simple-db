self.db;
self.dbName;
self._data = '_data';

_init = function(dbName) {
  if (self.db) {
    return Promise.resolve(self.db);
  }

  if (!indexedDB) {
    throw new Error('browser does not support IndexedDB');
  }

  if (!dbName || typeof dbName !== 'string' || dbName.length <= 0) {
    throw new Error('invalid database names');
  }

  const ctx = self;
  ctx.dbName = '__sdb_' + dbName;

  return new Promise(function(resolve, reject) {
    let open = indexedDB.open(ctx.dbName);
    open.onerror = function(e) {
      ctx.db = null;
      reject('could not open database');
    };
    open.onsuccess = function(e) {
      ctx.db = open.result;
      resolve(ctx.db);
    };
    open.onupgradeneeded = function(e) {
      ctx.db = open.result;

      if (!ctx.db.objectStoreNames.contains(ctx._data)) {
        ctx.db.createObjectStore(ctx._data, { keyPath: '_id' });
      }

      resolve(ctx.db);
    };
  });
}

var ops = {
  destroy: function(data) {
    if (!data.key) {
      data.error = 'key required';
      postMessage(data);
      return;
    }

    var ctx = self;
    return ctx._init()
      .then(function(db) {
        var write = db.transaction(ctx._data, 'readwrite').objectStore(ctx._data).delete(data.key);
        write.onerror = function(error) {
          data.error = e;
          postMessage(data);
        };
        write.onsuccess = function(e) {
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
    var ctx = self;
    return ctx._init()
      .then(function(db) {
        var read = db.transaction(ctx._data).objectStore(ctx._data).openCursor();
        var results = [];
        read.onerror = function(error) {
          data.error = error;
          postMessage(data);
        };
        read.onsuccess = function(e) {
          var cursor = e.target.result;
          if (cursor) {
            if (cursor.value && cursor.value.data) {
              results.push(cursor.value.data);
              var d = Object.assign({}, data, {partial: cursor.value.data});
              postMessage(d);
            }
            cursor.continue();
          } else {
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

    var ctx = self;
    return ctx._init()
      .then(function(db) {
        var read = db.transaction(ctx._data).objectStore(ctx._data).get(data.key);
        read.onerror = function(error) {
          data.error = error;
          postMessage(data);
        };
        read.onsuccess = function(e) {
          data.result = read.result.data;
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
        data.result = true;
        postMessage(data);
      })
      .catch(function(error) {
        data.error = error;
        postMessage(data);
      });
  },

  save: function(data) {
    var ctx = self;
    var obj = {
      _id: data.key,
      data: data.data
    };

    return ctx._init()
      .then(function(db) {
        var write = db.transaction(ctx._data, 'readwrite').objectStore(ctx._data).put(obj);
        write.onerror = function(e) {
          data.error = e;
          postMessage(data);
        };
        write.onsuccess = function(e) {
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
