## React SSR cache hooks

_Here's a first draft of a react SSR cache hooks API._

##### API design goals:

1. SSR caching is performed at the `frame` level (of the ReactPartialRenderer), where each frame represents a react element
   * only complete/closed frames can be cached (this greatly simplifies the SSR cache API)

2. SSR caching is performed by a `CacheStrategy` implementation
   * cache strategies are passed as `options` to `renderToString()` and `renderToStream()`

3. Cache strategies should be capable using either react components or configuration to enable caching.


4. Beyond supporting simple per-component caching, a cache strategy _should be able to support_ `templates`, where a component can be rendered to become a (cached) template, and templates can then have content injected - this has the potential to _drastically_ improve SSR performance.


### CacheStrategy API

```js

interface CacheStrategy {

  /**
   * Gets the cache strategy state for a component.
   *
   * ReactPartialRenderer hook: resolveElement (called during every resolveElement invocation)
   *
   * @param component
   * @param props
   * @param context
   * @returns {*} if undefined is returned, the cache strategy render method will not be invoked for this component.
   */
  getCacheState(component: ReactNode, props: Object, context: Object): any,

  /**
   * Renders an element using a cache strategy.
   *
   * ReactPartialRenderer hook: renderFrame (called when rendering a frame that has assigned 'cacheState')
   *
   * @param element to render
   * @param context to use for rendering
   * @param cacheState the state returned by the getCacheState() method
   * @param renderUtils to simplify rendering of cached component
   * @returns {string} the rendered component
   */
  render(element: ReactElement, context: Object, cacheState: mixed, renderUtils: CacheRenderUtils): string,
}

```

#### Cache Strategy Notes

##### #getCacheState()
 * Determines if a component supports caching, and returns component specific cache state
 * **Hook** must be called by the `ReactPartialRenderer` every time an element is resolved
 * Returning `undefined` indicates that the component does **not** support caching 


##### #render()
 * handles rendering for a component that supports caching
 * **Hook** must be called by `ReactPartialRenderer` when rendering a frame that has `cacheState`
 * receives the `cacheState` returned by `getCacheState()`
 * receives `renderUtils`, utility methods for rendering cached components that abstracts renderer internals

### Template example
```js
<Header avatar={UserAvatar} />
```
The `Header` can be rendered as a template that allows the `avatar` prop to be injected each render. This prevents the need to render the `Header` on each request.

The same approach could be applied to more complex components, such as a `<Product ... />` or `<Comments .../>` component, greatly reducing SSR time.

`RenderUtils` can be used to simplify `template` support.

### CacheRendererUtils

```js

// Utility methods for rendering that abstract renderer internals
type CacheRenderUtils = {
  
  /**
   * Renders the current frame element and all its children, allowing props to be overridden.
   *
   * @param props
   * @param context
   * @returns {string} the rendered element output
   */
  renderCurrentElement: (props?: Object, context?: Object) => string,

  /**
   * Renders the provided element and all its children.
   *
   * @param element
   * @param context
   * @param domNamespace
   * @returns {string} the rendered element output
   */
  renderElement: (element: ReactElement, context?: Object, domNamespace?: string) => string,
  
  /**
   * Logs a warning if the base context is modified during the provided render function.
   *
   * NOTE: This only logs warning messages in development.
   *
   * @param baseContext the expected context throughout the entire render method
   * @param render method
   * @param [messageSuffix] {string} the message to log
   * @returns {string} the render output
   */
  warnIfRenderModifiesContext: (baseContext: Object, render: (ctx: Object) => string, messageSuffix?: string) => string,
};
```

#### Render Util Notes

##### #renderCurrentElement()
 * renders the current element, allowing props and context to be modified

##### #renderElement()
 * renders the provided element
 * allows arbitrary elements to be rendered by cache strategies
 * this enables cache strategies to be created that supports injecting element(s) into cached content (aka, a template)
   * this method can be used to render the element(s) that will be injected into a template

##### #warnIfRenderModifiesContext()
 * enables a cache strategy to determine if the `context` is modified while rendering an element
 * this is useful for a cache strategy that supports injecting element(s) into cached content (aka, a template)
   * if the context is changed when rendering a template, injected elements may not render consistently 
     on the server and client 
   * this method can be used to wrap `renderCurrentElement` or `renderElement` to ensure consistent renders 


### Hook usage example

```js
import { renderToString } from 'react-dom/server';

// No cache strategies
renderToString(<App ... />);

// Using cache strategy
renderToString(<App ... />, { cacheStrategy: new ExampleCacheStrategy() });
```
