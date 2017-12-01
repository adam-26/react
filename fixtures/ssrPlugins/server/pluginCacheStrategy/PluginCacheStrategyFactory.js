// @flow
import PluginManager from './PluginManager';
import PluginCacheStrategy from './PluginCacheStrategy';
import CacheContext from './CacheContext';
import InMemoryCacheProvider from './cacheProvider/InMemoryCacheProvider';
import type { CacheStrategyPlugin } from './flowTypes';

type StrategyOptions = {
  plugins: Array<CacheStrategyPlugin>
};

export default class PluginCacheStrategyFactory {
  pluginManager: PluginManager;

  constructor(options: StrategyOptions) {
    this.pluginManager = new PluginManager();
    const rendererOptions = Object.assign({ plugins: [] }, options);

    if (rendererOptions.plugins.length) {
      rendererOptions.plugins.forEach(plugin => {
        this.pluginManager.addPlugin(plugin)
      });
    }
  }

  createCacheStrategy(
    cacheContext?: CacheContext = new CacheContext(new InMemoryCacheProvider())
  ): PluginCacheStrategy {
    return new PluginCacheStrategy(this.pluginManager, cacheContext);
  }
}
