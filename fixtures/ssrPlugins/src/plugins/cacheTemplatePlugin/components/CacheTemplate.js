// @flow
import React, { Component } from 'react';
import invariant from 'invariant';
import PropTypes from 'prop-types';

const placeholderRegexp = /<div>@(\d+)@<\/div>/g;

/**
 * Placeholder is used to render placeholders on the server, and prevents props being applied
 * to placeholder props from within template components.
 */
class Placeholder extends Component {

  static propTypes = {
    index: PropTypes.number.isRequired,
    component: PropTypes.element.isRequired
  };

  static renderPlaceholders = false;

  render() {
    const { index, component, ...props } = this.props;
    const propNames = Object.keys(props);

    // Prevent props from being applied to placeholders
    invariant(
      propNames.length === 0,
      'Template placeholders do not allow props, instead pass props directly to the placeholder component. ' +
      'Invalid props: ' + propNames.join(', '));

    if (Placeholder.renderPlaceholders) {
      return React.createElement('div', null, `@${index}@`);
    }

    return component;
  }
}

export function renderPlaceholders(value: boolean): void {
  Placeholder.renderPlaceholders = value;
}

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
     *
     * NOTE: Currently, this ONLY supports injecting react components.
     */
    injectedProps: PropTypes.objectOf(PropTypes.element),

    // used internally
    sortedInjectedPropNames: PropTypes.arrayOf(PropTypes.string),
    verifyPlaceholderContext: PropTypes.func,
  };

  static defaultProps = {
    cacheKey: (componentName) => componentName,
    templateProps: {},
    injectedProps: {}
  };

  static getSortedInjectedProps = (injectedProps) => {
    return Object.keys(injectedProps).sort((a, b) => {
      const nameA = a.name.toUpperCase();
      const nameB = b.name.toUpperCase();
      if (nameA < nameB) {
        return -1;
      }
      if (nameA > nameB) {
        return 1;
      }

      // names must be equal
      return 0;
    });
  };

  // TODO: Look @ https://github.com/electrode-io/electrode-react-ssr-caching for a production implementation
  static tokenize = (html) => {
    let match;
    let lastIdx = 0;
    const htmlTokens = [];

    // eslint-disable-next-line no-cond-assign
    while ((match = placeholderRegexp.exec(html)) !== null) {
      const propNum = parseInt(match[1], 10);
      const endIdx = match.index;

      if (endIdx > lastIdx) {
        // add the html prefix
        htmlTokens.push(html.substring(lastIdx, endIdx));
      }

      // add the prop number
      htmlTokens.push(propNum);

      // Update params
      lastIdx = placeholderRegexp.lastIndex;
    }

    // Add tail HTML (if required)
    if (lastIdx > 0) {
      htmlTokens.push(html.substring(lastIdx));
    }
    else if (lastIdx === 0) {
      htmlTokens.push(html);
    }

    return htmlTokens;
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
    /*
      NOTE: The Template component will log a warning when rendering on the server if the context
            used to render the template and its children is modified by of the components rendered
            by the template.

            To avoid this warning, design templates so that all context values are set outside of the
            <Template> component, so the context is consistent throughout the template render.
     */

    const { component, templateProps, injectedProps, sortedInjectedPropNames } = this.props;
    const sortedProps = sortedInjectedPropNames || CacheTemplate.getSortedInjectedProps(injectedProps);

    // Prevents props being applied to injectedProps by cache components
    const placeholderProps = {};
    sortedProps.forEach((injectedPropName, idx) =>
      placeholderProps[injectedPropName] =
        <Placeholder index={idx} component={injectedProps[injectedPropName]} />);

    return React.createElement(component, { ...templateProps, ...placeholderProps });
  }
}
