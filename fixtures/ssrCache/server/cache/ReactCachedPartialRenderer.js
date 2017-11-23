// @flow
import React from 'react';
import { ReactPartialRenderer } from 'react-dom/server';
import invariant from 'invariant';
import type {ReactElement} from 'shared/ReactElementType';



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

// function shouldConstruct(Component) {
//   return !!(Component.prototype && Component.prototype.isReactComponent);
// }

// TODO: ReactPartialPluginRenderer
class ReactPartialRendererCache extends ReactPartialRenderer {
  pluginManager: PluginManager;
  hasTemplateEngine: boolean;
  templateEngine: TemplateEngine;
  cacheProvider: TemplateCache;

  constructor(children: mixed, makeStaticMarkup: boolean, options: Object = {}) {
    super(children, makeStaticMarkup);
    this.pluginManager = new PluginManager();

    if (options.plugins && options.plugins.length) {
      options.plugins.forEach(plugin => this.pluginManager.addPlugin(plugin));
    }

    this.templateEngine = options.templateEngine;
    this.cacheProvider = options.cacheProvider;
    this.hasTemplateEngine = typeof this.templateEngine !== 'undefined';

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
      out += this.renderCurrentFrame();
    }

    return out;
  }

  // TODO *** Should ALWAYS pass the 'CachedElement()' instance to ALL 'templateEngine' methods
  renderFromCache(element: ReactElement,
                  context: Object,
                  parentNamespace: string,): string {
    var cacheKey = this.cacheProvider.getCacheKey(
      element.type,
      this.templateEngine.getTemplateKey(element.type, element.props, context, parentNamespace));

    console.log('Key: ' + cacheKey);
    var cachedFrame = this.cacheProvider.get(cacheKey);

    if (typeof cachedFrame === 'undefined') {
      console.log('Cache is EMPTY');
      // todo; need to be able to substitute child.props for rendering templates with replaceable content

      // TODO: Add TRACING
      // TODO: Ensure, if props are passed to a template, that they are RENDERED FIRST (for injection)
      // TODO: Electrode Template Engine? - branch.

      // pass the renderer instance so the templateEngine and close the templates for caching
      var generatedTemplate = this.templateEngine.generateTemplate(element, context, parentNamespace, this);

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
    const {template, previousWasTextNode, currentSelectValue} = cachedFrame;
    var out = this.templateEngine.render(template, element, context, this);
    this.currentSelectValue = currentSelectValue;
    this.previousWasTextNode = previousWasTextNode;
    return out;
  }

  // resolve(
  //   child: mixed,
  //   context: Object,
  // ): {|
  //   child: mixed,
  //   context: Object,
  // |} {
  //     // if (this.hasTemplateEngine && React.isValidElement(child) && this.templateEngine.supportsCache(child.type)) {
  //     //   return this.renderFromCache(child, context, parentNamespace);
  //     // }
  //
  //     console.log('RESOLVING...');
  //     return super.resolve(child, context);
  // }

  // render(child: ReactNode | null,
  //        context: Object,
  //        parentNamespace: string,): string {
  //
  //   // console.log(`shouldConstruct? ${child.type && shouldConstruct(child.type)}`);
  //
  //   if (this.hasTemplateEngine &&
  //     React.isValidElement(child) && // TODO: Is there a more efficient way to do this?
  //     this.templateEngine.supportsCache(child.type)) {
  //     // console.log('RENDER (CACHE): ' + child.type);
  //     return this.renderFromCache(child, context, parentNamespace);
  //   }
  //
  //   // console.log('RENDER: ' + child.type);
  //   return super.render(child, context, parentNamespace);
  // }
  //
  // renderDOM(element: ReactElement,
  //           context: Object,
  //           parentNamespace: string,): string {
  //   // console.log('renderDOM');
  //   // console.log('RENDER DOM: ' + element.type);
  //   if (this.hasTemplateEngine &&
  //     this.templateEngine.supportsCache(element.type)) {
  //     return this.renderFromCache(element, context, parentNamespace);
  //   }
  //
  //   return super.renderDOM(element, context, parentNamespace);
  // }

  // render(
  //   child: ReactNode | null,
  //   context: Object,
  //   parentNamespace: string,
  // ): string {
  //
  //   console.log(child);
  //   if (this.hasTemplateEngine &&
  //     React.isValidElement(child) && // TODO: Is there a more efficient way to do this?
  //     this.templateEngine.supportsCache(child.type)) {
  //     return this.renderFromCache(child, context, parentNamespace);
  //   }
  //
  //   return super.render(child, context, parentNamespace);
  //
  //   // // console.log('1');
  //   // // console.log(child);
  //   // // console.log('1: ' + React.isValidElement(child));
  //   // // console.log('1: ' + this.templateEngine.supportsCache(child.type));
  //   // console.log(child);
  //   // if (this.hasTemplateEngine &&
  //   //   React.isValidElement(child) && // TODO: Is there a more efficient way to do this?
  //   //   this.templateEngine.supportsCache(child.type)) {
  //   //   // console.log('2');
  //   //   var cacheKey = this.cacheProvider.getCacheKey(
  //   //     child.type,
  //   //     this.templateEngine.getTemplateKey(child.type, child.props, context, parentNamespace));
  //   //   console.log('Key: ' + cacheKey);
  //   //   var cachedFrame = this.cacheProvider.get(cacheKey);
  //   //   if (typeof cachedFrame === 'undefined') {
  //   //     // todo; need to be able to substitute child.props for rendering templates with replaceable content
  //   //
  //   //     // TODO: Add TRACING
  //   //     // TODO: Ensure, if props are passed to a template, that they are RENDERED FIRST (for injection)
  //   //     // TODO: Electrode Template Engine? - branch.
  //   //
  //   //     // pass the renderer instance so the templateEngine and close the templates for caching
  //   //     var generatedTemplate = this.templateEngine.generateTemplate(child, context, parentNamespace, this);
  //   //
  //   //     // This should be internally managed by the templateEngine
  //   //     //var html = this.renderFullFrame(child, frame); // TODO: What if PROPs need to be params for templating?
  //   //
  //   //     // ie; for THIS component accept props, but render its internal children as is?
  //   //     // - initially: support caching of components ONLY without '.children' prop
  //   //     // - configure replacement of (some) PROP(s), via template strings
  //   //     // ensure the design allows use of templates with children, by assigning closing tag(s) in output to FRAME?
  //   //     // todo - this would require a FRAME be stored in the cache...
  //   //     cachedFrame = {
  //   //       template: generatedTemplate,
  //   //       previousWasTextNode: this.previousWasTextNode,
  //   //       currentSelectValue: this.currentSelectValue,
  //   //     };
  //   //     this.cacheProvider.set(cacheKey, cachedFrame);
  //   //   }
  //   //
  //   //   // NOTE: if required, this should allow templateEngines to CACHE full FRAMES and
  //   //   //       render the entire frame during render
  //   //   const { template, previousWasTextNode, currentSelectValue } = cachedFrame;
  //   //   var out = this.templateEngine.render(template, child, context, this);
  //   //   this.currentSelectValue = currentSelectValue;
  //   //   this.previousWasTextNode = previousWasTextNode;
  //   //   return out;
  //   // }
  //   //
  //   // // console.log('9');
  //   // return super.render(child, context, parentNamespace);
  //}

  read(bytes: number): string | null {
    // console.log('===== READ: start =====');
    const start = process.hrtime();
    const out = super.read(bytes);
    const end = process.hrtime(start);
    const nanoseconds = (end[0] * 1e9) + end[1];
    const milliseconds = nanoseconds / 1e6;
    console.log(`[ReactPartialFrameRenderer.read: ${milliseconds}ms]`);
    return out;
  }

  // TODO: *** Implement for improved cache support - need to fix broken tests on original code first (re-implement?)
  resolveElement(element: mixed,
                 context: Object,): {|
    nextChild: mixed,
    nextContext: Object,
  |} {
    const pluginNames = this.pluginManager.getFrameBoundaryPlugins(element.type, element.props, context);
    if (pluginNames.length) {
      if (this.isCacheBoundaryFrame !== true) {
        return {nextChild: new FrameBoundary(element, pluginNames), nextContext: context};
      }

      // RESET FLAG
      this.isCacheBoundaryFrame = false;
    }

    return super.resolveElement(element, context);

    // // if the ELEMENT supports cache (use templateEngine to determine if it does support cache)
    // // -> return a 'new CachedElement(element)', where 'element' is assigned to 'props.children' for frame render
    // // console.log('resolveElement');
    //
    // // todo; improve - cacheProvider should not be responsible for determining if cache is active.
    // if (typeof this.cacheProvider !== 'undefined' && typeof element.type.getCacheKey === 'function') { // todo; update to use .(cache/)templateEngine()
    //
    //   // console.log('resolveElement: FrameBoundary');
    //
    //   // TODO: *** Use an instance FLAG to determine if an 'FrameBoundary' frame is being resolved?
    //   // - if it is, reset the flag THEN resolve the element
    //   if (this.isCacheBoundaryFrame !== true) {
    //     return {nextChild: new FrameBoundary(element), nextContext: context};
    //   }
    //
    //   // RESET FLAG
    //   this.isCacheBoundaryFrame = false;
    //
    //
    //   // TODO: This is recursive... after an element is resolved, how to inject the cacheBoundary and ensure the element is not resolved again?
    //   // need to be able to determine IF the 'FrameBoundary' is a PARENT/WRAPPER of the 'element'? use frame?
    //
    // }
    // // * If its PREVIOUSLY cached... return 'cache_frame' and that frame should then load from cache using 'renderComponent'
    // // call super.resolveElement() otherwise...
    // return super.resolveElement(element, context);
  }

  // TODO: Where is the CACHED CONTENT actually (re-)rendered?

  // type SetFrameState = (previousWasTextNode: boolean, currentSelectValue: any) => void;
  setFrameState(previousWasTextNode: boolean, currentSelectValue: any): void {
    this.previousWasTextNode = previousWasTextNode;
    this.currentSelectValue = currentSelectValue;
  }

  // override...
  // renderFrame(frame: Frame): string {-> determine if FRAME is a CACHE frame and render the entire thing?
  // - should NOT force an entire frame to be rendered... if possible.
  // renderFrameChild()?
  renderFrame(frame: Frame): string {
    // console.log('renderFrame');
    if (frame.childIndex === 0 && (frame.children instanceof FrameBoundary)) {
      // render the ENTIRE frame

      // todo.. may not be required...
      this.stack.pop(); // remove the cacheBoundaryFrame from the stack...

      // type RenderFrame = (element: ReactNode, context: Object, domNamespace: string) => string;

      const cacheFrameIdx = this.stack.length;
      const renderFullFrame = (element: ReactNode, context: Object, domNamespace: string) => {
        let out = '';
        this.isCacheBoundaryFrame = true;

        const replaceFrame = this.createFrame(domNamespace, React.Children.toArray(element), context);
        // todo; dev only..
        replaceFrame.debugElementStack = frame.debugElementStack;

        out += super.renderFrame(replaceFrame);
        // console.log('next: ' + out);
        while (this.stack.length > cacheFrameIdx) {
          out += this.renderCurrentFrame();
          // console.log('next: ' + out);
        }

        return {
          html: out,
          previousWasTextNode: this.previousWasTextNode,
          currentSelectValue: this.currentSelectValue
        };
      };

      const { pluginNames, element } = frame.children;
      return this.pluginManager.renderFrameBoundary(pluginNames, element, frame, renderFullFrame, this.setFrameState);
    }

    return super.renderFrame(frame);

//     // ======================================================================================================
//     // ======================================================================================================
//       // console.log('renderFrame: FrameBoundary -> ');
//       // console.log(frame.children);
// // return;
//       var element = frame.children.child; // todo ?
//       var cacheKey = this.cacheProvider.getCacheKey(
//         element.type,
//         this.templateEngine.getTemplateKey(element.type, element.props, frame.context, frame.domNamespace));
//
//       // console.log('Key: ' + cacheKey);
//       var cachedFrame = this.cacheProvider.get(cacheKey);
//       if (typeof cachedFrame === 'undefined') {
//         // - if its not previously cached, generate the cache template (add Frame with CHILDREN and render ALL of those frames)
//         let out = '';
//         const cacheFrameIdx = this.stack.length; // todo; use templateEngine, need to substitute props etc..
//
//         // TODO: This plugin model should suffice...
//         // middleware? template, cache, etc..?
//         // .getPluginName();
//         // .isFrameBoundary(element.type, element.props, context) ?? How to indicate TYPE(s) of frame boundaries? -> add state to 'FrameBoundary' class...
//         // .renderFrameBoundary(frame.children.child, frame.context, frame.domNamespace, renderFrame)
//         // -> for 'render', NEXT() should render the complete frame, pass ARGS to next in-case they need to be modified
//         // -> use 'return next();' ??? todo; FrameBoundaryPlugin(s)??? ie: cache, template, ???
//
//         // if it IS this approach - create a 'replaceFrame' method? may not even need to pop/push to do that.
//         const replaceFrame = this.createFrame(frame.domNamespace, React.Children.toArray(frame.children.child), frame.context);
//         // this.appendFrame(frame.domNamespace, React.Children.toArray(frame.children.child), frame.context);
//
//         // TODO: Look @ *** renderFullFrame() *** above.
//         // TODO: May be able to code it so that content is cached AFTER the stack/frame has completed rendering
//         // TODO  -> instead of forcing the render of entire frame(s), when generating cached data?
//         // TODO     ** If this is the case, can the 'cacheBoundary' be avoided entirely? instead add a flag to the frame? or WRAP it in an override that acts AFTER the output is returned?
//         // TODO: the TEMPLATE_ENGINE should be OPTIONAL - and used to optimize rendering instead of ONLY for cache...
//
//         // TODO: How to RENDER... all frames contained within the CACHE FRAME???
//         // TODO: Add more logging, remove the loop to determine whats wrong...
//         replaceFrame.debugElementStack = frame.debugElementStack;
//
//         // this.appendFrame(replaceFrame); // todo; need to REPLACE in DEV-stack also/...
//
//
//         // var child = frame.children[frame.childIndex++];
//         // out += this.renderFrameChild(child, frame);
//
//         // TODO:
//         // + TemplateEngine: converts component(s) into (string?) templates to reduce rendering time
//         // + CacheProvider: caches the output of component(s), uses the templateEngine if it exists
//         // ? todo -> ensure PROPs CAN be rendered for injecting into template(s), would be best if this was done via a COMPONENT and NOT this renderer... if possible?
//
//         this.isCacheBoundaryFrame = true;
//         out += super.renderFrame(replaceFrame); // todo... should it be RENDER instead of 'renderFrame' ???
//         // console.log('next: ' + out);
//
//         while (this.stack.length > cacheFrameIdx) {
//           out += this.renderCurrentFrame();
//           // console.log('next: ' + out);
//         }
//         // write to cache
//         // console.log('write to cache: ' + out);
//         this.cacheProvider.set(cacheKey, {
//           template: out, // todo; change param name - support CACHE and TEMPLATE(S)
//           previousWasTextNode: this.previousWasTextNode,
//           currentSelectValue: this.currentSelectValue,
//         }); // todo; add OTHER PARAMETERS HERE
//
//         return out;
//       }
//
//       // else {
//       //   console.log('loaded cache: ' + cachedFrame.template);
//       // }
//
//       const { template, previousWasTextNode, currentSelectValue } = cachedFrame;
//       this.previousWasTextNode = previousWasTextNode;
//       this.currentSelectValue = currentSelectValue;
//       return template; // todo; process using templateEngine...
//     }
//
//     return super.renderFrame(frame);
//   // ======================================================================================================
//   // ======================================================================================================
  }

  renderComponent(nextChild: ReactNode | null,
                  context: Object,
                  parentNamespace: string,): string {

    if (nextChild instanceof FrameBoundary) {
      // A frame boundary requires its own frame
      this.appendFrame(this.createFrame(parentNamespace, nextChild, context));
      return '';
    }

    return super.renderComponent(nextChild, context, parentNamespace);

    //
    // // IF the 'nextChild' IS a 'CachedElement' -> insert a 'cache' frame (Very similar to REACT_FRAGMENT_TYPE)
    // // - if previously cached; return the resolved template string here
    // // console.log('renderComponent');
    //
    // if (nextChild instanceof FrameBoundary) {
    //
    //   // console.log('renderComponent: FrameBoundary');
    //
    //   // todo -> insert CACHE_FRAME HERE... this IS REQUIRED - 1 x frame per CACHE(D) component instance
    //   // const nextChildren = toArray(
    //   //   ((nextChild: any): ReactElement).props.children,
    //   // );
    //
    //   // const frame: Frame = {
    //   //   domNamespace: parentNamespace,
    //   //   children: nextChild, // todo; set this to be the 'cachedElement'??? only on the boundary?
    //   //   childIndex: 0,
    //   //   context: context,
    //   //   footer: '',
    //   //   // isCacheBoundary: true
    //   // };
    //   // if (__DEV__) {
    //   //   ((frame: any): FrameDev).debugElementStack = [];
    //   // }
    //   // this.stack.push(frame);
    //   this.appendFrame(this.createFrame(parentNamespace, nextChild, context));
    //   return '';
    //
    //   //   // todo ??? returnThis? must use the templateEngine to determine WHAT to render (ie: self, child, etc...)
    //   //   this.renderFromCache(nextChild, context, parentNamespace);
    //   //
    //   //   // has it been previously cached?
    //   //   const cacheKey = nextChild.getKey(context); // todo; add 'util' method to 'CachedElement', simplify using templateEngine
    //   //   if (!isCached(cacheKey)) {
    //   //     // render using templateEngine - todo; replace props, etc... using the engine
    //   //     const template = super.renderComponent(nextChild, context, parentNamespace);
    //   //     // todo; set in cache
    //   //   }
    //   //
    //   //   return ; // todo; process the template using the props/context and return the result.
    //   // }
    //   //
    //   // return super.renderComponent(nextChild, context, parentNamespace);
    // }
    //
    // return super.renderComponent(nextChild, context, parentNamespace);
    //
    // // use 'renderFrame*' methods to assist generating required cached content.
  }

  createFrame(parentNamespace: string, children: mixed, context: mixed, footer?:string = ''): Frame {
    const frame = {
      domNamespace: parentNamespace,
      children: children, // todo; set this to be the 'cachedElement'??? only on the boundary?
      childIndex: 0,
      context: context,
      footer: footer
    };

    // TODO: if (__DEV__) {...
    ((frame: any): FrameDev).debugElementStack = [];

    return frame;
  }

  appendFrame(frame: Frame): void {
    // const frame: Frame = {
    //   domNamespace: parentNamespace,
    //   children: children, // todo; set this to be the 'cachedElement'??? only on the boundary?
    //   childIndex: 0,
    //   context: context,
    //   footer: footer
    // };
    // if (__DEV__) { // TODO: Create in base to accomodate this...
    // ((frame: any): FrameDev).debugElementStack = [];
    // }
    this.stack.push(frame);
  }
}

// TODO: Rename -> 'FrameBoundary'
class FrameBoundary {
  _child: any;
  _pluginNames: Array<string>;

  constructor(element: mixed, pluginNames?: Array<string> = []) {
    this._child = element;
    this._pluginNames = pluginNames;
  }

  get element(): any {
    return this._child;
  }

  get pluginNames(): Array<string> {
    return this._pluginNames;
  }

  addPlugin(pluginName: string): void {
    this._pluginNames.push(pluginName);
  }

  // todo; remove this
  get child(): any {
    return this._child;
  }

}

class PluginManager {
  _plugins: Array<FrameBoundaryPlugin>;

  constructor() {
    this._plugins = {};
    this._pluginNames = [];
  }

  get hasPlugins(): boolean {
    return this._pluginNames.length !== 0;
  }

  addPlugin(plugin: FrameBoundaryPlugin): void {
    this._plugins[plugin.getPluginName()] = plugin;
    this._pluginNames.push(plugin.getPluginName());
  }

  getFrameBoundaryPlugins(component: mixed, props: Object, context: Object): Array<string> {
    const boundaryPlugins = [];
    for (let i = 0, len = this._pluginNames.length; i < len; i++) {
      const pluginName = this._pluginNames[i];
      if (this._plugins[pluginName].isFrameBoundary(component, props, context)) {
        boundaryPlugins.push(pluginName);
      }
    }

    return boundaryPlugins;
  }

  renderFrameBoundary(pluginNames: Array<string>, element: ReactNode, frame: Frame, renderFrame: RenderFrame): string {
    if (!this.hasPlugins || pluginNames.length === 0) {
      // render the original frame
      return renderFrame(frame);
    }

    // render the frame - allow ordered plugins rendering preference
    const remainingPlugins = pluginNames.slice();
    const renderFrameWithPlugin = (element: ReactNode, context: Object, domNamespace: string) => {
      const nextPlugin = remainingPlugins.shift();
      return this._plugins[nextPlugin].renderFrameBoundary(element, context, domNamespace, remainingPlugins.length ? renderFrameWithPlugin : renderFrame);
    };

    return renderFrameWithPlugin(element, frame.context, frame.domNamespace);
  }
}



export default ReactPartialRendererCache;

// .isFrameBoundary(element.type, element.props, context) ?? How to indicate TYPE(s) of frame boundaries? -> add state to 'FrameBoundary' class...
// .renderFrameBoundary(frame.children.child, frame.context, frame.domNamespace, renderFrame)
// -> for 'render', NEXT() should render the complete frame, pass ARGS to next in-case they need to be modified
// -> use 'return next();' ??? todo; FrameBoundaryPlugin(s)??? ie: cache, template, ???

//       var cacheKey = this.cacheProvider.getCacheKey(
//         element.type,
//         this.templateEngine.getTemplateKey(element.type, element.props, frame.context, frame.domNamespace));
//
//       // console.log('Key: ' + cacheKey);
//       var cachedFrame = this.cacheProvider.get(cacheKey);
//       if (typeof cachedFrame === 'undefined') {
//         // - if its not previously cached, generate the cache template (add Frame with CHILDREN and render ALL of those frames)
//         let out = '';
//         const cacheFrameIdx = this.stack.length; // todo; use templateEngine, need to substitute props etc..
//
//         // TODO: This plugin model should suffice...
//         // middleware? template, cache, etc..?
//         // .getPluginName();
//         // .isFrameBoundary(element.type, element.props, context) ?? How to indicate TYPE(s) of frame boundaries? -> add state to 'FrameBoundary' class...
//         // .renderFrameBoundary(frame.children.child, frame.context, frame.domNamespace, renderFrame)
//         // -> for 'render', NEXT() should render the complete frame, pass ARGS to next in-case they need to be modified
//         // -> use 'return next();' ??? todo; FrameBoundaryPlugin(s)??? ie: cache, template, ???
//
//         // if it IS this approach - create a 'replaceFrame' method? may not even need to pop/push to do that.
//         const replaceFrame = this.createFrame(frame.domNamespace, React.Children.toArray(frame.children.child), frame.context);
//         // this.appendFrame(frame.domNamespace, React.Children.toArray(frame.children.child), frame.context);
//
//         // TODO: Look @ *** renderFullFrame() *** above.
//         // TODO: May be able to code it so that content is cached AFTER the stack/frame has completed rendering
//         // TODO  -> instead of forcing the render of entire frame(s), when generating cached data?
//         // TODO     ** If this is the case, can the 'cacheBoundary' be avoided entirely? instead add a flag to the frame? or WRAP it in an override that acts AFTER the output is returned?
//         // TODO: the TEMPLATE_ENGINE should be OPTIONAL - and used to optimize rendering instead of ONLY for cache...
//
//         // TODO: How to RENDER... all frames contained within the CACHE FRAME???
//         // TODO: Add more logging, remove the loop to determine whats wrong...
//         replaceFrame.debugElementStack = frame.debugElementStack;
//
//         // this.appendFrame(replaceFrame); // todo; need to REPLACE in DEV-stack also/...
//
//
//         // var child = frame.children[frame.childIndex++];
//         // out += this.renderFrameChild(child, frame);
//
//         // TODO:
//         // + TemplateEngine: converts component(s) into (string?) templates to reduce rendering time
//         // + CacheProvider: caches the output of component(s), uses the templateEngine if it exists
//         // ? todo -> ensure PROPs CAN be rendered for injecting into template(s), would be best if this was done via a COMPONENT and NOT this renderer... if possible?
//
//         this.isCacheBoundaryFrame = true;
//         out += super.renderFrame(replaceFrame); // todo... should it be RENDER instead of 'renderFrame' ???
//         // console.log('next: ' + out);
//
//         while (this.stack.length > cacheFrameIdx) {
//           out += this.renderCurrentFrame();
//           // console.log('next: ' + out);
//         }
//         // write to cache
//         // console.log('write to cache: ' + out);
//         this.cacheProvider.set(cacheKey, {
//           template: out, // todo; change param name - support CACHE and TEMPLATE(S)
//           previousWasTextNode: this.previousWasTextNode,
//           currentSelectValue: this.currentSelectValue,
//         }); // todo; add OTHER PARAMETERS HERE
//
//         return out;
//       }
//
//       // else {
//       //   console.log('loaded cache: ' + cachedFrame.template);
//       // }
//
//       const { template, previousWasTextNode, currentSelectValue } = cachedFrame;
//       this.previousWasTextNode = previousWasTextNode;
//       this.currentSelectValue = currentSelectValue;
//       return template; // todo; process using templateEngine...
//     }
//
