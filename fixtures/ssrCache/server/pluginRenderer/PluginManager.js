// @flow
import {FrameBoundaryPlugin, ReactNode, RenderFrame, Frame} from './frameBoundaryTypes';
import type {SetFrameState} from "./frameBoundaryTypes";

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
  _plugins: Array<FrameBoundaryPlugin>;

  constructor() {
    this._plugins = {};
    this._pluginNames = [];
  }

  get hasPlugins(): boolean {
    return this._pluginNames.length !== 0;
  }

  addPlugin(plugin: FrameBoundaryPlugin): void {
    this._plugins[plugin.getPluginName()] = plugin;
    this._pluginNames.push(plugin.getPluginName());
  }

  getFrameBoundaryPlugins(component: mixed, props: Object, context: Object): Array<string> {
    const boundaryPlugins = [];
    for (let i = 0, len = this._pluginNames.length; i < len; i++) {
      const pluginName = this._pluginNames[i];
      if (this._plugins[pluginName].isFrameBoundary(component, props, context)) {
        boundaryPlugins.push(pluginName);
      }
    }

    return boundaryPlugins;
  }

  renderFrameBoundary(
    pluginNames: Array<string>,
    element: ReactNode,
    frame: Frame,
    renderFrame: RenderFrame,
    setFrameState: SetFrameState
  ): string {
    if (!this.hasPlugins || pluginNames.length === 0) {
      // render the entire original frame
      return renderFrame(frame);
    }

    // render the frame - allow ordered plugins rendering preference
    const remainingPlugins = pluginNames.slice();
    const renderFrameWithPlugin = (element: ReactNode, context: Object, domNamespace: string) => {
      const nextPlugin = remainingPlugins.shift();
      return this._plugins[nextPlugin].renderFrameBoundary(
        element,
        context,
        domNamespace,
        remainingPlugins.length ? renderFrameWithPlugin : renderFrame,
        setFrameState);
    };

    return renderFrameWithPlugin(element, frame.context, frame.domNamespace);
  }
}
