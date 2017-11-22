/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Readable} from 'stream';

import ReactCachedPartialRenderer from './ReactCachedPartialRenderer';

// This is a Readable Node.js stream which wraps the ReactDOMPartialRenderer.
class ReactMarkupReadableStream extends Readable {
  constructor(element, makeStaticMarkup, options) {
    // Calls the stream.Readable(options) constructor. Consider exposing built-in
    // features like highWaterMark in the future.
    super({});
    this.partialRenderer = new ReactCachedPartialRenderer(element, makeStaticMarkup, options);
  }

  _read(size) {
    try {
      this.push(this.partialRenderer.read(size));
    } catch (err) {
      this.emit('error', err);
    }
  }
}
/**
 * Render a ReactElement to its initial HTML. This should only be used on the
 * server.
 * See https://reactjs.org/docs/react-dom-stream.html#rendertonodestream
 */
export function renderToNodeStream(element, options) {
  return new ReactMarkupReadableStream(element, false, options);
}

/**
 * Similar to renderToNodeStream, except this doesn't create extra DOM attributes
 * such as data-react-id that React uses internally.
 * See https://reactjs.org/docs/react-dom-stream.html#rendertostaticnodestream
 */
export function renderToStaticNodeStream(element, options) {
  return new ReactMarkupReadableStream(element, true, options);
}
