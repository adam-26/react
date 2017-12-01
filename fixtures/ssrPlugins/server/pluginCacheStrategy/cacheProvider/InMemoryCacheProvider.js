// @flow
import type { CacheProvider } from './CacheProvider';
import type TemplateContext from '../TemplateContext';

/**
 * An in-memory cache provider for use with the CacheContext.
 *
 */
export default class InMemoryCacheProvider implements CacheProvider {
  _cache: Object;

  constructor(data: Object = {}) {
    this._cache = data;
  }

  get cachedComponents(): mixed {
    return Object.assign({}, this._cache);
  }

  get cachedComponentKeys(): Array<string> {
    return Object.keys(this._cache);
  }

  getCacheKey(cacheKey: string): string {
    return cacheKey;
  }

  getCachedComponent(cacheKey: string): mixed {
    if (typeof this._cache[cacheKey] !== 'undefined') {
      return Object.assign({}, this._cache[cacheKey]);
    }
  }

  setCachedComponent(cacheKey: string, data: mixed): void {
    Object.assign(this._cache, { [cacheKey]: data });
  }
}
