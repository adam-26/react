// @flow
import CacheContext from '../pluginCacheStrategy/CacheContext';
import type { CacheProvider, CacheStatsProvider } from '../pluginCacheStrategy/flowTypes';

export default class CachedComponentContext extends CacheContext {
  _hasNewTemplates: boolean;
  _appVersion: string;

  constructor(cacheProvider: CacheProvider, appVersion: string, cacheStats?: CacheStatsProvider) {
    super(cacheProvider, cacheStats);
    this._hasNewTemplates = false;
    this._appVersion = appVersion;
  }

  get appVersion(): Object {
    return this._appVersion;
  }

  get hasNewTemplates(): boolean {
    return this._hasNewTemplates;
  }

  get cachedComponents(): mixed {
    return this.cacheProvider.cachedComponents;
  }

  get cachedComponentKeys(): Array<string> {
    return this.cacheProvider.cachedComponentKeys;
  }

  getCacheKey(cacheStrategyName: string, cacheStrategyKey: string): string {
    return super.getCacheKey(cacheStrategyName, `${cacheStrategyKey}:${this.appVersion}`);
  }

  setCachedComponent(cacheKey: string, data: mixed): void {
    super.setCachedComponent(cacheKey, data);
    if (!this._hasNewTemplates) {
      this._hasNewTemplates = true;
    }
  }
}
