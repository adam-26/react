// @flow
import reactDisplayName from 'react-display-name';
import type { CacheStrategyContext, CacheStrategyPlugin } from './flowTypes';

/**
 * Manages FrameBoundaryPlugins.
 *
 * Plugins are processed in the order they are added to the plugin manager.
 *
 * For example, you may register a Cache plugin and a Template plugin. In this scenario
 * the cache plugin should be registered first, so that when it is rendering content to cache
 * that content is rendered using the template plugin.
 */
export default class PluginManager {
  _plugins: Array<CacheStrategyPlugin>;

  constructor() {
    this._plugins = {};
    this._pluginNames = [];
  }

  get hasPlugins(): boolean {
    return this._pluginNames.length !== 0;
  }

  addPlugin(plugin: CacheStrategyPlugin): void {
    this._plugins[plugin.cacheStrategyName] = plugin;
    this._pluginNames.push(plugin.cacheStrategyName);
  }

  /**
   * Determine if a component supports SSR cache
   */
  getComponentCachePlugins(component: any, props: Object, context: Object): Array<string> {
    const cachePlugins = [];
    for (let i = 0, len = this._pluginNames.length; i < len; i++) {
      const pluginName = this._pluginNames[i];
      if (this._plugins[pluginName].canCacheComponent(component, props, context)) {
        cachePlugins.push(pluginName);
      }
    }

    return cachePlugins;
  }

  renderCacheComponent(
    cacheCtx: CacheStrategyContext,
    pluginNames: Array<string>,
    element: ReactElement,
    context: Object,
    renderUtils: RenderUtils): string
  {
    const {
      renderCurrentElement,
      renderElement,
      getRendererState,
      setRendererState
    } = renderUtils;

    if (!this.hasPlugins || pluginNames.length === 0) {
      // render the entire original frame
      return renderCurrentElement();
    }

    const renderElementWithPlugin = (element: ReactNode, context: Object, methodName, pluginMap: Object) => {
      const remainingPlugins = pluginMap[methodName];
      const nextPluginName = remainingPlugins.shift();
      const nextPlugin = this._plugins[nextPluginName];
      const { type, props } = element;

      const cacheKey = cacheCtx.getCacheKey(
        nextPlugin.cacheStrategyName,
        nextPlugin.getCacheKey(reactDisplayName(type), type, props, context));

      let cachedComponent = cacheCtx.getCachedComponent(cacheKey);
      if (typeof cachedComponent === 'undefined') {

        const cacheMissStart = cacheCtx.startCacheRender();

        // Ensure the renderUtils utilize the cache plugins
        const componentCache = nextPlugin.renderForCache(element, context, {
          ...renderUtils,

          renderCurrentElement: !remainingPlugins.length ?
            renderCurrentElement :
            (props?: Object = element.props) =>
              renderElementWithPlugin(Object.assign({}, element, {props}), context, 'renderCurrentElement', pluginMap),

          renderElement: !remainingPlugins.length ?
            renderElement :
            (element: ReactElement, context?: Object = context) =>
              renderElementWithPlugin(element, context, 'renderElement', pluginMap),

        });

        cacheCtx.cacheMiss(nextPluginName, cacheKey, cacheMissStart);

        const rendererState = getRendererState();
        cachedComponent = { componentCache, rendererState };
        cacheCtx.setCachedComponent(cacheKey, cachedComponent);
      }
      else {
        cacheCtx.cacheHit(nextPluginName, cacheKey);
      }

      const { componentCache, rendererState } = cachedComponent;

      // Render using cache
      const start = cacheCtx.startCacheRender();
      const out = nextPlugin.renderFromCache(componentCache, props, context, renderUtils);
      cacheCtx.endCacheRender(nextPluginName, cacheKey, start);

      setRendererState(rendererState);
      return out;
    };

    return renderElementWithPlugin(element, context, 'renderCurrentElement', {
      renderCurrentElement: pluginNames.slice(),
      renderElement: pluginNames.slice(),
    });
  }
}
