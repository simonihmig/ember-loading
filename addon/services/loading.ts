import Service from '@ember/service';
import { gt, or } from '@ember-decorators/object/computed';
import { timeout } from 'ember-concurrency';
import { task, restartableTask } from 'ember-concurrency-decorators';
import { inject as service } from '@ember-decorators/service';
import RouterService from '@ember/routing/router-service';

export default class LoadingService extends Service {

  @service
  router!: RouterService;

  /**
   * @private
   */
  counter = 0;

  loadingDelay = 20;

  @or('hasCounter', '_runJob.isRunning', 'routerTransitionsPending')
  isLoading!: boolean;

  @or('isLoading', 'delayTask.isRunning')
  showLoading!: boolean;

  @gt('counter', 0)
  hasCounter!: boolean;

  routerTransitionsPending = false;

  _routeWillChange = () => this.set('routerTransitionsPending', true);
  _routeDidChange = () => this.set('routerTransitionsPending', false);

  constructor() {
    super(...arguments);

    this.router.on('routeWillChange', this._routeWillChange);
    this.router.on('routeDidChange', this._routeDidChange);
  }

  willDestroy() {
    super.willDestroy();

    this.router.off('routeWillChange', this._routeWillChange);
    this.router.off('routeDidChange', this._routeDidChange);
  }

  /**
   * Call this when starting a load action
   *
   * @method start
   * @public
   */
  start() {
    this.incrementProperty('counter');
  }

  /**
   * Call this when loading action has finished
   *
   * @method stop
   * @public
   */
  stop() {
    this.decrementProperty('counter');
  }

  async runJob(job: () => any, delay = this.loadingDelay) {
    // @ts-ignore
    await this._runJob.perform(job);

    // don't await for delay
    // @ts-ignore
    this.delayTask.perform(delay);
  }

  @task
  * _runJob(job: () => any) {
    yield job();
  }

  @restartableTask
  * delayTask(delay: number) {
    yield timeout(delay);
  }
}

// DO NOT DELETE: this is how TypeScript knows how to look up your services.
declare module '@ember/service' {
  interface Registry {
    'loading': LoadingService;
  }
}
