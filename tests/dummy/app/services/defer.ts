import Service from '@ember/service';
import RSVP, { defer } from 'rsvp';

export default class DeferService extends Service {

  deferred!: RSVP.Deferred<void>;

  constructor() {
    super(...arguments);
    this.set('deferred', defer());
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'defer': DeferService;
  }
}
