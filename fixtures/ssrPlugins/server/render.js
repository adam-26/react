import React from 'react';
import { renderToString, renderToNodeStream } from 'react-dom/server';
import CacheTemplatePlugin from '../src/plugins/cacheTemplatePlugin/server/CacheTemplatePlugin';
import StaticCachePlugin from '../src/plugins/simpleCachePlugin/server/StaticCachePlugin';
import ComponentCachePlugin from '../src/plugins/componentCachePlugin/server/ComponentCachePlugin';
import App from '../src/components/App';import TemplateApp from '../src/components/TemplateApp';
import PluginCacheStrategyFactory from './pluginCacheStrategy';
import CachedComponentRenderer from './cachedComponentRenderer';
import pkg from '../package.json';

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

function getEndTime(startTime: mixed): void {
  const end = process.hrtime(startTime);
  const nanoseconds = (end[0] * 1e9) + end[1];
  return nanoseconds / 1e6;
}

function logEndTime(description: string, startTime: mixed): void {
  console.log(`[${description}: ${getEndTime(startTime)}ms]`);
}

const renderStats = {
  start: (): any => {
    return process.hrtime();
  },

  end: (startTime: any): void => {
    logEndTime('Render.read', startTime);
  }
};

const pluginCacheStrategyFactory = new PluginCacheStrategyFactory({
  plugins: [
    new StaticCachePlugin(),
    new ComponentCachePlugin(),
    new CacheTemplatePlugin()
  ]
});

const cacheStatsProvider = {
  startRender: renderStats.start,
  endRender: (pluginName: string, cacheKey: string, start: any): void => {
    logEndTime(`strategy: ${pluginName} - render(${cacheKey})`, start);
  },
  cacheHit: (pluginName: string, cacheKey: string): void => {
    console.log(`cache hit: ${pluginName}.${cacheKey}`);
  },
  cacheMiss: (pluginName: string, cacheKey: string, start: any): void => {
    console.log(`cache miss: ${pluginName}.${cacheKey} - ${getEndTime(start)}ms`);
  },
};

const cachedComponentRenderer = new CachedComponentRenderer(
  pkg.version,
  pluginCacheStrategyFactory, {
    cacheStatsProvider: cacheStatsProvider
  });

const getReqMs = (start) => {
  const end = process.hrtime(start);
  const nanoseconds = (end[0] * 1e9) + end[1];
  return nanoseconds / 1e6;
};

const renderReq = (description, renderToString) => {
  const start = process.hrtime();
  const out = renderToString();
  console.log(`Render ${description} req: ${getReqMs(start)}ms`);
  return out;
};

const streamReq = (description, callback) => {
  const start = process.hrtime();
  const onEnd = () => {
    console.log(`Stream ${description} req: ${getReqMs(start)}ms`);
  };
  callback(onEnd);
};

function renderAppToString(renderOpts) {
  return renderToString(<App minutes={getMinutes()} assets={assets}/>, renderOpts);
}

function renderAppToStream(renderOpts) {
  return renderToNodeStream(<App minutes={getMinutes()} assets={assets}/>, renderOpts);
}

function renderTemplateAppToString(renderOpts, req) {
  const name = req.query.name;
  return renderToString(<TemplateApp minutes={getMinutes()} name={name} assets={assets}/>, renderOpts);
}

function renderTemplateAppToStream(renderOpts, req) {
  const name = req.query.name;
  return renderToNodeStream(<TemplateApp minutes={getMinutes()} name={name} assets={assets}/>, renderOpts);
}

function renderStringResponse(
  description: string, req: mixed, res: mixed, renderOpts?: Object, renderApp = renderAppToString, done = ()=>{}) {
  return renderReq(description, () => {
    var html = renderApp(renderOpts, req);
    // There's no way to render a doctype in React so prepend manually.
    res.send('<!DOCTYPE html>' + html);
    done();
  });
}

function renderStreamResponse(
  description: string, req: mixed, res:mixed, renderOpts?: Object, renderApp = renderAppToStream, done = ()=>{}) {
  streamReq(description, onEnd  => {
    const stream = renderApp(renderOpts, req);
    stream.pipe(res, {end: false});
    stream.on('end', () => {
      res.end();
      onEnd();
      done();
    });
  });
}

function renderWithCacheStrategy(req, res, render) {

  // The cachedComponentProvider could async load all cached components/templates before rendering
  cachedComponentRenderer.render(req.url, (err, cacheStrategy, done) => {
    if (err) {
      return render(err);
    }

    render(
      undefined,
      cacheStrategy,
      done);
  }, (err) => {
    if (err) {
      // error writing to cache (HTML response is OK) - just log for prototype
      console.error(err);
    }
  });
}

export function renderToStringNoCache(req, res) {
  renderStringResponse('no-cache', req, res, { renderStats });
}

export function renderToStringUsingCache(req, res) {
  renderToStringUsingCacheStrategy('cache', req, res, renderAppToString);
}

export function renderToStringUsingTemplateCache(req, res) {
  renderToStringUsingCacheStrategy('templateCache', req, res, renderTemplateAppToString);
}

export function renderToStringUsingCacheStrategy(description, req, res, render) {
  renderWithCacheStrategy(req, res, (err, cacheStrategy, done) => {
    if (err) {
      throw err;
    }

    renderStringResponse(
      description, req, res, { cacheStrategy, renderStats }, render, done);
  });
}

export function renderToStreamNoCache(req, res) {
  renderStreamResponse('no-cache', req, res, { renderStats });
}

export function renderToStreamUsingCache(req, res) {
  renderToStreamUsingCacheStrategy('cache', req, res, renderAppToStream);
}

export function renderToStreamUsingTemplateCache(req, res) {
  renderToStreamUsingCacheStrategy('templateCache', req, res, renderTemplateAppToStream);
}

export function renderToStreamUsingCacheStrategy(description, req, res, render) {
  renderWithCacheStrategy(req, res, (err, cacheStrategy, done) => {
    if (err) {
      throw err;
    }

    renderStreamResponse(description, req, res, { cacheStrategy, renderStats }, render, done);
  });
}
