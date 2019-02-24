import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { timeout } from 'ember-concurrency';
import LoadingService from 'ember-loading/services/loading';
import { defer } from 'rsvp';

module('Unit | Service | loading', function(hooks) {
  setupTest(hooks);

  test('can run async jobs', async function(assert) {
    let deferred = defer();
    let called = false;
    let job = () => {
      called = true;
      return deferred.promise;
    };

    let service: LoadingService = this.owner.lookup('service:loading');
    assert.notOk(service.get('isLoading'));
    assert.notOk(service.get('showLoading'));

    let promise = service.run(job);
    assert.ok(called, 'job has been called');
    assert.ok(service.get('isLoading'));
    assert.ok(service.get('showLoading'));

    deferred.resolve();
    await promise;
    assert.notOk(service.get('isLoading'));
    assert.ok(service.get('showLoading'));

    await timeout(1);
    assert.notOk(service.get('isLoading'));
    assert.notOk(service.get('showLoading'));
  });

  test('waits for all async jobs', async function(assert) {
    let deferred1 = defer();
    let deferred2 = defer();

    let service: LoadingService = this.owner.lookup('service:loading');
    assert.notOk(service.get('isLoading'));
    assert.notOk(service.get('showLoading'));

    let promise1 = service.run(() => deferred1.promise);
    assert.ok(service.get('isLoading'));
    assert.ok(service.get('showLoading'));

    let promise2 = service.run(() => deferred2.promise);
    assert.ok(service.get('isLoading'));
    assert.ok(service.get('showLoading'));

    deferred1.resolve();
    await promise1;
    assert.ok(service.get('isLoading'));
    assert.ok(service.get('showLoading'));

    deferred2.resolve();
    await promise2;
    assert.notOk(service.get('isLoading'));
    assert.ok(service.get('showLoading'));

    await timeout(1);
    assert.notOk(service.get('isLoading'));
    assert.notOk(service.get('showLoading'));
  });

  test('passes args', async function(assert) {
    assert.expect(2);
    let job = (a: number, b: string) => {
      assert.equal(a, 2);
      assert.equal(b, 'foo');
    };

    let service: LoadingService = this.owner.lookup('service:loading');
    await service.run(job, 2, 'foo');
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

  test('return value', async function(assert) {
    let deferred = defer();
    let job = () => deferred.promise;

    let service: LoadingService = this.owner.lookup('service:loading');
    let promise = service.run(job);
    deferred.resolve('foo');
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

});

