// @flow
import type { CacheStrategyContext, CacheProvider, CacheStatsProvider } from './flowTypes';

const noopCacheStats = {
  startRender: (): any => {},
  endRender: (pluginName: string, cacheKey: string, start: any): void => {},
  cacheHit: (pluginName: string, cacheKey: string): void => {},
  cacheMiss: (pluginName: string, cacheKey: string, start: any): void => {},
};

export default class CacheContext implements CacheStrategyContext {
  _cacheProvider: CacheProvider;
  _cacheStatsProvider: CacheStatsProvider;

  constructor(cacheProvider: CacheProvider, cacheStatsProvider?: CacheStatsProvider = noopCacheStats) {
    this._cacheProvider = cacheProvider;
    this._cacheStatsProvider = cacheStatsProvider;
  }

  get cacheProvider(): CacheProvider {
    return this._cacheProvider;
  }

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
  getCacheKey(cacheStrategyName: string, cacheStrategyKey: string): string {
    return this._cacheProvider.getCacheKey(`${cacheStrategyKey}:${cacheStrategyName}`);
  }

  /**
   * Get the cached component render output (synchronously).
   */
  getCachedComponent(cacheKey: string): mixed {
    return this._cacheProvider.getCachedComponent(cacheKey);
  }

  /**
   * Set the cached component render output (synchronously).
   */
  setCachedComponent(cacheKey: string, data: mixed): void {
    this._cacheProvider.setCachedComponent(cacheKey, data);
  }

  /**
   * Indicates a cache render has started.
   */
  startCacheRender(): any {
    return this._cacheStatsProvider.startRender();
  }

  /**
   * Indicates a cache render has ended.
   */
  endCacheRender(pluginName: string, cacheKey: string, start: any): void {
    this._cacheStatsProvider.endRender(pluginName, cacheKey, start);
  }

  /**
   * Log a cache miss, collect stats.
   *
   * Consider adding an additional parameter to collect the time taken to generate the cache render.
   */
  cacheMiss(pluginName: string, cacheKey: string, start: any): void {
    this._cacheStatsProvider.cacheMiss(pluginName, cacheKey, start);
  }

  /**
   * Log a cache hit, collect stats
   */
  cacheHit(pluginName: string, cacheKey: string): void {
    this._cacheStatsProvider.cacheHit(pluginName, cacheKey);
  }
}
