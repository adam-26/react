// @flow
import invariant from 'invariant';
import type RendererContext from './RendererContext';
import type { FrameBoundaryPlugin, RenderedFrameBoundary } from '../pluginRenderer/frameBoundaryTypes';

export default class RendererPlugin implements FrameBoundaryPlugin {
  _pluginName: string;
  _rendererCtx: RendererContext;

  constructor(pluginName: string): void {
    this._pluginName = pluginName;
  }

  /**
   * Get the plugin name.
   */
  get pluginName(): string {
    return this._pluginName;
  }

  log(message: string): void {
    this._rendererCtx.log(message);
  }

  setRendererContext(rendererCtx: RendererContext): void {
    this._rendererCtx = rendererCtx;
  }

  /**
   * Determines if the component represents a frame boundary.
   *
   * A frame boundary is any component that defines a boundary where the component and all its children
   * must be rendered as a single unit.
   * For example;
   *  - any component that can render cached content is considered a frame boundary
   *  - any component that can use a template to improve rendering performance would also be a frame boundary
   *
   * Return true if this component is a frame boundary, otherwise false.
   */
  isFrameBoundary(component: mixed, props: Object, context: Object): boolean {
    invariant(false, 'Not implemented');
  }

  /**
   * Render a complete frame, including all child frames.
   */
  renderFrameBoundary(
    element: ReactNode,
    context: Object,
    domNamespace: string,
    renderUtils: Object
  ): RenderedFrameBoundary {
    invariant(false, 'Not implemented');
  }
}
