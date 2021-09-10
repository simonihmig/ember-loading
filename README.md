ember-loading
==============================================================================

![CI](https://github.com/kaliber5/ember-loading/workflows/CI/badge.svg)
[![Ember Observer Score](https://emberobserver.com/badges/ember-loading.svg)](https://emberobserver.com/addons/ember-loading)
[![npm version](https://badge.fury.io/js/ember-loading.svg)](https://badge.fury.io/js/ember-loading)

A simple Ember.js addon to capture and expose the loading state of your app,
so you can show that to the user with e.g. a loading indicator.

*But Ember has [loading substates](https://guides.emberjs.com/release/routing/loading-and-error-substates/)
so why do I even need it?*

This is true, and works basically like this: when the user transitions from
`/foo` to `/bar`, the DOM previously rendered through `foo.hbs` will be removed,
the `loading.hbs` template renders while loading of the `bar` route is in progress,
after which `bar.hbs` is rendered. That's fine, if it is what you need.

But another UX approach would be to keep `foo.hbs` rendered and add any kind of
loading indicator on top of it (e.g. an overlay over the existing content) or
somewhere else on the page while loading, and replace the rendered `foo.hbs`
with `bar.hbs` only when loading has finished.

*What else?*

This addon helps you also to show the loading state for async processes
besides transitioning between routes, e.g. when you load or save data in a
controller/component.

*How does it look like?*

It is completely agnostic of any looks. It merely provides some basic
infrastructure to capture and expose the loading state. To actually render
your loading indicator, you can use your own custom styled component or any of
the existing [loading indicator addons](https://emberobserver.com/categories/loading-indicators).

Compatibility
------------------------------------------------------------------------------

* Ember.js v3.20 or above
* Ember CLI v3.20 or above
* Node.js v12 or above


Installation
------------------------------------------------------------------------------

```
ember install ember-loading
```


Usage
------------------------------------------------------------------------------

The addon's central piece is the `loading` service, which captures and exposes
the app's loading state.

### Exposing the loading state

#### Using the service

The `loading` service exposes the following properties, which you can use to
render your loading indicator in any way:

| Property               | Description                                                           |
|------------------------|-----------------------------------------------------------------------|
| `isLoading: Boolean`   | Will be true if any captured async processes (see below) are pending. |
| `showLoading: Boolean` | Will be true based on `isLoading`, but will take optional `preDelay` and `postDelay` into account, to optimize for the visual appearance. See [Configuration](#configuration) below. |

#### Using `while-loading`

Rather than explicitly injecting the `loading` service and using an `{{#if}}`
block in your template, you can more conveniently use the `while-loading`
component to wrap any content that should be shown only while loading:

```hbs
{{#while-loading}}
  <LoadingIndicator/>
{{/while-loading}}
```

### Capturing the loading state

#### Route transitions

The service will automatically recognize route transitions (i.e. async model
hooks) and set the service's loading state accordingly.

#### Custom actions

Whenever you kick off async processes that you want to show to the user, and
which are not part of any of a route's model hooks, you can use the service's
`run()` function, which will call your own async function, and set the
services's loading properties accordingly.

```js
import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  loading: service(),

  actions: {
    save(model) {
      return this.loading.run(() => model.save());
    }
  }
})
```

The `run()` method has the following signature, similar to many of Ember's
[runloop](https://emberjs.com/api/ember/release/modules/@ember%2Frunloop) functions:

| Arguments / Return value   | Description                                                          |
|----------------------------|----------------------------------------------------------------------|
| `target: any`              | optional target of method to call                                    |
| `method: Function\|string` | Async method to invoke. May be a function or a string. If you pass a string then it will be looked up on the passed target. |
| `...args: any[]`           | Any additional arguments you wish to pass to the function.           |
| returns                    | Promise that resolves with the return value of the invoked function. |

#### Decorator

If you use native classes and decorators, you can use the supplied `@loading` decorator to wrap any native method.

> The decorator uses stage 1 syntax, meant to be used with TypeScript and/or `ember-cli-babel` V7.7.0+

```js
import Controller from '@ember/controller';
import { action } from '@ember-decorators/object';
import { loading } from 'ember-loading';

export default class Foo extends Controller {

  @action
  @loading
  save(model) {
    return model.save();
  }
}
```

### Configuration

The addon supports the following configuration options in your `config/environment.js`, under the
`ember-loading` key:

| option                        | Default | Description                                                |
|-------------------------------|---------|------------------------------------------------------------|
| `preDelay: number`            | `0`     | Amount of milliseconds to delay the `showLoading` property (see [above](#using-the-service)) going from false to true. This allows you to suppress the loading indicator appearing for very short loading times. |
| `postDelay: number`           | `0`     | Amount of milliseconds to delay the `showLoading` property (see [above](#using-the-service)) going from true to false. This can help you with aggregating multiple async processes happening in succession, to prevent flickering of the loading indicator. |
| `watchTransitions: Boolean`   | `true`  | If `false`, async transitions do not affect the `isLoading` property. |

Contributing
------------------------------------------------------------------------------

See the [Contributing](CONTRIBUTING.md) guide for details.


License
------------------------------------------------------------------------------

This project is licensed under the [MIT License](LICENSE.md).
