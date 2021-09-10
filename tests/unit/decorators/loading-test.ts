import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject from '@ember/object';
import RSVP, { defer } from 'rsvp';
import { loading } from 'ember-loading';

module('Unit | Decorator | loading', function (hooks) {
  setupTest(hooks);

  test('it sets loading state', async function (assert) {
    class Test extends EmberObject {
      defer?: RSVP.Deferred<void>;

      @loading
      asyncSomething() {
        this.defer = defer();
        return this.defer.promise;
      }
    }

    let service = this.owner.lookup('service:loading');
    let obj = Test.create(this.owner.ownerInjection());

    assert.notOk(service.get('isLoading'));

    let promise = obj.asyncSomething();
    assert.ok(service.get('isLoading'));

    obj.defer!.resolve();
    await promise;
    assert.notOk(service.get('isLoading'));
  });

  test('it passes args and return value', async function (assert) {
    assert.expect(2);

    class Test extends EmberObject {
      defer?: RSVP.Deferred<number>;

      @loading
      asyncSomething(arg: string) {
        this.defer = defer();
        assert.equal(arg, 'foo');
        return this.defer.promise;
      }
    }

    let obj = Test.create(this.owner.ownerInjection());
    let promise = obj.asyncSomething('foo');

    obj.defer!.resolve(1);
    let result = await promise;

    assert.equal(result, 1);
  });
});
