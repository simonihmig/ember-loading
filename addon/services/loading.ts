import Service from '@ember/service';
import { gt, or } from '@ember-decorators/object/computed';
import { timeout } from 'ember-concurrency';
import { restartableTask } from 'ember-concurrency-decorators';

export default class LoadingService extends Service {

  /**
   * @private
   */
  counter = 0;

  loadingDelay = 20;

  @or('hasCounter', '_runJob.isRunning')
  isLoading!: boolean;

  @or('hasCounter', '_runJob.isRunning', 'delayTask.isRunning')
  showLoading!: boolean;

  @gt('counter', 0)
  hasCounter!: boolean;

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

  @restartableTask
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
