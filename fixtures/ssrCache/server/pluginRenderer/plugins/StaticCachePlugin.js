// @flow
import {FrameBoundaryPlugin, ReactNode, RenderFrame, SetFrameState} from '../frameBoundaryTypes';

// TODO - create other example plugins - <Cache> component, ensure 'props' are rendered and can be injected
// TODO - create template plugin (simple), ensure 'props' can be injected w/rendered content

/**
 * Example plugin that inspects components for a static 'getCacheKey' function,
 * if it exists it will cache the component output for the given key.
 */
export default class CachePlugin implements FrameBoundaryPlugin {
  _cache: Object;

  constructor() {
    // todo; real plugins should replace w/provider... use get/set methods, LRU, etc.
    this._cache = {};
  }

  getPluginName(): string {
    return 'static_cache_example_plugin';
  }

  isFrameBoundary(component: mixed, props: Object, context: Object): boolean {
    return typeof component.getCacheKey === 'function';
  }

  renderFrameBoundary(
    element: ReactNode,
    context: Object,
    domNamespace: string,
    renderFrame: RenderFrame,
    setFrameState: SetFrameState
  ): string {
    const Component = element.type;
    const cacheKey = Component.getCacheKey(element.props, context, domNamespace);
    let cachedFrame = this._cache[cacheKey];

    if (typeof cachedFrame === 'undefined') {
      console.log(`Cache Miss: ${cacheKey}`);
      cachedFrame = renderFrame(element, context, domNamespace);
      this._cache[cacheKey] = Object.assign({}, cachedFrame);
    }
    else {
      console.log(`Cache Hit: ${cacheKey}`);
      // Update the frame state
      setFrameState(cachedFrame.previousWasTextNode, cachedFrame.currentSelectValue);
    }

    return cachedFrame.html;
  }
}
