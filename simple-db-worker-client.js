'use strict';

class SDBWorkerClient {
  constructor(url, dbName, onError) {
    this.requestId = 0;
    this.requests = new Map();
    this.worker = new Worker(url);

    if (onError) {
      this.worker.onerror = onError;
    }

    if (dbName) {
      this.query({operation: 'init', dbName: dbName});
    }

    this.worker.onmessage = function(e) {
      const deferred = this.requests.get(e.data && e.data._id);
      if (deferred) {
        if (e.data.error) {
          this.requests.delete(e.data._id);
          deferred.reject(e.data.error);
        }

        if (e.data.result || e.data.done) {
          this.requests.delete(e.data._id);
          deferred.resolve(e.data.result);
        } else if (e.data.partial) {
          //fire result event
          // console.log('partial result', e.data.partial);
        }
      }
    }.bind(this);
  }

  query(data) {
    const id = this.requestId++;
    data._id = id;

    const deferred = new Deferred();
    this.requests.set(id, deferred);

    this.worker.postMessage(data);
    return deferred.promise;
  }

  terminate() {
    this.worker.terminate();
  }
}
