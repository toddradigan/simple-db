self.importScripts('simple-db-connection.js');

self.db;

_init = function(dbName) {
  console.log('INIT', typeof SimpleDBConnection);
  return new Promise((resolve, reject) => {
    if (self.db) {
      resolve(self.db);
    }

    self.db = new SimpleDBConnection(dbName);
    resolve(self.db);
  });
}

const ops = {
  destroy: function(data) {
    if (!data.key) {
      data.error = 'key required';
      postMessage(data);
      return;
    }

    return self.db.destroy(data.key)
      .then(() => {
        data.done = true;
        data.result = true;
        postMessage(data);
      })
      .catch((err) => {
        data.error = err.message;
        postMessage(data);
      });
  },

  find: function(data) {
    return self.db.find()
      .then((results) => {
        data.done = true;
        data.result = results;
        postMessage(data);
      })
      .catch((err) => {
        data.error = err.message;
        postMessage(data);
      });
  },

  get: function(data) {
    if (!data.key) {
      data.error = 'key required';
      postMessage(data);
      return;
    }

    return self.db.get(data.key)
      .then((result) => {
        data.done = true;
        data.result = result;
        postMessage(data);
      })
      .catch((err) => {
        data.error = err.message;
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
      .then((db) => {
        data.done = true;
        data.result = true;
        postMessage(data);
      })
      .catch((err) => {
        data.error = err.message;
        postMessage(data);
      });
  },

  save: function(data) {
    return self.db.save(data.key, data.data)
      .then((result) => {
        data.done = true;
        data.result = result;
        postMessage(data);
      })
      .catch((err) => {
        data.error = err.message;
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
