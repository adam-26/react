// @flow
import type { CachedComponentProvider } from '../flowTypes';
import CachedComponentContext from '../CachedComponentContext';

/**
 * An in-memory cached component provider.
 *
 * For production, the cache provider could include features such as:
 * - use the URL to create cache bags containing url-specific templates
 * - LRU cache
 * - a shared cache provider (redis, mem-cache, etc..)
 * - storing most commonly used cached templates in memory (access '.cachedComponentKeys' from context)
 * - map [URLs <-> TemplateCacheKeys], so only missing templates are retrieved from a shared cache
 */
export default class InMemoryCachedComponentProvider implements CachedComponentProvider {
  _cache: Object;

  constructor() {
    this._cache = {};
  }

  getCachedComponents(url: string, callback: (err: any, cachedData: mixed) => void): void {
    callback(undefined, Object.assign({}, this._cache));
  }

  setCachedComponents(url: string, ctx: CachedComponentContext, callback: (err: any) => void): void {
    Object.assign(this._cache, ctx.cachedComponents);
    callback();
  }
}
