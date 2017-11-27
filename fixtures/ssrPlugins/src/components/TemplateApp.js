// @flow
import React, {Component} from 'react';
import PropTypes from 'prop-types';

import Chrome from './Chrome';
import Page from './Page';
import CacheTemplate from '../plugins/cacheTemplatePlugin/components/CacheTemplate';

export default class TemplateApp extends Component {

  static propTypes = {
    minutes: PropTypes.number.isRequired,
    name: PropTypes.string
  };

  render() {

    // This component uses a <CacheTemplate /> component to cache the content of that component.
    // - templates allow content to be injected, which is useful if a complex component is mostly static
    //   for many requests but requires small amount(s) of dynamic content for each individual request.
    const { minutes, name } = this.props;
    const pageProps = {
      minutes: minutes,
      name: name
    };
    const pageKeyFunc = (componentName, {name, minutes}) => `${componentName}:${name}:${minutes}`;

    // The 'injectedProps' are comprised of dynamic content to be injected into the template
    // Injected props can also use <Template>s and other plugins
    const injectedProps = {
      // children: <Page minutes={minutes} name={name} />
      children: <CacheTemplate
        component={Page}
        cacheKey={pageKeyFunc}
        templateProps={pageProps} />
    };

    // The 'Chrome' component apperas the the same every minute (in this example)
    // - using the componentName and 'minute' prop as the cacheKey, the <Chrome /> only
    //   needs to be rendered ONCE per minute
    // - all following requests will used the cached Chrome html when rendering the response on the server
    const cacheKeyFunc = (componentName, {minutes}) => `${componentName}:${minutes}`;
    const templateProps = {
      title: "Hello World",
      minutes: minutes,
      assets: this.props.assets
    };

    return (<CacheTemplate
      component={Chrome}
      cacheKey={cacheKeyFunc}
      templateProps={templateProps}
      injectedProps={injectedProps} />);
  }
}
