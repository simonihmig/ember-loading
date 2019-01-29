import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { timeout } from 'ember-concurrency';

module('Unit | Service | loading', function(hooks) {
  setupTest(hooks);

  test('switching on/off is behaving properly', function(assert) {
    let service = this.owner.lookup('service:loading');
    assert.notOk(service.get('isLoading'));
    service.start();
    assert.ok(service.get('isLoading'));
    service.stop();
    assert.notOk(service.get('isLoading'));
  });

  test('stays on when multiple requests are requested and switch off while all requests are done', function(assert) {
    let service = this.owner.lookup('service:loading');
    assert.notOk(service.get('isLoading'));
    service.start();
    service.start();
    assert.ok(service.get('isLoading'));
    service.stop();
    assert.ok(service.get('isLoading'));
    service.stop();
    assert.notOk(service.get('isLoading'));
  });

  test('can run jobs', async function(assert) {
    let service = this.owner.lookup('service:loading');
    assert.notOk(service.get('isLoading'));
    assert.notOk(service.get('showLoading'));

    let job = () => timeout(10);

    let promise = service.runJob(job, 5);
    assert.ok(service.get('isLoading'));
    assert.ok(service.get('showLoading'));

    await promise;
    assert.notOk(service.get('isLoading'));
    assert.ok(service.get('showLoading'));

    await timeout(5);
    assert.notOk(service.get('isLoading'));
    assert.notOk(service.get('showLoading'));
  });
});

