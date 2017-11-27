// @flow
import CacheTemplate from '../components/CacheTemplate';
import TemplatePlugin from '../../../../server/templateRenderer/TemplatePlugin';
import { ReactNode } from '../../../../server/pluginRenderer/frameBoundaryTypes';
import TemplateContext from '../../../../server/templateRenderer/TemplateContext';
import getDisplayName from 'react-display-name';
import type { RenderedFrameBoundary } from '../../../../server/pluginRenderer/frameBoundaryTypes';

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
export default class CacheTemplatePlugin extends TemplatePlugin {

  constructor(templateContext: TemplateContext) {
    super('cacheTemplate_plugin', templateContext);
  }

  isFrameBoundary(component: mixed, props: Object, context: Object): boolean {
    return component === CacheTemplate;
  }

  tokenizeProps(props: Object): Object {
    const tokens = {};
    Object.keys(props).forEach((propName, idx) => {
      tokens[propName] = `@${idx}@`;
    });

    return tokens;
  }

  renderFrameBoundary(
    element: ReactNode,
    context: Object,
    domNamespace: string,
    renderUtils: Object
  ): RenderedFrameBoundary {
    const { renderElement } = renderUtils;

    // tokenize
    const { props: { component, cacheKey, templateProps, injectedProps } } = element;
    const cacheKeyValue = this.getTemplateKey(cacheKey(getDisplayName(component), templateProps, context));
    let cacheTemplate = this.getTemplate(cacheKeyValue);

    if (typeof cacheTemplate === 'undefined') {
      this.logCacheMiss(cacheKeyValue);
      const tokens = this.tokenizeProps(injectedProps);

      const templateElement = Object.assign({}, element, {
        type: component,
        props: Object.assign({}, templateProps, tokens),
      });

      // Render a tokenized frame
      cacheTemplate = this.addTemplate(
        cacheKeyValue,
        tokens,
        renderElement(templateElement, context, domNamespace));
    }
    else {
      this.logCacheHit(cacheKeyValue);
    }

    const { tokens, tokenizedFrame: { html, previousWasTextNode, currentSelectValue }} = cacheTemplate;
    let out = html;

    // TODO: In __DEV__ verify that all 'injectedProps' were previously tokenized - warn if any props missing.

    // Resolve the injected props, and inject them into the template
    Object
      .keys(injectedProps)
      .forEach(propName => {
        // TODO: May need to 'setFrameState' here before rendering each injected prop ???
        // TODO: Add support for injecting any type, currently only react components are supported
        const { html } = renderElement(injectedProps[propName], context, domNamespace);
        out = out.replace(tokens[propName], html);
      });

    return { html: out, previousWasTextNode, currentSelectValue };
  }
}
