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
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);

      let promise = service.run(job);
      assert.equal(called, 1, 'job has been called');
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      deferred.resolve();
      await promise;
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);
    });

    test('waits for all async jobs', async function(assert) {
      let deferred1 = defer();
      let deferred2 = defer();

      let service: LoadingService = this.owner.lookup('service:loading');
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);

      let promise1 = service.run(() => deferred1.promise);
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      let promise2 = service.run(() => deferred2.promise);
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      deferred1.resolve();
      await promise1;
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      deferred2.resolve();
      await promise2;
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);
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
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);

      let promise = service.run(job);
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      deferred.resolve();
      await promise;
      assert.notOk(service.isLoading);
      assert.ok(service.showLoading);

      await timeout(6);
      assert.notOk(service.isLoading);
      assert.ok(service.showLoading);

      await timeout(5);
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);
    });

    test('supports preDelay', async function(assert) {
      let deferred = defer();
      let job = () => deferred.promise;
      let Service: typeof LoadingService = this.owner.factoryFor('service:loading');
      let service: LoadingService = Service.create({
        preDelay: 10
      });
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);

      let promise = service.run(job);
      assert.ok(service.isLoading);
      assert.notOk(service.showLoading);

      await timeout(11);
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      deferred.resolve();
      await promise;
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);
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

      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);

      router.trigger('routeWillChange');
      await settled();
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      router.trigger('routeDidChange');
      await settled();
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);
    });

    test('multiple route transition events are handled correctly', async function(assert) {
      let service: LoadingService = this.owner.lookup('service:loading');
      let router = this.owner.lookup('service:router');

      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);

      router.trigger('routeWillChange');
      await settled();
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      router.trigger('routeWillChange');
      await settled();
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      router.trigger('routeDidChange');
      await settled();
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);
    });

    test('supports postDelay', async function(assert) {
      let Service: typeof LoadingService = this.owner.factoryFor('service:loading');
      let service: LoadingService = Service.create({
        postDelay: 20
      });
      let router = this.owner.lookup('service:router');

      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);

      router.trigger('routeWillChange');
      await timeout(0);
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      router.trigger('routeDidChange');
      await timeout(0);
      assert.notOk(service.isLoading);
      assert.ok(service.showLoading);

      await timeout(10);
      assert.notOk(service.isLoading);
      assert.ok(service.showLoading);

      await timeout(15);
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);
    });

    test('supports preDelay', async function(assert) {
      let Service: typeof LoadingService = this.owner.factoryFor('service:loading');
      let service: LoadingService = Service.create({
        preDelay: 10
      });
      let router = this.owner.lookup('service:router');

      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);

      router.trigger('routeWillChange');
      await timeout(0);
      assert.ok(service.isLoading);
      assert.notOk(service.showLoading);

      await timeout(10);
      assert.ok(service.isLoading);
      assert.ok(service.showLoading);

      router.trigger('routeDidChange');
      await timeout(0);
      assert.notOk(service.isLoading);
      assert.notOk(service.showLoading);
    });
  });
});

