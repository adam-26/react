// @flow
import TemplateContext from './TemplateContext';
import type { CacheProvider } from './cache/CacheProvider';

type RenderApp = (err: any, templateContext: TemplateContext, done: (err?: any) => void) => void
type RenderCallback = (err: any) => void;

/**
 * Async template renderer.
 *
 * Asynchronously loads cached templates required for the requested URL before
 * rendering the application, allowing SSR plugins to take advantage of shared cache.
 */
export default class TemplateRenderer {
  appVersion: string;
  cacheProvider: any;

  constructor(appVersion: string, cacheProvider: CacheProvider): void {
    this.appVersion = appVersion;
    this.cacheProvider = cacheProvider;
  }

  createContext(appVersion: string, templates: mixed): TemplateContext {
    return new TemplateContext(appVersion, templates);
  }

  // todo; requires URLs are canonized to prevent duplicate cache entries...
  render(url: string, renderApp: RenderApp, callback?: RenderCallback = ()=>{}): void {
    this.cacheProvider.getTemplates(url, (err, templates) => {
      if (err) {
        return renderApp(err);
      }

      const ctx = this.createContext(this.appVersion, templates);
      renderApp(undefined, ctx, (err) => {
        if (err || !ctx.hasNewTemplates) {
          return callback(err);
        }

        // update cache
        this.cacheProvider.setTemplates(url, ctx, callback);
      });
    });
  }
}
