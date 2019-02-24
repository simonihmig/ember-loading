import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { timeout } from 'ember-concurrency';
import LoadingService from 'ember-loading/services/loading';
import RSVP, { defer } from 'rsvp';

module('Unit | Service | loading', function(hooks) {
  setupTest(hooks);

  test('switching on/off is behaving properly', function(assert) {
    let service: LoadingService = this.owner.lookup('service:loading');
    assert.notOk(service.get('isLoading'));
    service.start();
    assert.ok(service.get('isLoading'));
    service.stop();
    assert.notOk(service.get('isLoading'));
  });

  test('stays on when multiple requests are requested and switch off while all requests are done', function(assert) {
    let service: LoadingService = this.owner.lookup('service:loading');
    assert.notOk(service.get('isLoading'));
    service.start();
    service.start();
    assert.ok(service.get('isLoading'));
    service.stop();
    assert.ok(service.get('isLoading'));
    service.stop();
    assert.notOk(service.get('isLoading'));
  });

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

    await timeout(5);
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

