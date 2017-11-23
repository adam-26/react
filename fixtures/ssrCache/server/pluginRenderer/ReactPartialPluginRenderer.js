// @flow
import React from 'react';
import { ReactPartialRenderer } from 'react-dom/server';
import type { ReactNode, Frame } from './frameBoundaryTypes';
import FrameBoundary from './FrameBoundary';
import PluginManager from './PluginManager';

/**
 * Provides a basic plugin interface to modify behavior of the server-side partial renderer.
 */
export default class ReactPartialPluginRenderer extends ReactPartialRenderer {
  pluginManager: PluginManager;

  constructor(children: mixed, makeStaticMarkup: boolean, options: Object = {}) {
    super(children, makeStaticMarkup);
    this.pluginManager = new PluginManager();

    if (options.plugins && options.plugins.length) {
      options.plugins.forEach(plugin => this.pluginManager.addPlugin(plugin));
    }

    this.setFrameState = this.setFrameState.bind(this);
  }

  read(bytes: number): string | null {
    const start = process.hrtime();
    const out = super.read(bytes);
    const end = process.hrtime(start);
    const nanoseconds = (end[0] * 1e9) + end[1];
    const milliseconds = nanoseconds / 1e6;
    console.log(`[ReactPartialFrameRenderer.read: ${milliseconds}ms]`);
    return out;
  }

  resolveElement(
    element: mixed,
    context: Object,
  ): {|
    nextChild: mixed,
    nextContext: Object,
  |} {
    const pluginNames = this.pluginManager.getFrameBoundaryPlugins(element.type, element.props, context);
    if (pluginNames.length) {
      if (this.isCacheBoundaryFrame !== true) {
        return {nextChild: new FrameBoundary(element, pluginNames), nextContext: context};
      }

      // RESET FLAG, this prevents recursive behavior
      this.isCacheBoundaryFrame = false;
    }

    return super.resolveElement(element, context);
  }

  setFrameState(previousWasTextNode: boolean, currentSelectValue: any): void {
    this.previousWasTextNode = previousWasTextNode;
    this.currentSelectValue = currentSelectValue;
  }

  renderFrame(frame: Frame): string {
    if (frame.childIndex === 0 && (frame.children instanceof FrameBoundary)) {

      // remove the cacheBoundaryFrame from the stack
      this.stack.pop();

      const cacheFrameIdx = this.stack.length;
      const renderFullFrame = (element: ReactNode, context: Object, domNamespace: string) => {
        let out = '';
        this.isCacheBoundaryFrame = true;

        out += super.renderFrame(
          ReactPartialRenderer.createFrame(domNamespace, React.Children.toArray(element), context));
        while (this.stack.length > cacheFrameIdx) {
          out += this.renderCurrentFrame();
        }

        return {
          html: out,
          previousWasTextNode: this.previousWasTextNode,
          currentSelectValue: this.currentSelectValue
        };
      };

      const { pluginNames, element } = frame.children;
      return this.pluginManager.renderFrameBoundary(pluginNames, element, frame, renderFullFrame, this.setFrameState);
    }

    return super.renderFrame(frame);
  }

  renderComponent(
    nextChild: ReactNode | null,
    context: Object,
    parentNamespace: string,
  ): string {
    if (nextChild instanceof FrameBoundary) {
      // Special-case, a frame boundary requires its own frame
      this.stack.push(ReactPartialRenderer.createFrame(parentNamespace, nextChild, context));
      return '';
    }

    return super.renderComponent(nextChild, context, parentNamespace);
  }
}
