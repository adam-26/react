// @flow
import type { CacheStrategyContext, ReactElement, ReactNode } from './flowTypes';
import PluginManager from './PluginManager';

export default class PluginCacheStrategy {
  pluginManager: PluginManager;
  cacheContext: CacheStrategyContext;

  constructor(pluginManager: PluginManager, cacheContext: CacheStrategyContext) {
    this.pluginManager = pluginManager;
    this.cacheContext = cacheContext;
  }

  /**
   * Gets the cache strategy state for a component.
   *
   * @param component
   * @param props
   * @param context
   * @returns {*} if undefined is returned, the cache strategy render method will not be invoked for this component.
   */
  getCacheState(component: ReactNode, props: Object, context: Object): any {
    const pluginNames = this.pluginManager.getComponentCachePlugins(component, props, context);
    if (pluginNames.length) {
      return pluginNames;
    }
  }

  /**
   * Renders an element using a cache strategy.
   *
   * @param element to render
   * @param context to use for rendering
   * @param cacheState the state returned by the getCacheState() method
   * @param renderUtils to simplify rendering of cached component
   * @returns {string} the rendered component
   */
  render(element: ReactElement, context: Object, cacheState: mixed, renderUtils: Object): string {
    return this.pluginManager.renderCacheComponent(this.cacheContext, cacheState, element, context, renderUtils);
  }
}
