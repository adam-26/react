// @flow

// It plausible that this context could be used by multiple plugins
export default class TemplateContext {
  _hasNewTemplates: boolean;
  _appVersion: string;
  _templates: Object;

  constructor(appVersion: string, templates: Object = {}) {
    this._hasNewTemplates = false;
    this._appVersion = appVersion;
    this._templates = templates;
  }

  get appVersion(): Object {
    return this._appVersion;
  }

  get hasNewTemplates(): boolean {
    return this._hasNewTemplates;
  }

  get templates(): Object {
    return this._templates;
  }

  get templateKeys(): Array<string> {
    return Object.keys(this.templates);
  }

  // override the context to hash template keys or modify key output
  getTemplateKey(cacheKey: string): string {
    return `${cacheKey}:${this.appVersion}`;
  }

  getTemplate(templateKey: string): Object {
    if (typeof this.templates[templateKey] !== 'undefined') {
      return Object.assign({}, this.templates[templateKey]);
    }
  }

  addTemplate(cacheKey: string, tokens: Object, tokenizedFrame: string): Object {
    const data = this.templates[cacheKey] = { tokens, tokenizedFrame };
    if (!this._hasNewTemplates) {
      this._hasNewTemplates = true;
    }

    return Object.assign({}, data);
  }
}
