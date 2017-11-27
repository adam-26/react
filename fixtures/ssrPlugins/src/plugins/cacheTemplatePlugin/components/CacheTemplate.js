// @flow
import React, { Component } from 'react';
import PropTypes from 'prop-types';

/**
 * A Cache Template creates a template using an existing react component and writes the template
 * to cache. The template is then used to render future requests, improving server-side render performance.
 *
 * The Cache Template is designed to allow a shared cache to be used for templates, allowing all the
 * cached templates for a request URL to be loaded asynchronously before rendering a request.
 */
export default class CacheTemplate extends Component {

  static propTypes = {
    /**
     * The component that will be cached as a template
     */
    component: PropTypes.oneOfType([PropTypes.element, PropTypes.func]).isRequired,

    /**
     * The template cache key, the key can impact cached data validity
     */
    cacheKey: PropTypes.func,

    /**
     * The props that will be included (cached) as part of the template
     */
    templateProps: PropTypes.object,

    /**
     * Props that will be injected into the template when rendering a request using the template
     * NOTE: Currently, this ONLY supports injecting react components.
     */
    injectedProps: PropTypes.objectOf(PropTypes.element)
  };

  static defaultProps = {
    cacheKey: (componentName) => componentName,
    templateProps: {},
    injectedProps: {}
  };

  /**
   * Render the template on the client.
   *
   * On the server, the TemplatePlugin will render the template utilizing the cache to improve
   * the performance of server rendering.
   *
   * @returns {XML}
   */
  render() {
    // TODO: The client/server render of 'injectedProps' will not have the exact same context.
    //       The server (plugin) renders the 'injectedProps' BEFORE injection to the pre-rendered component template
    //       I don't consider this a blocking issue, using the <CacheTemplate> implies the developer wants to
    //       use SSR templates and should be aware of this issue from reading documentation.
    // TODO: Determine how to align the props/context of the client to be exactly the same as the server.

    // On the client, render the component using the provided props
    const { component, templateProps, injectedProps } = this.props;
    return React.createElement(component, { ...templateProps, ...injectedProps });
  }
}
