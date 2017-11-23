// @flow
import { ReactElement } from './frameBoundaryTypes';

export default class FrameBoundary {
  _element: ReactElement;
  _pluginNames: Array<string>;

  constructor(element: mixed, pluginNames?: Array<string> = []) {
    this._element = element;
    this._pluginNames = pluginNames;
  }

  get element(): ReactElement {
    return this._element;
  }

  get pluginNames(): Array<string> {
    return this._pluginNames;
  }

  addPlugin(pluginName: string): void {
    this._pluginNames.push(pluginName);
  }
}
