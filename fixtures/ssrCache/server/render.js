import React from 'react';
import { renderToString, renderToNodeStream } from './pluginRenderer/ReactDOMServerNode';
import StaticCachePlugin from './pluginRenderer/plugins/StaticCachePlugin';
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

function getMinutes() {
  return new Date(Date.now()).getMinutes();
}

const renderOpts = {
  plugins: [new StaticCachePlugin()]
};

const renderReq = (description, serve) => {
  const start = process.hrtime();
  const out = serve();
  const end = process.hrtime(start);
  const nanoseconds = (end[0] * 1e9) + end[1];
  const milliseconds = nanoseconds / 1e6;
  console.log(`Render ${description} req: ${milliseconds}ms`);
  return out;
};

const streamReq = (description, callback) => {
  const start = process.hrtime();
  const onEnd = () => {
    const end = process.hrtime(start);
    const nanoseconds = (end[0] * 1e9) + end[1];
    const milliseconds = nanoseconds / 1e6;
    console.log(`Stream ${description} req: ${milliseconds}ms`);
  };
  callback(onEnd);
};

export function renderToStringUsingCache() {
  return renderReq('cache', () => {
    const html = renderToString(<App minutes={getMinutes()} assets={assets}/>, renderOpts);
    // There's no way to render a doctype in React so prepend manually.
    // Also append a bootstrap script tag.
    return '<!DOCTYPE html>' + html;
  });
}

export function renderToStreamUsingCache(res) {
  streamReq('cache', onEnd  => {
    const stream = renderToNodeStream(<App minutes={getMinutes()} assets={assets}/>, renderOpts);

    stream.pipe(res, {end: false});
    stream.on('end', () => {
      res.end();
      onEnd();
    });
  });
}

export function renderToStringNoCache() {
  return renderReq('raw', () => {
    var html = renderToString(<App minutes={getMinutes()} assets={assets}/>);
    // There's no way to render a doctype in React so prepend manually.
    // Also append a bootstrap script tag.
    return '<!DOCTYPE html>' + html;
  });
}

export function renderToStreamNoCache(res) {
  streamReq('raw', onEnd  => {
    const stream = renderToNodeStream(<App minutes={getMinutes()} assets={assets}/>);

    stream.pipe(res, {end: false});
    stream.on('end', () => {
      res.end();
      onEnd();
    });
  });
}
