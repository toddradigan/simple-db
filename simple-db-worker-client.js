'use strict';

class SDBWorkerClient {
  constructor(url, dbName, onError) {
    this.requestId = 0;
    this.worker = new Worker(url);

    if (onError) {
      this.worker.onerror = onError;
    }

    if (dbName) {
      this.query({operation: 'init', dbName: dbName});
    }
  }

  query(data) {
    var id = this.requestId++;
    data._id = id;

    var ctx = this;

    return new Promise(function(resolve, reject) {
      ctx.worker.addEventListener('message', function onMessage(e) {
        if (e.data && e.data._id === id) {
          if (e.data.error) {
            ctx.worker.removeEventListener('message', onMessage);
            reject(e.data.error);
          }

          if (e.data.result) {
            ctx.worker.removeEventListener('message', onMessage);
            resolve(e.data.result);
          } else if (e.data.partial) {
            //fire result event
            // console.log('partial result', e.data.partial);
          }
        }
      });

      ctx.worker.postMessage(data);
    });
  }

  terminate() {
    this.worker.terminate();
  }
}
