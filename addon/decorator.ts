import { assert } from '@ember/debug';
import { getOwner } from '@ember/application';

const loading: MethodDecorator = (desc: any) => {
  assert('The @loading decorator must be applied to methods', desc && desc.kind === 'method');

  let orig = desc.descriptor.value;

  return {
    ...desc,
    descriptor: {
      ...desc.descriptor,
      async value() {

        let owner = getOwner(this);
        assert('The target of the @loading decorator must have an owner.', !!owner);

        let service = owner.lookup('service:loading');

        try {
          service.start();
          return await orig.apply(this, arguments);
        } finally {
          service.stop();
        }
      }
    }
  };
};

export default loading;
