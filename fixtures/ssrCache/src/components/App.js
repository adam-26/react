import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Cache from './Cache';
import Chrome from './Chrome';
import Page from './Page';

export default class App extends Component {

  static propTypes = {
    minutes: PropTypes.number.isRequired
  };

  render() {
    return (
      <Cache
        cacheKey={({minutes}) => `CacheKey:${minutes}`}
        render={({minutes}) =>
          <Chrome title="Hello World" minutes={minutes} assets={this.props.assets}>
            <div>
              <h1>Hello World</h1>
              <Page minutes={minutes} />
            </div>
          </Chrome>
        }
        minutes={this.props.minutes} />
    );
  }
}
