import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Cache from '../plugins/simpleCachePlugin/components/Cache';
import Chrome from './Chrome';
import Page from './Page';

export default class App extends Component {

  static propTypes = {
    minutes: PropTypes.number.isRequired
  };

  render() {

    // This component uses a <Cache /> component to cache the content of that component with the assigned key.
    // - in this example, the cache uses a 'minute' value to expire the cache every minute.
    return (
      <Cache
        cacheKey={({minutes}) => `CacheKey:${minutes}`}
        render={({minutes}) =>
          <Chrome title="Hello World" minutes={minutes} assets={this.props.assets}>
            <Page minutes={minutes} />
          </Chrome>
        }
        minutes={this.props.minutes} />
    );
  }
}
