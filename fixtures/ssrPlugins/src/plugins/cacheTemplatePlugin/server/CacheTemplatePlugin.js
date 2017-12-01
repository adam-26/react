// @flow
import React from 'react';
import CacheTemplate, { renderPlaceholders } from '../components/CacheTemplate';
// import getDisplayName from 'react-display-name';

import type { CacheStrategyPlugin } from '../../../../server/pluginCacheStrategy/flowTypes';

/**
 * A plugin that caches <CacheTemplate /> component output as a template, and allows for content
 * to be injected into the template for rendering.
 *
 * This allows cached render output to be re-used across requests.
 *
 * This plugin does use the templateRenderer to provide a template context.
 *
 * NOTE: This is only a proof of concept, tokenization is not safe/thorough
 *       Look at https://github.com/electrode-io/electrode-react-ssr-caching for a real tokenizer implementation
 */
export default class CacheTemplatePlugin implements CacheStrategyPlugin {

  /**
   * Cache strategy name getter
   */
  get cacheStrategyName(): string {
    return 'cacheTemplate_plugin';
  }

  /**
   * Determine if a component supports SSR cache
   */
  canCacheComponent(component: any, props: Object, context: Object): boolean {
    return component === CacheTemplate;
  }

  /**
   * Get a cacheKey for the component with assigned props/context
   */
  getCacheKey(componentName: string, component: mixed, props: Object, context: Object): string {
    const { cacheKey, templateProps } = props;
    return `${cacheKey(templateProps, context)}:${componentName}`;
  }

  /**
   * Render an element for insertion into the cache
   */
  renderForCache(element: ReactElement, context: Object, renderUtils: RenderUtils): mixed {
    const { renderCurrentElement, warnIfRenderModifiesContext } = renderUtils;
    const { injectedProps } = element.props;

    const sortedPropNames = CacheTemplate.getSortedInjectedProps(injectedProps);

    // Renders the component as a template, replacing an injected content with placeholders
    const renderTemplate = (): string => {
      renderPlaceholders(true);
      const html = renderCurrentElement(Object.assign({}, {
        ...element.props,
        sortedInjectedPropNames: sortedPropNames }));
      renderPlaceholders(false);
      return html;
    };

    // Render and tokenize the element
    const html = sortedPropNames.length ?
      warnIfRenderModifiesContext(
        context,
        (/*ctx*/) => renderTemplate(),
        'The context was modified when rendering a template. This may result in inconsistent server/client renders when injecting content into cached templates, resolve this by applying all context changes outside of the <Template> component.') :
      renderTemplate();

    return {
      html: CacheTemplate.tokenize(html),
      tokens: sortedPropNames,
    };
  }

  /**
   * Render a component using the cached component data
   * A simple cache strategy implementation would simply return the cachedData string in this method
   */
  renderFromCache(cachedData: mixed, props: Object, context: Object, renderUtils: RenderUtils): string {
    const { tokens, html } = cachedData;
    const { injectedProps } = props;
    const { renderElement } = renderUtils;

    // TODO: In __DEV__ verify that all 'injectedProps' were previously tokenized - warn if any props missing.

    let out = '';
    for (let i = 0, len = html.length; i < len; i++) {

      // TODO: Is there a way to 'setRendererState' after injecting each placeholder? Is it even required? Probably NOT!

      const htmlEntry = html[i];
      out += (typeof htmlEntry === 'number') ?
        renderElement(injectedProps[tokens[htmlEntry]], context) :
        htmlEntry;
    }

    return out;
  }
}
