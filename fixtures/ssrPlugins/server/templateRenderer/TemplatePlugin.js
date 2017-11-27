// @flow
import RendererPlugin from '../pluginRenderer/RendererPlugin';
import type TemplateContext from './TemplateContext';

export default class TemplatePlugin extends RendererPlugin {
  _ctx: TemplateContext;

  constructor(pluginName: string, templateContext: TemplateContext): void {
    super(pluginName);
    this._ctx = templateContext;
  }

  /**
   * Get the template context.
   * @returns {TemplateContext}
   */
  get ctx(): TemplateContext {
    return this._ctx;
  }

  /**
   * Get the template key.
   */
  getTemplateKey(cacheKey: string): string {
    return this.ctx.getTemplateKey(`${cacheKey}:${this.pluginName}`);
  }

  /**
   * Get a template from the context.
   * @param templateKey
   * @returns {Object}
   */
  getTemplate(templateKey: string): Object {
    return this.ctx.getTemplate(templateKey);
  }

  /**
   * Add a template to the context.
   * @param cacheKey
   * @param tokens
   * @param tokenizedFrame
   * @returns {Object}
   */
  addTemplate(cacheKey: string, tokens: Object, tokenizedFrame: string): Object {
    return this.ctx.addTemplate(cacheKey, tokens, tokenizedFrame);
  }

  logCacheMiss(key: string): void {
    // TODO: Add stats collection, etc..
    this.log(`Cache miss: ${key}`);
  }

  logCacheHit(key: string): void {
    // TODO: Add stats collection, etc..
    this.log(`Cache hit: ${key}`);
  }
}
