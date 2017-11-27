// @flow
import type TemplateContext from '../TemplateContext';

export interface CacheProvider {
  getTemplates(url: string, callback: (err?: any, templates?: Object) => void): void;
  setTemplates(url: string, ctx: TemplateContext, callback: (err?: any) => void): void;
}
