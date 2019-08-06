import {registerSerializableClass} from '@parcel/utils';
import nullthrows from 'nullthrows';

import {child} from './childState';
import packageJson from '../package.json';

let HANDLE_ID = 0;
let handleIdToWorkerApi = new Map();

export default class Handle {
  constructor(opts) {
    this.id = opts?.id ?? ++HANDLE_ID;
    if (opts?.workerApi) {
      handleIdToWorkerApi.set(this.id, opts.workerApi);
    }
  }

  static deserialize(opts) {
    return function(...args) {
      let workerApi = child
        ? child.workerApi
        : nullthrows(handleIdToWorkerApi.get(opts.id));

      return workerApi.callMaster({handle: opts.id, args}, true);
    };
  }
}

// Register the Handle as a serializable class so that it will properly be deserialized
// by anything that uses WorkerFarm.
registerSerializableClass(`${packageJson.version}:Handle`, Handle);
