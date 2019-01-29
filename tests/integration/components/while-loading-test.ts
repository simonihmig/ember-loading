import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';
import LoadingService from '../../../addon/services/loading';

module('Integration | Component | while-loading', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders while loading', async function(assert) {
    let service: LoadingService = this.owner.lookup('service:loading');

    await render(hbs`
      {{#while-loading}}
        <div id="loading-indicator">Loading...</div>
      {{/while-loading}}
    `);

    assert.dom('#loading-indicator').doesNotExist();

    service.start();
    await settled();
    assert.dom('#loading-indicator').exists();

    service.stop();
    await settled();
    assert.dom('#loading-indicator').doesNotExist();
  });
});
