// @flow

/**
 * Interface to be implemented by a cache strategy plugin
 */
export interface CacheStrategyPlugin {

  /**
   * Cache strategy name getter
   */
  cacheStrategyName: string,

  /**
   * Determine if a component supports SSR cache
   */
  canCacheComponent(component: any, props: Object, context: Object): boolean,

  /**
   * Get a cacheKey for the component with assigned props/context
   */
  getCacheKey(componentName: string, component: mixed, props: Object, context: Object): string,

  /**
   * Render an element for insertion into the cache
   *
   */
  renderForCache(element: ReactElement, context: Object, renderUtils: RenderUtils): mixed,

  /**
   * Render a component using the cached component data
   * A simple cache strategy implementation would simply return the cachedData string in this method
   */
  renderFromCache(cachedData: mixed, props: Object, context: Object, renderUtils: RenderUtils): string
}

// TODO:
export type ReactElement = any;

export type ReactNode = any;

export interface RenderUtils {
  // todo...
}

export interface CacheProvider {

  cachedComponents: mixed;

  cachedComponentKeys: Array<string>;

  getCacheKey(cacheKey: string): string;

  getCachedComponent(cacheKey: string): mixed;

  setCachedComponent(cacheKey: string, data: mixed): void;
}

export interface CacheStatsProvider {

  /**
   * Notify that a cache render is starting
   */
  startRender: () => any,

  /**
   * Notify that a cache render has ended
   */
  endRender: (pluginName: string, cacheKey: string, start: any) => void,

  /**
   * Notify that a cache hit occurred
   */
  cacheHit: (pluginName: string, cacheKey: string) => void,

  /**
   * Notify that a cache miss occurred
   */
  cacheMiss: (pluginName: string, cacheKey: string, start: any) => void,
}

export interface CacheStrategyContext {

  cacheProvider: CacheProvider,

  /**
   * Get the cache key.
   *
   * Can be useful to assign additional data to the cache key created by the cache strategy.
   * Can also be used to hash cache key values.
   *
   * Examples:
   *  - apply the cacheStrategyName, to create cache buckets per strategy
   *  - apply the current Application Version so content is cached for a specific app version
   */
  getCacheKey(cacheStrategyName: string, cacheStrategyKey: string): string,

  /**
   * Get the cached component render output (synchronously).
   */
  getCachedComponent(cacheKey: string): any,

  /**
   * Set the cached component render output (synchronously).
   */
  setCachedComponent(cacheKey: string, data: mixed): void,

  /**
   * Indicates a cache render has started.
   */
  startCacheRender(): any,

  /**
   * Indicates a cache render has ended.
   */
  endCacheRender(pluginName: string, cacheKey: string, start: any): void,

  /**
   * Log a cache miss, collect stats.
   *
   * Consider adding an additional parameter to collect the time taken to generate the cache render.
   */
  cacheMiss(pluginName: string, cacheKey: string, start: any): void,

  /**
   * Log a cache hit, collect stats
   */
  cacheHit(pluginName: string, cacheKey: string): void
}
