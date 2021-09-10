import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import LoadingService from '../../../addon/services/loading';
import { defer } from 'rsvp';

module('Integration | Component | while-loading', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders while loading', async function (assert) {
    let service: LoadingService = this.owner.lookup('service:loading');
    let deferred = defer();

    await render(hbs`
      {{#while-loading}}
        <div id="loading-indicator">Loading...</div>
      {{/while-loading}}
    `);

    assert.dom('#loading-indicator').doesNotExist();

    service.run(() => deferred.promise);
    await settled();
    assert.dom('#loading-indicator').exists();

    deferred.resolve();
    await settled();
    assert.dom('#loading-indicator').doesNotExist();
  });
});
