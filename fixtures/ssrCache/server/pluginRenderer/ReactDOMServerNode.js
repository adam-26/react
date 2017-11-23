/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ReactPartialRenderer } from 'react-dom/server';
import ReactPartialPluginRenderer from './ReactPartialPluginRenderer';
import {renderToString, renderToStaticMarkup} from './ReactDOMStringRenderer';
import {
  renderToNodeStream,
  renderToStaticNodeStream,
} from './ReactDOMNodeStreamRenderer';

// Note: when changing this, also consider https://github.com/facebook/react/issues/11526
export {
  ReactPartialRenderer,
  ReactPartialPluginRenderer,
  renderToString,
  renderToStaticMarkup,
  renderToNodeStream,
  renderToStaticNodeStream
};
