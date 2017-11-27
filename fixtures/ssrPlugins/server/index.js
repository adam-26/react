require('ignore-styles');
const babelRegister = require('babel-register');
const proxy = require('http-proxy-middleware');

babelRegister({
  ignore: /\/(build|node_modules)\//,
  presets: ['react-app'],
});

const express = require('express');
const path = require('path');

const app = express();

// Application
if (process.env.NODE_ENV === 'development') {
  function cleanRequire() {
    // In development mode we clear the module cache between each request to
    // get automatic hot reloading.
    for (var key in require.cache) {
      delete require.cache[key];
    }
    return require('./render');
  }

  app.get('/', function(req, res) {
    cleanRequire().renderToStringUsingCache(req, res);
  });

  app.get('/nocache', function(req, res) {
    cleanRequire().renderToStringNoCache(req, res);
  });

  app.get("/template", (req, res) => {
    cleanRequire().renderToStringUsingTemplateCache(req, res);
  });

  app.get('/stream', function(req, res) {
    cleanRequire().renderToStreamUsingCache(req, res);
  });

  app.get("/streamnocache", (req, res) => {
    cleanRequire().renderToStreamNoCache(req, res);
  });

  app.get("/streamtemplate", (req, res) => {
    cleanRequire().renderToStreamUsingTemplateCache(req, res);
  });
} else {
  const render = require('./render');
  app.get('/', function(req, res) {
    render.renderToStringUsingCache(req, res);
  });

  app.get('/nocache', function(req, res) {
    render.renderToStringNoCache(req, res);
  });

  app.get("/template", (req, res) => {
    render.renderToStringUsingTemplateCache(req, res);
  });

  app.get("/stream", (req, res) => {
    render.renderToStreamUsingCache(req, res);
  });

  app.get("/streamnocache", (req, res) => {
    render.renderToStreamNoCache(req, res);
  });

  app.get("/streamtemplate", (req, res) => {
    render.renderToStreamUsingTemplateCache(req, res);
  });
}

// Static resources
app.use(express.static(path.resolve(__dirname, '..', 'build')));

// Proxy everything else to create-react-app's webpack development server
if (process.env.NODE_ENV === 'development') {
  app.use(
    '/',
    proxy({
      ws: true,
      target: 'http://localhost:3001',
    })
  );
}

app.listen(3000, () => {
  console.log('Listening on port 3000...');
});

app.on('error', function(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
});
