import { module, test } from 'qunit';
import { visit, currentURL, waitFor } from '@ember/test-helpers';
import { setupApplicationTest } from 'ember-qunit';
import 'qunit-dom';

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
});
