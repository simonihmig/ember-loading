import Service from '@ember/service';
import { or } from '@ember-decorators/object/computed';
import { timeout } from 'ember-concurrency';
import { restartableTask, task } from 'ember-concurrency-decorators';
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

  // @todo Revisit this stronger typing when https://github.com/typed-ember/ember-cli-typescript/issues/590 is resolved
  //
  // run<T, P1, P2, P3, P4, P5, P6, R>(target: T, fn: ((p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) => R) | keyof T, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6): Promise<R>;
  // run<T, P1, P2, P3, P4, P5, R>(target: T, fn: ((p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => R) | keyof T, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5): Promise<R>;
  // run<T, P1, P2, P3, P4, R>(target: T, fn: ((p1: P1, p2: P2, p3: P3, p4: P4) => R) | keyof T, p1: P1, p2: P2, p3: P3, p4: P4): Promise<R>;
  // run<T, P1, P2, P3, R>(target: T, fn: ((p1: P1, p2: P2, p3: P3) => R) | keyof T, p1: P1, p2: P2, p3: P3): Promise<R>;
  // run<T, P1, P2, R>(target: T, fn: ((p1: P1, p2: P2) => R) | keyof T, p1: P1, p2: P2): Promise<R>;
  // run<T, P1, R>(target: T, fn: ((p1: P1) => R) | keyof T, p1: P1): Promise<R>;
  // run<T, R>(target: T, fn: (() => R) | keyof T): Promise<R>
  // run<P1, P2, P3, P4, P5, P6, R>(fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6) => R, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5, p6: P6): Promise<R>;
  // run<P1, P2, P3, P4, P5, R>(fn: (p1: P1, p2: P2, p3: P3, p4: P4, p5: P5) => R, p1: P1, p2: P2, p3: P3, p4: P4, p5: P5): Promise<R>;
  // run<P1, P2, P3, P4, R>(fn: (p1: P1, p2: P2, p3: P3, p4: P4) => R, p1: P1, p2: P2, p3: P3, p4: P4): Promise<R>;
  // run<P1, P2, P3, R>(fn: (p1: P1, p2: P2, p3: P3) => R, p1: P1, p2: P2, p3: P3): Promise<R>;
  // run<P1, P2, R>(fn: (p1: P1, p2: P2) => R, p1: P1, p2: P2): Promise<R>;
  // run<P1, R>(fn: (p1: P1) => R, p1: P1): Promise<R>;
  // run<R>(fn: () => R): Promise<R>;
  // run<T, R>(target: T, fn: ((...args: any[]) => R) | keyof T, ...args: any[]): Promise<R>;
  // run<T, R>(target: T, fn: (() => R) | keyof T): Promise<R>;
  // run<R>(fn: (...args: any[]) => R, ...args: any[]): Promise<R>;
  // run<R>(fn: () => R): Promise<R>;
  async run(...args: any[]) {
    // @ts-ignore
    let result = await this._runJob.perform(...args);

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
