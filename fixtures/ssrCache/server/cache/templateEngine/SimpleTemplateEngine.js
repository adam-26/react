// @flow
import type { ReactNode, Frame, TemplateEngine } from '../ReactCachedPartialRenderer';

/**
 * A template engine that statically caches content
 *
 * This can't handle any dynamic content, its only for prototyping.
 */
class SimpleTemplateEngine implements TemplateEngine {

  supportsCache(component: ReactNode): boolean {
    return typeof component === 'function' && typeof component.getCacheKey === 'function';
  }

  getTemplateKey(component: ReactNode, props: Object, context: Object, parentNamespace: string): string {
    return component.getCacheKey(props, context, parentNamespace);
  }

  // TODO: Consider implementing VERY BASIC token/replace impl to enable caching and injection of rendered PROPS -> Change 'children' of Chrome.js to 'content' and pass in as CACHED component...
  // TODO: Clean up (Remove console.log?) and make a commit - then possibly extend the SimpleTemplateEngine
  // TODO: Add comment(s) to github for electrode + react, about exposing 'ReactPartialRenderer' from dom to enable caching with a simple modification to the core.

  // TODO: Is it possible to refactor so the API won't break if the internal server-side render API changes? less fragile?
  // -> or, just make it part of the core and then its not a problem.
  generateTemplate(child: ReactNode, context: Object, parentNamespace: string, partialRenderer: Object): mixed {
    console.log('generating cache template');
    var html = partialRenderer.renderFullFrame(child, context, parentNamespace);
    console.log('Cached frame: ' + html);
    return { html };
  }

  render(template: mixed, child: ReactNode, context: Object, partialRenderer: Object): string {
    console.log('render using cache template: ' + template.html);
    return template.html;
  }
}

export default SimpleTemplateEngine;
