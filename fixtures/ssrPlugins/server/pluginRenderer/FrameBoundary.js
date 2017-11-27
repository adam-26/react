// @flow
import { ReactElement } from './frameBoundaryTypes';

export default class FrameBoundary {
  _element: ReactElement;
  _pluginNames: Array<string>;
  _isFirstFrame: boolean;

  constructor(element: mixed, pluginNames: Array<string>, isFirstFrame: boolean) {
    this._element = element;
    this._pluginNames = pluginNames;
    this._isFirstFrame = isFirstFrame;
  }

  get element(): ReactElement {
    return this._element;
  }

  get pluginNames(): Array<string> {
    return this._pluginNames;
  }

  get isFirstFrame(): boolean {
    return this._isFirstFrame;
  }

  addPlugin(pluginName: string): void {
    this._pluginNames.push(pluginName);
  }
}
