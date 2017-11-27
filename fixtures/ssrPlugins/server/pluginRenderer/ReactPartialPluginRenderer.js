// @flow
import React from 'react';
import { ReactPartialRenderer } from 'react-dom/server';
import FrameBoundary from './FrameBoundary';
import PluginManager from './PluginManager';
import RendererContext from './RendererContext';
import type { ReactNode, Frame } from './frameBoundaryTypes';
import type RendererPlugin from './RendererPlugin';

type RendererOptions = {
  plugins: Array<RendererPlugin>,
  rendererCtx: RendererContext
};

/**
 * Provides a basic plugin interface to modify behavior of the server-side partial renderer.
 */
export default class ReactPartialPluginRenderer extends ReactPartialRenderer {
  pluginManager: PluginManager;
  isFirstFrame: boolean;

  constructor(children: mixed, makeStaticMarkup: boolean, options: RendererOptions) {
    super(children, makeStaticMarkup);
    this.pluginManager = new PluginManager();
    this.isFirstFrame = null;

    const rendererOptions = Object.assign({ rendererCtx: new RendererContext() }, options);
    this.rendererCtx = rendererOptions.rendererCtx;

    if (rendererOptions.plugins && rendererOptions.plugins.length) {
      rendererOptions.plugins.forEach(plugin => {
        plugin.setRendererContext(this.rendererCtx);
        this.pluginManager.addPlugin(plugin)
      });
    }

    this.setFrameState = this.setFrameState.bind(this);
    this.renderFullFrame = this.renderFullFrame.bind(this);
    this.resolveFrameBoundaryChild = super.resolveElement.bind(this);
  }

  read(bytes: number): string | null {
    this.rendererCtx.startRender();
    const out = super.read(bytes);
    this.rendererCtx.finishRender();
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
      return {nextChild: new FrameBoundary(element, pluginNames, this.isFirstFrame), nextContext: context};
    }

    return super.resolveElement(element, context);
  }

  setFrameState(previousWasTextNode: boolean, currentSelectValue: any): void {
    this.previousWasTextNode = previousWasTextNode;
    this.currentSelectValue = currentSelectValue;
  }

  renderFrame(frame: Frame): string {
    // isFirstFrame flag required so data-reactroot="" attribute is correctly applied
    if (this.isFirstFrame === null) {
      this.isFirstFrame = true;
    }
    else if (this.isFirstFrame) {
      this.isFirstFrame = false;
    }

    if (frame.childIndex === 0 && (frame.children instanceof FrameBoundary)) {
      const { pluginNames, element, isFirstFrame } = frame.children;

      if (isFirstFrame) {
        // remove the FrameBoundary from the stack before rendering
        // - this ensures the data-reactroot="" attribute is applied
        this.stack.pop();
      }

      const renderElement = (element: ReactNode, context: Object, domNamespace: string) => {
        return this.renderFullFrame(
          ReactPartialRenderer.createFrame(domNamespace, React.Children.toArray(element), context));
      };

      const { html, previousWasTextNode, currentSelectValue } =
        this.pluginManager.renderFrameBoundary(pluginNames, element, frame, {
          renderElement: renderElement,
          resolveFrameBoundaryChild: this.resolveFrameBoundaryChild,
          setFrameState: this.setFrameState });

      if (!isFirstFrame) {
        // remove the FrameBoundary from the stack after rendering
        // - this ensures the data-reactroot="" attribute is NOT applied
        this.stack.pop();
      }

      // Reset the frame state
      this.setFrameState(previousWasTextNode, currentSelectValue);
      return html;
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

  renderFullFrame(frame: Frame) {
    const cacheFrameIdx = this.stack.length;

    let out = '';

    // First we render the frames first child, then add the frame to the stack
    // - this must be done BEFORE adding the frame to the stack, to have data-reactdata="" attr correctly applied
    // - if the frame is added to the stack BEFORE initial render, the data attribute is not applied.
    // - the frame must then be added to the stack to ensure it's correctly closed.
    out += this.renderFrame(frame);
    this.stack.push(frame);

    while (this.stack.length > cacheFrameIdx) {
      out += this.renderCurrentFrame();
    }

    return {
      html: out,
      previousWasTextNode: this.previousWasTextNode,
      currentSelectValue: this.currentSelectValue
    };
  }
}
