// @flow
import React from 'react';
import { ReactPartialRenderer } from 'react-dom/server';
import invariant from 'invariant';
import type {ReactElement} from 'shared/ReactElementType';

// copied from ReactPartialRenderer, should refactor.
export type ReactNode = string | number | ReactElement;
export type Frame = Object; // from ReactPartialRenderer, should refactor

export type TemplateData = {
  previousWasTextNode: boolean,
  currentSelectValue: any,
  template: mixed
};

export interface TemplateEngine {
  supportsCache(component: ReactNode | null): boolean,
  getTemplateKey(component: ReactNode, props: Object, context: Object, parentNamespace: string): string,
  generateTemplate(child: ReactNode, frame: Frame, reactPartialRenderer: Object): mixed,
  render(template: mixed, child: ReactNode, frame: Frame, reactPartialRenderer: Object): string
}

export interface TemplateCache {
  getCacheKey(component: ReactNode, templateKey: string): string,
  get(key: string): TemplateData,
  set(key: string, data: TemplateData): void
}

class ReactPartialRendererCache extends ReactPartialRenderer {
  templateEngine: TemplateEngine;
  cacheProvider: TemplateCache;

  constructor(children: mixed, makeStaticMarkup: boolean, options: Object = {}) {
    super(children, makeStaticMarkup);
    this.templateEngine = options.templateEngine;
    this.cacheProvider = options.cacheProvider;

    invariant(typeof this.templateEngine !== 'undefined' === typeof this.cacheProvider !== 'undefined',
      `A 'cacheProvider' is required when using a template engine.`);
    invariant(typeof this.cacheProvider !== 'undefined' === typeof this.templateEngine !== 'undefined',
      `A 'templateEngine' is required when using a cache provider.`);
  }

  // Util method for template engines to render an entire frame before caching the output
  renderFullFrame(child: ReactNode | null, context: Object, parentNamespace: string): string {
    var frameStackIndex = this.stack.length;
    var out = super.render(child, context, parentNamespace);
    while (this.stack.length > frameStackIndex) {
      out += this.renderFrame();
    }

    return out;
  }

  render(
    child: ReactNode | null,
    context: Object,
    parentNamespace: string,
  ): string {
    // console.log('1');
    // console.log(child);
    // console.log('1: ' + React.isValidElement(child));
    // console.log('1: ' + this.templateEngine.supportsCache(child.type));
    if (React.isValidElement(child) && // TODO: Is there a more efficient way to do this?
      this.templateEngine && this.templateEngine.supportsCache(child.type)) {
      // console.log('2');
      var cacheKey = this.cacheProvider.getCacheKey(
        child.type,
        this.templateEngine.getTemplateKey(child.type, child.props, context, parentNamespace));
      console.log('Key: ' + cacheKey);
      var cachedFrame = this.cacheProvider.get(cacheKey);
      if (typeof cachedFrame === 'undefined') {
        // todo; need to be able to substitute child.props for rendering templates with replaceable content

        // TODO: Add TRACING
        // TODO: Ensure, if props are passed to a template, that they are RENDERED FIRST (for injection)
        // TODO: Electrode Template Engine? - branch.

        // pass the renderer instance so the templateEngine and close the templates for caching
        var generatedTemplate = this.templateEngine.generateTemplate(child, context, parentNamespace, this);

        // This should be internally managed by the templateEngine
        //var html = this.renderFullFrame(child, frame); // TODO: What if PROPs need to be params for templating?

        // ie; for THIS component accept props, but render its internal children as is?
        // - initially: support caching of components ONLY without '.children' prop
        // - configure replacement of (some) PROP(s), via template strings
        // ensure the design allows use of templates with children, by assigning closing tag(s) in output to FRAME?
        // todo - this would require a FRAME be stored in the cache...
        cachedFrame = {
          template: generatedTemplate,
          previousWasTextNode: this.previousWasTextNode,
          currentSelectValue: this.currentSelectValue,
        };
        this.cacheProvider.set(cacheKey, cachedFrame);
      }

      // NOTE: if required, this should allow templateEngines to CACHE full FRAMES and
      //       render the entire frame during render
      const { template, previousWasTextNode, currentSelectValue } = cachedFrame;
      var out = this.templateEngine.render(template, child, context, this);
      this.currentSelectValue = currentSelectValue;
      this.previousWasTextNode = previousWasTextNode;
      return out;
    }

    // console.log('9');
    return super.render(child, context, parentNamespace);
  }
}

export default ReactPartialRendererCache;
