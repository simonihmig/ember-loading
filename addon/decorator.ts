import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import LoadingService from 'ember-loading/services/loading';

export default function loading(_target: Object, _propertyKey: string | symbol, desc: PropertyDescriptor): void {
  let orig = desc.value;
  assert('The @loading decorator must be applied to methods', typeof orig === 'function');

  desc.value = function() {
    let owner = getOwner(this);
    assert('The target of the @loading decorator must have an owner.', !!owner);

    let service: LoadingService = owner.lookup('service:loading');

    return service.run(this, orig, ...arguments);
  };
};
