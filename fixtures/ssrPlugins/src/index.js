import React from 'react';
import {hydrate} from 'react-dom';
import createHistory from 'history/createBrowserHistory'
import queryString from 'query-string';

import App from './components/App';
import TemplateApp from './components/TemplateApp';

// determine what to render on the client
const history = createHistory();
const { pathname, search } = history.location;

// This is hacky - but its just a proof of concept.
if (['/template', '/streamtemplate'].indexOf(pathname) !== -1) {
  const qs = queryString.parse(search);
  hydrate(<TemplateApp name={qs.name} minutes={window.__MINUTES} assets={window.assetManifest} />, document);
}
else {
  hydrate(<App minutes={window.__MINUTES} assets={window.assetManifest} />, document);
}
