'use strict';

class SimpleDB {

  constructor(dbName, workerUrl) {
    this._dbName = dbName;

    if (workerUrl && typeof SDBWorkerClient === 'function') {
      this._db = new SDBWorkerClient(workerUrl, this._dbName);
    } else if (typeof SimpleDBDirect === 'function') {
      this._db = new SimpleDBDirect(this._dbName);
    }
  }

  get db() {
    return this._db;
  }

  get _data() {
    return '_data';
  }

  destroy(key) {
    return this.db.destroy(key);
  }

  find() {
    return this.db.find();
  }

  get(key) {
    return this.db.get(key);
  }

  save(key, data) {
    return this.db.save(key, data);
  }
}
