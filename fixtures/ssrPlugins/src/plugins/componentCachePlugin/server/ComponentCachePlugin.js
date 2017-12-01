// @flow
import type {CacheStrategyPlugin} from "../../../../server/pluginCacheStrategy/flowTypes";

/**
 * Plugin that inspects components for a static 'getCacheKey' function,
 * if it exists it will cache the component output for the given key, and use it for server rendering.
 *
 * This plugin uses a simple cache, and does not use the templateRenderer to provide a template context.
 */
export default class ComponentCachePlugin implements CacheStrategyPlugin {

  /**
   * Cache strategy name getter
   */
  get cacheStrategyName(): string {
    return 'component_cache_plugin';
  }

  /**
   * Determine if a component supports SSR cache
   */
  canCacheComponent(component: any, props: Object, context: Object): boolean {
    return component && typeof component.getCacheKey === 'function';
  }

  /**
   * Get a cacheKey for the component with assigned props/context
   */
  getCacheKey(componentName: string, component: mixed, props: Object, context: Object): string {
    return `${component.getCacheKey(props, context)}:${componentName}`;
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
