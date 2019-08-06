// @flow strict-local

import type {WorkerApi} from './';

import {registerSerializableClass} from '@parcel/utils';
import nullthrows from 'nullthrows';

import {child} from './childState';
// $FlowFixMe this is untyped
import packageJson from '../package.json';

let HANDLE_ID = 0;
let handleIdToWorkerApi = new Map();

type HandleOpts = {|
  id?: number,
  workerApi?: WorkerApi
|};

export default class Handle {
  id: number;

  constructor(opts: HandleOpts) {
    this.id = opts?.id ?? ++HANDLE_ID;
    if (opts?.workerApi) {
      handleIdToWorkerApi.set(this.id, opts.workerApi);
    }
  }

  dispose() {
    handleIdToWorkerApi.delete(this.id);
  }

  static deserialize(opts: {|id: number|}) {
    return function(...args: Array<mixed>) {
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
