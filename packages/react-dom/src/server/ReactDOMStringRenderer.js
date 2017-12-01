/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import ReactPartialRenderer from './ReactPartialRenderer';

/**
 * Render a ReactElement to its initial HTML. This should only be used on the
 * server.
 * See https://reactjs.org/docs/react-dom-server.html#rendertostring
 */
export function renderToString(element, options?: Object = {}) {
  var renderer = new ReactPartialRenderer(element, { ...options, makeStaticMarkup: false });
  var markup = renderer.read(Infinity);
  return markup;
}

/**
 * Similar to renderToString, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://reactjs.org/docs/react-dom-server.html#rendertostaticmarkup
 */
export function renderToStaticMarkup(element, options?: Object = {}) {
  var renderer = new ReactPartialRenderer(element, { ...options, makeStaticMarkup: true });
  var markup = renderer.read(Infinity);
  return markup;
}
