// @flow
import CacheComponent from '../components/Cache';
import type {CacheStrategyPlugin} from "../../../../server/pluginCacheStrategy/flowTypes";

/**
 * Simple example plugin that renders <Cache .../> component(s) on the server, and caches output
 * to serve for future requests.
 *
 * This plugin uses a simple cache, and does not use the templateRenderer to provide a template context.
 */
export default class StaticCachePlugin implements CacheStrategyPlugin {

  /**
   * Cache strategy name getter
   */
  get cacheStrategyName(): string {
    return 'static_cache_plugin';
  }

  /**
   * Determine if a component supports SSR cache
   */
  canCacheComponent(component: any, props: Object, context: Object): boolean {
    return component === CacheComponent;
  }

  /**
   * Get a cacheKey for the component with assigned props/context
   */
  getCacheKey(componentName: string, component: mixed, props: Object, context: Object): string {
    return `${component.getKey(props, context)}:${componentName}`;
  }

  /**
   * Render an element for insertion into the cache
   */
  renderForCache(element: ReactElement, context: Object, renderUtils: RenderUtils): mixed {
    const { renderCurrentElement } = renderUtils;
    return renderCurrentElement();
  }

  /**
   * Render a component using the cached component data
   * A simple cache strategy implementation would simply return the cachedData string in this method
   */
  renderFromCache(cachedData: mixed, props: Object, context: Object, renderUtils: RenderUtils): string {
    return cachedData;
  }
}
