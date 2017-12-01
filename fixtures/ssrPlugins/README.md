# React SSR Plugins Fixtures

> Improve the SSR performance of react with plugins

#### A _proof of concept_ using plugins with react SSR cache strategy hooks

This proof of concept includes 3 example plugins:
* simple cache plugin: A `<Cache .../>` component to cache component output
> A basic example for getting started
* component cache plugin: Allows **any component** to define a `static getCacheKey = (props) => 'key';` function to enable caching 
> Allows any component output to be cached
* cache template plugin: A `<CacheTemplate .../>` component that convert component output to a template for rendering, and support injecting content into the cached template output.
> A more realistic example.

> Allows dynamic content to be injected into a cached template (ie: Inject a user specific avatar into a cached header)

> Supports async template cache read/write access to support shared template access across server instances

_[electrode-react-ssr-caching](https://github.com/electrode-io/electrode-react-ssr-caching) could be converted to a plugin for R.16+ support_

## Setup

To reference a local build of React, first run `yarn build` at the root
of the React project. Then:

```
cd fixtures/ssrPlugins
yarn
yarn start:prod
```
**Note:** 
 * Prod mode is recommended, as in _dev mode_ plugins will not cache any output
 * Prod mode will **not** display _modified context warnings_, for this you need to run in dev mode

The `start` command runs a webpack dev server and a server-side rendering server in development mode with hot reloading.

**Note: whenever you make changes to React and rebuild it, you need to re-run `yarn` in this folder:**

```
yarn
```
