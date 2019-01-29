import Route from '@ember/routing/route';
import { timeout } from 'ember-concurrency';

export default class Async extends Route {
  model() {
    return timeout(100);
  }
}
