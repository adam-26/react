// @flow
import RendererPlugin from '../../../../server/pluginRenderer/RendererPlugin';
import CacheComponent from '../components/Cache';
import type { FrameBoundaryPlugin, ReactNode, RenderedFrameBoundary } from '../../../../server/pluginRenderer/frameBoundaryTypes';

/**
 * Simple example plugin that renders <Cache .../> component(s) on the server, and caches output
 * to serve for future requests.
 *
 * This plugin uses a simple cache, and does not use the templateRenderer to provide a template context.
 */
export default class StaticCachePlugin extends RendererPlugin implements FrameBoundaryPlugin {
  _cache: Object;

  constructor() {
    super('static_cache_example_plugin');
    this._cache = {};
  }

  isFrameBoundary(component: mixed, props: Object, context: Object): boolean {
    return component === CacheComponent;
  }

  renderFrameBoundary(
    element: ReactNode,
    context: Object,
    domNamespace: string,
    renderUtils: Object
  ): RenderedFrameBoundary {
    const { renderElement, resolveFrameBoundaryChild } = renderUtils;

    const Component = element.type;
    const cacheKey = Component.getKey(element.props, context, domNamespace);
    let cachedFrame = this._cache[cacheKey];

    if (typeof cachedFrame === 'undefined') {
      this.log(`Cache Miss: ${cacheKey}`);

      // Resolve the immediate child component then render the frame.
      const {nextChild, nextContext} = resolveFrameBoundaryChild(element, context);
      cachedFrame = renderElement(nextChild, nextContext, domNamespace);
      this._cache[cacheKey] = Object.assign({}, cachedFrame);
    }
    else {
      this.log(`Cache Hit: ${cacheKey}`);
    }

    return cachedFrame;
  }
}
