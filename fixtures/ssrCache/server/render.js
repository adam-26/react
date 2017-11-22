import React from 'react';
import { renderToString, renderToNodeStream } from './cache/ReactDOMServerNode';
import SimpleTemplateEngine from './cache/templateEngine/SimpleTemplateEngine';
import InMemoryTemplateCache from './cache/templateCache/InMemoryTemplateCache';

import App from '../src/components/App';


let assets;
if (process.env.NODE_ENV === 'development') {
  // Use the bundle from create-react-app's server in development mode.
  assets = {
    'main.js': '/static/js/bundle.js',
    'main.css': '',
  };
} else {
  assets = require('../build/asset-manifest.json');
}

const templateEngine = new SimpleTemplateEngine();
const templateCache = new InMemoryTemplateCache();

export function renderToStringUsingCache() {
  var html = renderToString(<App assets={assets} />, {
    templateEngine: templateEngine,
    cacheProvider: templateCache
  });
  // There's no way to render a doctype in React so prepend manually.
  // Also append a bootstrap script tag.
  return '<!DOCTYPE html>' + html;
}

export function renderToStreamUsingCache(res) {
  // res.write("<!DOCTYPE html><html><head><title>SSR Cache</title></head><body>");
  const stream = renderToNodeStream(<App assets={assets} />, {
    templateEngine: templateEngine,
    cacheProvider: templateCache
  });

  stream.pipe(res, { end: false });
  stream.on('end', () => {
    // res.write("</body></html>");
    res.end();
  });
}

export function renderToStringNoCache() {
  var html = renderToString(<App assets={assets} />);
  // There's no way to render a doctype in React so prepend manually.
  // Also append a bootstrap script tag.
  return '<!DOCTYPE html>' + html;
}

export function renderToStreamNoCache(res) {
  // res.write("<!DOCTYPE html><html><head><title>SSR Cache</title></head><body>");
  const stream = renderToNodeStream(<App assets={assets} />);

  stream.pipe(res, { end: false });
  stream.on('end', () => {
    // res.write("</body></html>");
    res.end();
  });
}
