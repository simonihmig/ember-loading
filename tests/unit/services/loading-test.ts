import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { timeout } from 'ember-concurrency';
import LoadingService from 'ember-loading/services/loading';
import { defer } from 'rsvp';
import Service from '@ember/service';
import Evented from '@ember/object/evented';
import { settled } from '@ember/test-helpers';

module('Unit | Service | loading', function(hooks) {
  setupTest(hooks);

  module('run', function() {
    test('can run async jobs', async function(assert) {
      let deferred = defer();
      let called = 0;
      let job = () => {
        called++;
        return deferred.promise;
      };

      let service: LoadingService = this.owner.lookup('service:loading');
      assert.notOk(service.isLoading, 'it is not loading before run has started');
      assert.notOk(service.showLoading, 'it is not showing loading state before run has started');

      let promise = service.run(job);
      assert.equal(called, 1, 'job has been called');
      assert.ok(service.isLoading, 'it is loading after run has started');
      assert.ok(service.showLoading, 'it is showing loading state after run has started');

      deferred.resolve();
      await promise;
      assert.notOk(service.isLoading, 'it is not loading after run has finished');
      assert.notOk(service.showLoading, 'it is not showing loading state after run has finished');
    });

    test('waits for all async jobs', async function(assert) {
      let deferred1 = defer();
      let deferred2 = defer();

      let service: LoadingService = this.owner.lookup('service:loading');
      assert.notOk(service.isLoading, 'it is not loading before run has started');
      assert.notOk(service.showLoading, 'it is not showing loading state before run has started');

      let promise1 = service.run(() => deferred1.promise);
      assert.ok(service.isLoading, 'it is loading after first run has started');
      assert.ok(service.showLoading, 'it is showing loading state after first run has started');

      let promise2 = service.run(() => deferred2.promise);
      assert.ok(service.isLoading, 'it is loading after second run has started');
      assert.ok(service.showLoading, 'it is showing loading state after second run has started');

      deferred1.resolve();
      await promise1;
      assert.ok(service.isLoading, 'it is still loading after first run has finished');
      assert.ok(service.showLoading, 'it is showing loading state after first run has finished');

      deferred2.resolve();
      await promise2;
      assert.notOk(service.isLoading, 'it is not loading after second run has finished');
      assert.notOk(service.showLoading, 'it is not showing loading state after second run has finished');
    });

    test('passes args', async function(assert) {
      assert.expect(2);
      let job = function(a: number, b: string) {
        assert.equal(a, 2);
        assert.equal(b, 'foo');
      };

      let service: LoadingService = this.owner.lookup('service:loading');
      await service.run(job, 2, 'foo');
    });

    // used to test the typing
    test('passes many args', async function(assert) {
      assert.expect(1);
      let job = function() {
        assert.equal(arguments.length, 6);
      };

      let service: LoadingService = this.owner.lookup('service:loading');
      await service.run(job, 2, 'foo', 2, 'foo', 2, 'foo');
    });

    test('context', async function(assert) {
      assert.expect(1);
      let context = {};
      let job = function(this: any) {
        assert.equal(this, context);
      };

      let service: LoadingService = this.owner.lookup('service:loading');
      await service.run(context, job);
    });

    test('context with args', async function(assert) {
      assert.expect(3);
      let context = {};
      let job = function(this: any, a: number, b: string) {
        assert.equal(this, context);
        assert.equal(a, 2);
        assert.equal(b, 'foo');
      };

      let service: LoadingService = this.owner.lookup('service:loading');
      await service.run(context, job, 2, 'foo');
    });

    test('return promise value', async function(assert) {
      let job = async () => 'foo';

      let service: LoadingService = this.owner.lookup('service:loading');
      let promise = service.run(job);
      let result = await promise;
      assert.equal(result, 'foo');
    });

    test('method lookup', async function(assert) {
      assert.expect(4);
      let context;

      class Foo {
        job(arg1: number, arg2: string) {
          context = this;
          assert.equal(arg1, 1);
          assert.equal(arg2, 'foo');
          return 'foo';
        }
      }
      let foo = new Foo;

      let service: LoadingService = this.owner.lookup('service:loading');
      let result = await service.run(foo, 'job', 1, 'foo');

      assert.equal(result, 'foo');
      assert.equal(context, foo);
    });

    test('supports postDelay', async function(assert) {
      let deferred = defer();
      let job = () => deferred.promise;
      let Service: typeof LoadingService = this.owner.factoryFor('service:loading');
      let service: LoadingService = Service.create({
        postDelay: 10
      });
      assert.notOk(service.isLoading, 'it is not loading before run has started');
      assert.notOk(service.showLoading, 'it is not showing loading state before run has started');

      let promise = service.run(job);
      assert.ok(service.isLoading, 'it is loading after run has started');
      assert.ok(service.showLoading, 'it is showing loading state after run has started');

      deferred.resolve();
      await promise;
      assert.notOk(service.isLoading, 'it is not loading after run has finished');
      assert.ok(service.showLoading, 'it is showing loading state after run has finished');

      await timeout(2);
      assert.notOk(service.isLoading, 'it is not loading after run has finished, but postDelay has not finished');
      assert.ok(service.showLoading, 'it is showing loading state after run has finished, but postDelay has not finished');

      await timeout(10);
      assert.notOk(service.isLoading, 'it is not loading after run has finished and postDelay has finished');
      assert.notOk(service.showLoading, 'it is not showing loading state after run has finished and postDelay has finished');
    });

    test('supports preDelay', async function(assert) {
      let deferred = defer();
      let job = () => deferred.promise;
      let Service: typeof LoadingService = this.owner.factoryFor('service:loading');
      let service: LoadingService = Service.create({
        preDelay: 10
      });
      assert.notOk(service.isLoading, 'it is not loading before run has started');
      assert.notOk(service.showLoading, 'it is not showing loading state before run has started');

      let promise = service.run(job);
      assert.ok(service.isLoading, 'it is loading after run has started');
      assert.notOk(service.showLoading, 'it is not showing loading state after run has started but preDely has not finished');

      await timeout(15);
      assert.ok(service.isLoading, 'it is loading after run has started and preDelay has finished');
      assert.ok(service.showLoading, 'it is showing loading state after run has started and preDelay has finished');

      deferred.resolve();
      await promise;
      assert.notOk(service.isLoading, 'it is not loading after run has finished');
      assert.notOk(service.showLoading, 'it is not showing loading state after run has finished');
    });

    test('reads config', async function(assert) {

      let config = this.owner.resolveRegistration('config:environment');
      config['ember-loading'] = {
        preDelay: 5,
        postDelay: 10,
        watchTransitions: false
      };

      let service: LoadingService = this.owner.lookup('service:loading');

      assert.equal(service.preDelay, 5);
      assert.equal(service.postDelay, 10);
      assert.equal(service.watchTransitions, false);

      // this leaks between tests somehow!? :/
      delete config['ember-loading'];
    });
  });

  module('router', function(hooks) {

    hooks.beforeEach(function(this: any) {
      let RouterMock = Service.extend(Evented);
      this.owner.register('service:router', RouterMock);
    });

    test('route transition are supported', async function(assert) {
      let service: LoadingService = this.owner.lookup('service:loading');
      let router = this.owner.lookup('service:router');

      assert.notOk(service.isLoading, 'it is not loading before routing change has started');
      assert.notOk(service.showLoading, 'it is not showing loading state before routing change has started');

      router.trigger('routeWillChange');
      await settled();
      assert.ok(service.isLoading, 'it is loading after route change event');
      assert.ok(service.showLoading, 'it is showing loading state after route change event');

      router.trigger('routeDidChange');
      await settled();
      assert.notOk(service.isLoading, 'it is not loading after route has changed');
      assert.notOk(service.showLoading, 'it is not showing loading state after route has changed');
    });

    test('multiple route transition events are handled correctly', async function(assert) {
      let service: LoadingService = this.owner.lookup('service:loading');
      let router = this.owner.lookup('service:router');

      assert.notOk(service.isLoading, 'it is not loading before routing change has started');
      assert.notOk(service.showLoading, 'it is not showing loading state before routing change has started');

      router.trigger('routeWillChange');
      await settled();
      assert.ok(service.isLoading, 'it is loading after first route change event');
      assert.ok(service.showLoading, 'it is showing loading state after first route change event');

      router.trigger('routeWillChange');
      await settled();
      assert.ok(service.isLoading, 'it is loading after second route change event');
      assert.ok(service.showLoading, 'it is showing loading state after second route change event');

      router.trigger('routeDidChange');
      await settled();
      assert.notOk(service.isLoading, 'it is not loading after route has changed');
      assert.notOk(service.showLoading, 'it is not showing loading state after route has changed');
    });

    test('supports postDelay', async function(assert) {
      let Service: typeof LoadingService = this.owner.factoryFor('service:loading');
      let service: LoadingService = Service.create({
        postDelay: 20
      });
      let router = this.owner.lookup('service:router');

      assert.notOk(service.isLoading, 'it is not loading before routing change has started');
      assert.notOk(service.showLoading, 'it is not showing loading state before routing change has started');

      router.trigger('routeWillChange');
      await timeout(0);
      assert.ok(service.isLoading, 'it is loading after route change has started');
      assert.ok(service.showLoading, 'it is showing loading state after route change has started');

      router.trigger('routeDidChange');
      await timeout(0);
      assert.notOk(service.isLoading, 'it is not loading after route has changed');
      assert.ok(service.showLoading, 'it is still showing loading state after route has changed');

      await timeout(10);
      assert.notOk(service.isLoading, 'it is not loading after route has changed, but before postDelay has finished');
      assert.ok(service.showLoading, 'it is still showing loading state after route has changed, but before postDelay has finished');

      await timeout(15);
      assert.notOk(service.isLoading, 'it is not loading after route has changed and postDelay has finished');
      assert.notOk(service.showLoading, 'it is not showing loading state after route has changed and postDelay has finished');
    });

    test('supports preDelay', async function(assert) {
      let Service: typeof LoadingService = this.owner.factoryFor('service:loading');
      let service: LoadingService = Service.create({
        preDelay: 10
      });
      let router = this.owner.lookup('service:router');

      assert.notOk(service.isLoading, 'it is not loading before routing change has started');
      assert.notOk(service.showLoading, 'it is not showing loading state before routing change has started');

      router.trigger('routeWillChange');
      await timeout(0);
      assert.ok(service.isLoading, 'it is loading after route change has started');
      assert.notOk(service.showLoading, 'it is not showing loading state unless preDelay has finished');

      await timeout(10);
      assert.ok(service.isLoading, 'it is loading after preDelay has finished');
      assert.ok(service.showLoading, 'it is showing loading state after preDelay has finished');

      router.trigger('routeDidChange');
      await timeout(0);
      assert.notOk(service.isLoading, 'it is not loading after route has changed');
      assert.notOk(service.showLoading, 'it is not showing loading state after route has changed');
    });
  });
});

