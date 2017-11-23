import type {ReactElement} from '../../../../packages/shared/ReactElementType';

// copied from ReactPartialRenderer, should refactor.
type ReactNode = string | number | ReactElement;

// from ReactPartialRenderer, should refactor
type Frame = Object;

type RenderFrame = (element: ReactNode, context: Object, domNamespace: string) => string;

type SetFrameState = (previousWasTextNode: boolean, currentSelectValue: any) => void;

/**
 * The interface that all FrameBoundary plugins must implement.
 *
 * A frame boundary plugin is responsible for rendering a complete frame.
 * Example plugins include cache, and templates.
 */
export interface FrameBoundaryPlugin {

  /**
   * Get the plugin name.
   */
  getPluginName(): string,

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
  isFrameBoundary(component: mixed, props: Object, context: Object): boolean,

  /**
   * Render a complete frame, including all child frames.
   */
  renderFrameBoundary(
    element: ReactNode,
    context: Object,
    domNamespace: string,
    renderFrame: RenderFrame,
    setFrameState: SetFrameState
  ): string
}

export type {
  ReactElement,
  ReactNode,
  Frame,
  RenderFrame,
  SetFrameState,
  FrameBoundaryPlugin
};
