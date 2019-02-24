import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';
import LoadingService from 'ember-loading/services/loading';

const loading: MethodDecorator = (desc: any) => {
  assert('The @loading decorator must be applied to methods', desc && desc.kind === 'method');

  let orig = desc.descriptor.value;

  return {
    ...desc,
    descriptor: {
      ...desc.descriptor,
      value() {

        let owner = getOwner(this);
        assert('The target of the @loading decorator must have an owner.', !!owner);

        let service: LoadingService = owner.lookup('service:loading');

        return service.run(this, orig, ...arguments);
      }
    }
  };
};

export default loading;
