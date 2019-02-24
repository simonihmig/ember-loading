import Service from '@ember/service';
import { gt, or } from '@ember-decorators/object/computed';
import { timeout } from 'ember-concurrency';
import { task, restartableTask } from 'ember-concurrency-decorators';
import { inject as service } from '@ember-decorators/service';
import RouterService from '@ember/routing/router-service';

type ParseArgsValue = [any, Function, any[] | undefined];

function parseArgs(...args: any[]): ParseArgsValue;
function parseArgs(): ParseArgsValue {
  let length = arguments.length;

  let args;
  let method;
  let target;

  if (length === 0) {
  } else if (length === 1) {
    target = null;
    method = arguments[0];
  } else {
    let argsIndex = 2;
    let methodOrTarget = arguments[0];
    let methodOrArgs = arguments[1];
    let type = typeof methodOrArgs;
    if (type === 'function') {
      target = methodOrTarget;
      method = methodOrArgs;
    } else if (methodOrTarget !== null && type === 'string' && methodOrArgs in methodOrTarget) {
      target = methodOrTarget;
      method = target[methodOrArgs];
    } else if (typeof methodOrTarget === 'function') {
      argsIndex = 1;
      target = null;
      method = methodOrTarget;
    }

    if (length > argsIndex) {
      let len = length - argsIndex;
      args = new Array(len);
      for (let i = 0; i < len; i++) {
        args[i] = arguments[i + argsIndex];
      }
    }
  }

  return [target, method, args];
}

export default class LoadingService extends Service {

  @service
  router!: RouterService;

  loadingDelay = 0;

  @or('_runJob.isRunning', 'routerTransitionsPending')
  isLoading!: boolean;

  @or('isLoading', 'delayTask.isRunning')
  showLoading!: boolean;

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

  // async run<T extends Function>(target: any, method: T): Promise<T>;
  // async run<T extends Function>(target: any, method: T, ...args): Promise<T>;


  // async run<T extends Function, U >(target: Function | any | null, method?: T | [], ...args: any[]): Promise<T>;
  // async run(target: any | null | undefined, method?: Function, ...args: any[]): Promise<any>;
  // async run<T extends (...args: any[]) => R, R>(method: T): Promise<R>;
  async run() {
    // @ts-ignore
    let result = await this._runJob.perform(...arguments);

    // don't await for delay
    // @ts-ignore
    this.delayTask.perform(this.loadingDelay);

    return result;
  }

  @task
  * _runJob() {
    let [target, method, args] = parseArgs(...arguments);
    return yield method.apply(target, args);
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
