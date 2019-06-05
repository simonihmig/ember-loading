import { module, test } from 'qunit';
import { visit, currentURL, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';

module('Acceptance | route transitions', function(hooks) {
  setupApplicationTest(hooks);

  test('router transitions affect loading state', async function(assert) {
    await visit('/');

    assert.dom('#loading-indicator').doesNotExist();

    let promise = visit('/async');
    await waitFor('#loading-indicator');
    assert.dom('#loading-content').doesNotExist();

    await promise;
    assert.equal(currentURL(), '/async');
    assert.dom('#loading-indicator').doesNotExist();
    assert.dom('#loading-content').exists();
  });

  test('router transitions do not affect loading state', async function(assert) {

    let config = this.owner.resolveRegistration('config:environment');
    config['ember-loading'] = {
      watchTransitions: false
    };

    await visit('/');
    assert.dom('#loading-indicator').doesNotExist();

    let promise = visit('/async');

    try {
      await waitFor('#loading-indicator');
    } catch (error) {
      assert.equal('waitFor timed out waiting for selector "#loading-indicator"', error.message);
    }

    await promise;
    assert.equal(currentURL(), '/async');
    assert.dom('#loading-indicator').doesNotExist();
    assert.dom('#loading-content').exists();

    // this leaks between tests somehow!? :/
    delete config['ember-loading'];
  });
});
