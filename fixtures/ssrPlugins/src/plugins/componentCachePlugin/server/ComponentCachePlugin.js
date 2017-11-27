// @flow
import RendererPlugin from '../../../../server/pluginRenderer/RendererPlugin';
import type { ReactNode, RenderedFrameBoundary } from '../../../../server/pluginRenderer/frameBoundaryTypes';

/**
 * Plugin that inspects components for a static 'getCacheKey' function,
 * if it exists it will cache the component output for the given key, and use it for server rendering.
 *
 * This plugin uses a simple cache, and does not use the templateRenderer to provide a template context.
 */
export default class ComponentCachePlugin extends RendererPlugin {
  _cache: Object;

  constructor() {
    super('component_cache_example_plugin');
    this._cache = {};
  }

  isFrameBoundary(component: mixed, props: Object, context: Object): boolean {
    return typeof component.getCacheKey === 'function';
  }

  renderFrameBoundary(
    element: ReactNode,
    context: Object,
    domNamespace: string,
    renderUtils: Object
  ): RenderedFrameBoundary {
    const { renderElement, resolveFrameBoundaryChild } = renderUtils;

    const Component = element.type;
    const cacheKey = Component.getCacheKey(element.props, context, domNamespace);
    let cachedFrame = this._cache[cacheKey];

    if (typeof cachedFrame === 'undefined') {
      this.log(`Cache miss: ${cacheKey}`);

      // Resolve the immediate child component then render the frame.
      const {nextChild, nextContext} = resolveFrameBoundaryChild(element, context);
      cachedFrame = renderElement(nextChild, nextContext, domNamespace);
      this._cache[cacheKey] = Object.assign({}, cachedFrame);
    }
    else {
      this.log(`Cache hit: ${cacheKey}`);
    }

    return cachedFrame;
  }
}
