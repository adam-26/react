// @flow
import type { ReactNode, TemplateCache, TemplateData } from '../ReactCachedPartialRenderer';

/**
 * Only for prototyping
 */
class InMemoryTemplateCache implements TemplateCache {
  cache: Object;

  constructor() {
    this.cache = {};
  }

  getCacheKey(component: ReactNode, templateKey: string): string {
    return templateKey;
  }

  get(key: string): TemplateData {
    return this.cache[key];
  }

  set(key: string, data: TemplateData): void {
    this.cache[key] = Object.assign({}, data);
  }
}

export default InMemoryTemplateCache;
