'use strict';

class SimpleDB {

  constructor(dbName, workerUrl) {
    this._dbName = dbName;

    this._db = new Promise((resolve, reject) => {
      let db;
      if (workerUrl && typeof SDBWorkerClient === 'function') {
        db = new SDBWorkerClient(workerUrl, dbName);
      } else if (typeof SimpleDBConnection === 'function') {
        db = new SimpleDBConnection(dbName);
      } else {
        reject('Cannot initialize database');
        return;
      }

      db.init()
        .then(() => {
          resolve(db);
        });
    });
  }

  get db() {
    return this._db;
  }

  get _data() {
    return '_data';
  }

  destroy(key) {
    return this.db
      .then(db => {
        return db.destroy(key);
      });
  }

  find() {
    return this.db
      .then(db => {
        return db.find();
      });
  }

  get(key) {
    return this.db
      .then(db => {
        return db.get(key);
      });
  }

  save(key, data) {
    return this.db
      .then(db => {
        return db.save(key, data);
      });
  }
}
