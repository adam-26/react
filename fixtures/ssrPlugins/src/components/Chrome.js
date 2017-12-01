import React, {Component} from 'react';

import './Chrome.css';
import PageLinks from './PageLinks';

import PropTypes from 'prop-types';

// used to test triggering the render template context changed warning
class ContextChanger extends Component {

  static childContextTypes = {
    test: PropTypes.string
  };

  getChildContext() {
    return {
      test: 'value'
    }
  }

  render() {
    return this.props.children;
  }

}


export default class Chrome extends Component {
  render() {
    const assets = this.props.assets;
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="shortcut icon" href="favicon.ico" />
          <link rel="stylesheet" href={assets['main.css']} />
          <title>{this.props.title}</title>
        </head>
        <body>
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<b>Enable JavaScript to run this app.</b>`,
            }}
          />
          <PageLinks />
          <ContextChanger>
            {this.props.children}
          </ContextChanger>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__MINUTES = ${JSON.stringify(this.props.minutes)};`,
            }}
          />
          <script
            dangerouslySetInnerHTML={{
              __html: `assetManifest = ${JSON.stringify(assets)};`,
            }}
          />
          <script src={assets['main.js']} />
        </body>
      </html>
    );
  }
}
