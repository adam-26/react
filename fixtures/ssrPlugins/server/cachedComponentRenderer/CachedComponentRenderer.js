// @flow
import CachedComponentContext from './CachedComponentContext';
import InMemoryCacheProvider from '../pluginCacheStrategy/cacheProvider/InMemoryCacheProvider';
import InMemoryCachedComponentProvider from './cachedComponentProvider/InMemoryCachedComponentProvider';
import PluginCacheStrategyFactory from '../pluginCacheStrategy/PluginCacheStrategyFactory';
import type { CachedComponentProvider } from './flowTypes';
import type { CacheStatsProvider } from '../pluginCacheStrategy/flowTypes';

type RenderApp = (err: any, cacheContext: CachedComponentContext, done: (err?: any) => void) => void
type RenderCallback = (err: any) => void;

type Options = {
  cacheProvider?: CachedComponentProvider,
  cacheStatsProvider?: CacheStatsProvider
};

/**
 * Cached component renderer.
 *
 * Asynchronously loads cached components required for the requested URL before
 * rendering the application, allowing SSR plugins to take advantage of shared cache.
 *
 * Extend this class if a custom context is required and override the 'createContext' method.
 */
export default class CachedComponentRenderer {
  appVersion: string;
  cacheStrategyFactory: PluginCacheStrategyFactory;
  cachedComponentProvider: CachedComponentProvider;
  cacheStatsProvider: CacheStatsProvider;

  constructor(
    appVersion: string,
    cacheStrategyFactory: PluginCacheStrategyFactory,
    options: Options): void
  {
    const opts = Object.assign({
      cacheProvider: new InMemoryCachedComponentProvider(),
      cacheStatsProvider: undefined
    }, options);

    this.appVersion = appVersion;
    this.cacheStrategyFactory = cacheStrategyFactory;
    this.cachedComponentProvider = opts.cacheProvider;
    this.cacheStatsProvider = opts.cacheStatsProvider;
  }

  createContext(componentCache: mixed, appVersion: string, cacheStats: CacheStatsProvider): CachedComponentContext {
    return new CachedComponentContext(new InMemoryCacheProvider(componentCache), appVersion, cacheStats);
  }

  // todo; requires URLs are canonized to prevent duplicate cache entries...
  render(url: string, renderApp: RenderApp, callback?: RenderCallback = ()=>{}): void {
    this.cachedComponentProvider.getCachedComponents(url, (err, componentCache) => {
      if (err) {
        return renderApp(err);
      }

      const ctx = this.createContext(componentCache, this.appVersion, this.cacheStatsProvider);
      renderApp(undefined, this.cacheStrategyFactory.createCacheStrategy(ctx), (err) => {
        if (err || !ctx.hasNewTemplates) {
          return callback(err);
        }

        // update cache
        this.cachedComponentProvider.setCachedComponents(url, ctx, callback);
      });
    });
  }
}
