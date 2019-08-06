// @flow strict-local

import type {ParcelOptions, ReporterEvent} from '@parcel/types';
import type WorkerFarm from '@parcel/workers';

import {bundleToInternalBundle, NamedBundle} from './public/Bundle';
import {bus} from '@parcel/workers';
import ParcelConfig from './ParcelConfig';
import logger from '@parcel/logger';

type Opts = {|
  config: ParcelConfig,
  options: ParcelOptions,
  workerFarm: WorkerFarm
|};

export default class ReporterRunner {
  config: ParcelConfig;
  options: ParcelOptions;

  constructor(opts: Opts) {
    this.config = opts.config;
    this.options = opts.options;

    logger.onLog(event => this.report(event));

    // Convert any internal bundles back to their public equivalents as reporting
    // is public api
    bus.on('reporterEvent', event => {
      if (event.bundle == null) {
        this.report(event);
      } else {
        this.report({
          ...event,
          bundle: new NamedBundle(event.bundle, event.bundleGraph)
        });
      }
    });
  }

  async report(event: ReporterEvent) {
    let reporters = await this.config.getReporters();

    for (let reporter of reporters) {
      await reporter.report(event, this.options);
    }
  }
}

export function report(event: ReporterEvent) {
  if (event.bundle == null) {
    bus.emit('reporterEvent', event);
  } else {
    // Convert any public api bundles to their internal equivalents for
    // easy serialization
    bus.emit('reporterEvent', {
      ...event,
      bundle: bundleToInternalBundle(event.bundle)
    });
  }
}
