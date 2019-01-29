import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import EmberObject from '@ember/object';
import loading from 'ember-loading/decorator';
import RSVP, { defer } from 'rsvp';

class Test extends EmberObject {
  defer?: RSVP.Deferred<void>;

  @loading
  asyncSomething() {
    this.defer = defer();
    return this.defer.promise;
  }
}

module('Unit | Decorator | loading', function(hooks) {
  setupTest(hooks);

  test('it sets loading state', async function(assert) {

    let service = this.owner.lookup('service:loading');
    let obj = new Test(this.owner.ownerInjection());

    assert.notOk(service.get('isLoading'));

    let promise = obj.asyncSomething();
    assert.ok(service.get('isLoading'));

    obj.defer!.resolve();
    await promise;
    assert.notOk(service.get('isLoading'));
  });
});

