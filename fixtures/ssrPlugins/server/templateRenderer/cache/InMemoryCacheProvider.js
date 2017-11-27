// @flow
import type { CacheProvider } from './CacheProvider';
import type TemplateContext from '../TemplateContext';

/**
 * A simple cache provider for the proof of concept.
 *
 * For production, the cache provider could include features such as:
 * - use the URL to create cache bags containing url-specific templates
 * - LRU cache
 * - a shared cache provider (redis, mem-cache, etc..)
 * - storing most commonly used cached templates in memory (access '.templateKeys' from context)
 * - map [URLs <-> TemplateCacheKeys], so only missing templates are retrieved from a shared cache
 */
export default class InMemoryCacheProvider implements CacheProvider {
  _cache: Object;

  constructor() {
    this._cache = {};
  }

  getTemplates(url: string, callback: (err?: any, templates?: Object) => void): void {
    return callback(undefined, Object.assign({}, this._cache));
  }

  setTemplates(url: string, ctx: TemplateContext, callback: (err?: any) => void): void {
    // this._cache[url] = ctx.templates;
    Object.assign(this._cache, ctx.templates);
    callback();
  }
}
