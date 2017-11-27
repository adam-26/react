import React from 'react';
import { renderToString, renderToNodeStream } from './pluginRenderer/ReactDOMServerNode';
import TemplateRenderer from './templateRenderer/TemplateRenderer';
import CacheTemplatePlugin from '../src/plugins/cacheTemplatePlugin/server/CacheTemplatePlugin';
import StaticCachePlugin from '../src/plugins/simpleCachePlugin/server/StaticCachePlugin';
import ComponentCachePlugin from '../src/plugins/componentCachePlugin/server/ComponentCachePlugin';
import InMemoryCacheProvider from './templateRenderer/cache/InMemoryCacheProvider';
import App from '../src/components/App';
import TemplateApp from '../src/components/TemplateApp';
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

const staticCachePlugin = new StaticCachePlugin();
const componentCachePlugin = new ComponentCachePlugin();
const templateRenderer = new TemplateRenderer(pkg.version, new InMemoryCacheProvider());

const renderUsingTemplates = (url, renderApp, callback) => {
  templateRenderer.render(url, renderApp, callback);
};

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

function renderWithTemplateCache(req, res, render) {
  renderUsingTemplates(req.url, (err, templateCtx, done) => {
    if (err) {
      console.error(err);
      return res.status(500);
    }

    render(undefined, templateCtx, done);
  }, (err) => {
    if (err) {
      // error writing to cache (HTML response is OK) - just log for prototype
      console.error(err);
    }
  });
}

export function renderToStringNoCache(req, res) {
  renderStringResponse('no-cache', req, res);
}

export function renderToStringUsingCache(req, res) {
  renderStringResponse('cache', req, res, { plugins: [componentCachePlugin, staticCachePlugin] });
}

export function renderToStringUsingTemplateCache(req, res) {
  renderWithTemplateCache(req, res, (err, templateCtx, done) => {
    renderStringResponse(
      'templateCache', req, res, { plugins: [componentCachePlugin, new CacheTemplatePlugin(templateCtx)] }, renderTemplateAppToString, done);
  });
}

export function renderToStreamNoCache(req, res) {
  renderStreamResponse('no-cache', req, res);
}

export function renderToStreamUsingCache(req, res) {
  renderStreamResponse('cache', req, res, { plugins: [componentCachePlugin, staticCachePlugin] });
}

export function renderToStreamUsingTemplateCache(req, res) {
  renderWithTemplateCache(req, res, (err, templateCtx, done) => {
    renderStreamResponse(
      'templateCache', req, res, { plugins: [componentCachePlugin, new CacheTemplatePlugin(templateCtx)] }, renderTemplateAppToStream, done);
  });
}
