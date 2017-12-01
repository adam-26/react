/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {ReactElement} from 'shared/ReactElementType';

import React from 'react';
import emptyFunction from 'fbjs/lib/emptyFunction';
import emptyObject from 'fbjs/lib/emptyObject';
import hyphenateStyleName from 'fbjs/lib/hyphenateStyleName';
import invariant from 'fbjs/lib/invariant';
import memoizeStringOnly from 'fbjs/lib/memoizeStringOnly';
import warning from 'fbjs/lib/warning';
import checkPropTypes from 'prop-types/checkPropTypes';
import describeComponentFrame from 'shared/describeComponentFrame';
import {ReactDebugCurrentFrame} from 'shared/ReactGlobalSharedState';

import {
  createMarkupForCustomAttribute,
  createMarkupForProperty,
  createMarkupForRoot,
} from './DOMMarkupOperations';
import {
  Namespaces,
  getIntrinsicNamespace,
  getChildNamespace,
} from '../shared/DOMNamespaces';
import ReactControlledValuePropTypes from '../shared/ReactControlledValuePropTypes';
import assertValidProps from '../shared/assertValidProps';
import dangerousStyleValue from '../shared/dangerousStyleValue';
import escapeTextContentForBrowser from '../shared/escapeTextContentForBrowser';
import isCustomComponent from '../shared/isCustomComponent';
import omittedCloseTags from '../shared/omittedCloseTags';
import warnValidStyle from '../shared/warnValidStyle';
import {validateProperties as validateARIAProperties} from '../shared/ReactDOMInvalidARIAHook';
import {validateProperties as validateInputProperties} from '../shared/ReactDOMNullInputValuePropHook';
import {validateProperties as validateUnknownProperties} from '../shared/ReactDOMUnknownPropertyHook';

var REACT_FRAGMENT_TYPE =
  (typeof Symbol === 'function' &&
    Symbol.for &&
    Symbol.for('react.fragment')) ||
  0xeacb;

// Based on reading the React.Children implementation. TODO: type this somewhere?
type ReactNode = string | number | ReactElement;
type FlatReactChildren = Array<null | ReactNode>;
type toArrayType = (children: mixed) => FlatReactChildren;
var toArray = ((React.Children.toArray: any): toArrayType);

var getStackAddendum = emptyFunction.thatReturns('');

if (__DEV__) {
  var validatePropertiesInDevelopment = function(type, props) {
    validateARIAProperties(type, props);
    validateInputProperties(type, props);
    validateUnknownProperties(type, props);
  };

  var describeStackFrame = function(element): string {
    var source = element._source;
    var type = element.type;
    var name = getComponentName(type);
    var ownerName = null;
    return describeComponentFrame(name, source, ownerName);
  };

  var currentDebugStack = null;
  var currentDebugElementStack = null;
  var setCurrentDebugStack = function(stack: Array<Frame>) {
    var frame: Frame = stack[stack.length - 1];
    currentDebugElementStack = ((frame: any): FrameDev).debugElementStack;
    // We are about to enter a new composite stack, reset the array.
    currentDebugElementStack.length = 0;
    currentDebugStack = stack;
    ReactDebugCurrentFrame.getCurrentStack = getStackAddendum;
  };
  var pushElementToDebugStack = function(element: ReactElement) {
    if (currentDebugElementStack !== null) {
      currentDebugElementStack.push(element);
    }
  };
  var resetCurrentDebugStack = function() {
    currentDebugElementStack = null;
    currentDebugStack = null;
    ReactDebugCurrentFrame.getCurrentStack = null;
  };
  getStackAddendum = function(): null | string {
    if (currentDebugStack === null) {
      return '';
    }
    let stack = '';
    let debugStack = currentDebugStack;
    for (let i = debugStack.length - 1; i >= 0; i--) {
      const frame: Frame = debugStack[i];
      let debugElementStack = ((frame: any): FrameDev).debugElementStack;
      for (let ii = debugElementStack.length - 1; ii >= 0; ii--) {
        stack += describeStackFrame(debugElementStack[ii]);
      }
    }
    return stack;
  };
}

var didWarnDefaultInputValue = false;
var didWarnDefaultChecked = false;
var didWarnDefaultSelectValue = false;
var didWarnDefaultTextareaValue = false;
var didWarnInvalidOptionChildren = false;
var didWarnAboutNoopUpdateForComponent = {};
var valuePropNames = ['value', 'defaultValue'];
var newlineEatingTags = {
  listing: true,
  pre: true,
  textarea: true,
};

function getComponentName(type) {
  return typeof type === 'string'
    ? type
    : typeof type === 'function' ? type.displayName || type.name : null;
}

// We accept any tag to be rendered but since this gets injected into arbitrary
// HTML, we want to make sure that it's a safe tag.
// http://www.w3.org/TR/REC-xml/#NT-Name
var VALID_TAG_REGEX = /^[a-zA-Z][a-zA-Z:_\.\-\d]*$/; // Simplified subset
var validatedTagCache = {};
function validateDangerousTag(tag) {
  if (!validatedTagCache.hasOwnProperty(tag)) {
    invariant(VALID_TAG_REGEX.test(tag), 'Invalid tag: %s', tag);
    validatedTagCache[tag] = true;
  }
}

var processStyleName = memoizeStringOnly(function(styleName) {
  return hyphenateStyleName(styleName);
});

function createMarkupForStyles(styles): string | null {
  var serialized = '';
  var delimiter = '';
  for (var styleName in styles) {
    if (!styles.hasOwnProperty(styleName)) {
      continue;
    }
    var isCustomProperty = styleName.indexOf('--') === 0;
    var styleValue = styles[styleName];
    if (__DEV__) {
      if (!isCustomProperty) {
        warnValidStyle(styleName, styleValue, getStackAddendum);
      }
    }
    if (styleValue != null) {
      serialized += delimiter + processStyleName(styleName) + ':';
      serialized += dangerousStyleValue(
        styleName,
        styleValue,
        isCustomProperty,
      );

      delimiter = ';';
    }
  }
  return serialized || null;
}

function warnNoop(
  publicInstance: React$Component<any, any>,
  callerName: string,
) {
  if (__DEV__) {
    var constructor = publicInstance.constructor;
    const componentName =
      (constructor && getComponentName(constructor)) || 'ReactClass';
    const warningKey = `${componentName}.${callerName}`;
    if (didWarnAboutNoopUpdateForComponent[warningKey]) {
      return;
    }

    warning(
      false,
      '%s(...): Can only update a mounting component. ' +
        'This usually means you called %s() outside componentWillMount() on the server. ' +
        'This is a no-op.\n\nPlease check the code for the %s component.',
      callerName,
      callerName,
      componentName,
    );
    didWarnAboutNoopUpdateForComponent[warningKey] = true;
  }
}

function shouldConstruct(Component) {
  return Component.prototype && Component.prototype.isReactComponent;
}

function getNonChildrenInnerMarkup(props) {
  var innerHTML = props.dangerouslySetInnerHTML;
  if (innerHTML != null) {
    if (innerHTML.__html != null) {
      return innerHTML.__html;
    }
  } else {
    var content = props.children;
    if (typeof content === 'string' || typeof content === 'number') {
      return escapeTextContentForBrowser(content);
    }
  }
  return null;
}

function flattenTopLevelChildren(children: mixed): FlatReactChildren {
  if (!React.isValidElement(children)) {
    return toArray(children);
  }
  const element = ((children: any): ReactElement);
  if (element.type !== REACT_FRAGMENT_TYPE) {
    return [element];
  }
  const fragmentChildren = element.props.children;
  if (!React.isValidElement(fragmentChildren)) {
    return toArray(fragmentChildren);
  }
  const fragmentChildElement = ((fragmentChildren: any): ReactElement);
  return [fragmentChildElement];
}

function flattenOptionChildren(children: mixed): string {
  var content = '';
  // Flatten children and warn if they aren't strings or numbers;
  // invalid types are ignored.
  React.Children.forEach(children, function(child) {
    if (child == null) {
      return;
    }
    if (typeof child === 'string' || typeof child === 'number') {
      content += child;
    } else {
      if (__DEV__) {
        if (!didWarnInvalidOptionChildren) {
          didWarnInvalidOptionChildren = true;
          warning(
            false,
            'Only strings and numbers are supported as <option> children.',
          );
        }
      }
    }
  });
  return content;
}

function maskContext(type, context) {
  var contextTypes = type.contextTypes;
  if (!contextTypes) {
    return emptyObject;
  }
  var maskedContext = {};
  for (var contextName in contextTypes) {
    maskedContext[contextName] = context[contextName];
  }
  return maskedContext;
}

function checkContextTypes(typeSpecs, values, location: string) {
  if (__DEV__) {
    checkPropTypes(typeSpecs, values, location, 'Component', getStackAddendum);
  }
}

function processContext(type, context) {
  var maskedContext = maskContext(type, context);
  if (__DEV__) {
    if (type.contextTypes) {
      checkContextTypes(type.contextTypes, maskedContext, 'context');
    }
  }
  return maskedContext;
}

var STYLE = 'style';
var RESERVED_PROPS = {
  children: null,
  dangerouslySetInnerHTML: null,
  suppressContentEditableWarning: null,
  suppressHydrationWarning: null,
};

function createOpenTagMarkup(
  tagVerbatim: string,
  tagLowercase: string,
  props: Object,
  namespace: string,
  makeStaticMarkup: boolean,
  isRootElement: boolean,
): string {
  var ret = '<' + tagVerbatim;

  for (var propKey in props) {
    if (!props.hasOwnProperty(propKey)) {
      continue;
    }
    var propValue = props[propKey];
    if (propValue == null) {
      continue;
    }
    if (propKey === STYLE) {
      propValue = createMarkupForStyles(propValue);
    }
    var markup = null;
    if (isCustomComponent(tagLowercase, props)) {
      if (!RESERVED_PROPS.hasOwnProperty(propKey)) {
        markup = createMarkupForCustomAttribute(propKey, propValue);
      }
    } else {
      markup = createMarkupForProperty(propKey, propValue);
    }
    if (markup) {
      ret += ' ' + markup;
    }
  }

  // For static pages, no need to put React ID and checksum. Saves lots of
  // bytes.
  if (makeStaticMarkup) {
    return ret;
  }

  if (isRootElement) {
    ret += ' ' + createMarkupForRoot();
  }
  return ret;
}

function validateRenderResult(child, type) {
  if (child === undefined) {
    invariant(
      false,
      '%s(...): Nothing was returned from render. This usually means a ' +
        'return statement is missing. Or, to render nothing, ' +
        'return null.',
      getComponentName(type) || 'Component',
    );
  }
}

class CacheElement {
  cacheState: mixed;
  children: mixed;

  constructor(cacheState: mixed, children: mixed) {
    this.cacheState = cacheState;
    this.children = children;
  }
}

type CacheRenderUtils = {

  /**
   * Renders the current frame and all its children, allowing props to be overridden.
   *
   * @param props
   * @param context
   * @returns {string}
   */
  renderCurrentElement: (props?: Object, context?: Object) => string,

  /**
   * Renders the provided element and all its children.
   *
   * @param element
   * @param context
   * @param domNamespace
   * @returns {string}
   */
  renderElement: (element: ReactElement, context?: Object, domNamespace?: string) => string,

  /**
   * Logs a warning if the base context is modified during the provided render function.
   *
   * NOTE: This only logs warning messages in development.
   *
   * @param baseContext
   * @param render
   * @param [messageSuffix] {string} the message to log
   * @returns {string} the render output
   */
  warnIfRenderModifiesContext: (baseContext: Object, render: () => string, messageSuffix?: string) => string,
};

interface CacheStrategy {

  /**
   * Gets the cache strategy state for a component.
   *
   * @param component
   * @param props
   * @param context
   * @returns {*} if undefined is returned, the cache strategy render method will not be invoked for this component.
   */
  getCacheState(component: ReactNode, props: Object, context: Object): any,

  /**
   * Renders an element using a cache strategy.
   *
   * @param element to render
   * @param context to use for rendering
   * @param cacheState the state returned by the getCacheState() method
   * @param renderUtils to simplify rendering of cached component
   * @returns {string} the rendered component
   */
  render(element: ReactElement, context: Object, cacheState: mixed, renderUtils: CacheRenderUtils): string,
}

type Frame = {
  domNamespace: string,
  children: FlatReactChildren,
  childIndex: number,
  context: Object,
  footer: string,
  // TODO: === START: Cache Hook ===
  cacheState: any
  // TODO: === END: Cache Hook ===
};

type FrameDev = Frame & {
  debugElementStack: Array<ReactElement>,
};

const noopRenderStats = {
  start: (): any => {},
  end: (state: any): void => {},
};

function hasContextChanged(baseContext: Object, currentContext: Object): boolean {
  const previousKeys = Object.keys(baseContext);
  const currentKeys = Object.keys(currentContext);
  if (previousKeys.length !== currentKeys.length) {
    return true;
  }

  for (let i = 0, len = previousKeys.length; i < len; i++) {
    if (currentKeys.indexOf(previousKeys[i]) === -1) {
      return true;
    }
  }

  for (let i = 0, len = previousKeys.length; i < len; i++) {
    const key = previousKeys[i];
    if (baseContext[key] !== currentContext[key]) {
      return true;
    }
  }

  return false;
}

class ReactDOMServerRenderer {
  stack: Array<Frame>;
  exhausted: boolean;
  // TODO: type this more strictly:
  currentSelectValue: any;
  previousWasTextNode: boolean;
  makeStaticMarkup: boolean;

  // TODO: === START: Cache Hook ===
  cacheStrategy: CacheStrategy;
  hasCacheStrategy: boolean;
  useCacheStrategy: boolean;
  cacheFrameCounter: number;
  warnIfRenderModifiesContext: (render: () => string, messageSuffix?: string) => string;
  // TODO: === END: Cache Hook ===

  static createFrame(domNamespace: string, children: mixed, context: Object, footer?: string = ''): Frame {
    const frame: Frame = {
      domNamespace: domNamespace,
      children: children,
      childIndex: 0,
      context: context,
      footer: footer,
    };
    if (__DEV__) {
      ((frame: any): FrameDev).debugElementStack = [];
    }
    return frame;
  }

  constructor(children: mixed, options: Object = {}) {
    const flatChildren = flattenTopLevelChildren(children);
    const { makeStaticMarkup, cacheStrategy, renderStats } = Object.assign({
      makeStaticMarkup: false,
      cacheStrategy: null,
      renderStats: noopRenderStats,
    }, options);

    // Assume all trees start in the HTML namespace (not totally true, but
    // this is what we did historically)
    this.stack = [ReactDOMServerRenderer.createFrame(Namespaces.html, flatChildren, emptyObject)];
    this.exhausted = false;
    this.currentSelectValue = null;
    this.previousWasTextNode = false;
    this.makeStaticMarkup = makeStaticMarkup;
    this.cacheStrategy = cacheStrategy;
    this.hasCacheStrategy = this.useCacheStrategy = cacheStrategy !== null;
    this.cacheFrameCounter = 0;
    this.warnIfRenderModifiesContext = null;
    this.renderStats = renderStats;

    if (__DEV__) {
      if (this.hasCacheStrategy) {
        invariant(
          typeof cacheStrategy.getCacheState === 'function',
          "cacheStrategy does not implement 'getCacheState' function.");
        invariant(
          typeof cacheStrategy.render === 'function',
          "cacheStrategy does not implement 'render' function.");
      }
    }

    this.getRendererState = this.getRendererState.bind(this);
    this.setRendererState = this.setRendererState.bind(this);
  }

  renderCurrentFrame(): string {
    var frameIdx = this.stack.length - 1;
    var frame: Frame = this.stack[frameIdx];
    return this.renderFrame(frame, frameIdx);
  }

  renderClosedFrame(frameIdx: number) {
    let out = '';
    while (this.stack.length > frameIdx) {
      out += this.renderCurrentFrame();
    }

    return out;
  }

  getRendererState(): Object {
    return {
      previousWasTextNode: this.previousWasTextNode,
      currentSelectValue: this.currentSelectValue,
    };
  }

  setRendererState(frameState: Object): void {
    const { previousWasTextNode, currentSelectValue } = frameState;
    this.previousWasTextNode = previousWasTextNode;
    this.currentSelectValue = currentSelectValue;
  }

  appendFrame(frame: Frame): void {
    this.stack.push(frame);

    if (__DEV__) {
      if (typeof this.warnIfRenderModifiesContext === 'function') {
        this.warnIfRenderModifiesContext(frame.context);
      }
    }
  }

  renderFrame(frame: Frame, frameIdx: number): string {
    if (frame.childIndex >= frame.children.length) {
      var footer = frame.footer;
      if (footer !== '') {
        this.previousWasTextNode = false;
      }
      this.stack.pop();
      if (frame.tag === 'select') {
        this.currentSelectValue = null;
      }
      // TODO: === START: Cache Hook ===
      if (typeof frame.cacheState !== 'undefined') {
        this.cacheFrameCounter--;
      }
      // TODO: === END: Cache Hook ===
      return footer;
    }
    var child = frame.children[frame.childIndex++];
    // TODO: === START: Cache Hook ===
    if (frame.childIndex === 1 && typeof frame.cacheState !== 'undefined') {
      return this.cacheStrategy.render(child, frame.context, frame.cacheState, {
        getRendererState: this.getRendererState,
        setRendererState: this.setRendererState,

        /**
         * Renders the current frame and all its children, allowing props to be overridden.
         *
         * @param props
         * @param context
         * @returns {string}
         */
        renderCurrentElement: (props?: Object = child.props, context?: Object = frame.context) => {
          // flag to prevent recursive resolver
          this.useCacheStrategy = false;

          var out = this.renderFrameChild(Object.assign({}, child, {props}), { ...frame, context });
          out += this.renderClosedFrame(frameIdx);

          // ensure flag is reset
          if (!this.useCacheStrategy) {
            this.useCacheStrategy = true;
          }

          return out;
        },

        /**
         * Renders the provided element and all its children.
         *
         * @param element
         * @param context
         * @param domNamespace
         * @returns {string}
         */
        renderElement: (
          element: ReactElement,
          context?: Object = frame.context,
          domNamespace?: string = frame.domNamespace) => {
          this.appendFrame(ReactDOMServerRenderer.createFrame(domNamespace, React.Children.toArray(element), context));
          return this.renderClosedFrame(this.stack.length - 1);
        },

        /**
         * Logs a warning if the base context is modified during the provided render function.
         *
         * NOTE: This only logs warning messages in development.
         *
         * @param baseContext
         * @param render
         * @param [messageSuffix] {string} the message to log
         * @returns {string} the render output
         */
        warnIfRenderModifiesContext: (
          baseContext: Object,
          render: () => string,
          messageSuffix?: string = ''
        ): string => {
          if (__DEV__) {
            const previousWarning = this.warnIfRenderModifiesContext;
            this.warnIfRenderModifiesContext = (currentContext: Object) => {
              if (hasContextChanged(baseContext, currentContext)) {
                console.warn('WARNING: ' + messageSuffix);
              }
            };

            const out = render(baseContext);
            this.warnIfRenderModifiesContext = previousWarning;
            return out;
          } else {
            return render(baseContext);
          }
        },
      });
    }
    // TODO: === END: Cache Hook ===
    return this.renderFrameChild(child, frame);
  }

  renderFrameChild(child: ReactNode | null, frame: Frame): string {
    if (__DEV__) {
      setCurrentDebugStack(this.stack);
    }
    var out = this.render(child, frame.context, frame.domNamespace);
    if (__DEV__) {
      // TODO: Handle reentrant server render calls. This doesn't.
      resetCurrentDebugStack();
    }
    return out;
  }

  read(bytes: number): string | null {
    if (this.exhausted) {
      return null;
    }

    var state = this.renderStats.start();
    var out = '';
    while (out.length < bytes) {
      if (this.stack.length === 0) {
        this.exhausted = true;
        break;
      }
      out += this.renderCurrentFrame();
    }
    this.renderStats.end(state);
    return out;
  }

  renderText(child: ReactNode): string {
    var text = '' + child;
    if (text === '') {
      return '';
    }
    if (this.makeStaticMarkup) {
      return escapeTextContentForBrowser(text);
    }
    if (this.previousWasTextNode) {
      return '<!-- -->' + escapeTextContentForBrowser(text);
    }
    this.previousWasTextNode = true;
    return escapeTextContentForBrowser(text);
  }

  renderComponent(
    nextChild: ReactNode | null,
    context: Object,
    parentNamespace: string,
  ): string {
    if (nextChild === null || nextChild === false) {
      return '';
    } else if (nextChild instanceof CacheElement) {
      // TODO: === START: Cache Hook ===
      // Special-case, a cache element requires its own frame
      var cacheFrame = ReactDOMServerRenderer.createFrame(parentNamespace, toArray(nextChild.children), context);
      cacheFrame.cacheState = nextChild.cacheState;
      this.cacheFrameCounter++;
      this.appendFrame(cacheFrame);
      return '';
      // TODO: === END: Cache Hook ===
    } else if (!React.isValidElement(nextChild)) {
      const nextChildren = toArray(nextChild);
      this.appendFrame(ReactDOMServerRenderer.createFrame(parentNamespace, nextChildren, context));
      return '';
    } else if (
      ((nextChild: any): ReactElement).type === REACT_FRAGMENT_TYPE
    ) {
      const nextChildren = toArray(
        ((nextChild: any): ReactElement).props.children,
      );
      this.appendFrame(ReactDOMServerRenderer.createFrame(parentNamespace, nextChildren, context));
      return '';
    } else {
      // Safe because we just checked it's an element.
      var nextElement = ((nextChild: any): ReactElement);
      return this.renderDOM(nextElement, context, parentNamespace);
    }
  }

  render(
    child: ReactNode | null,
    context: Object,
    parentNamespace: string,
  ): string {
    if (typeof child === 'string' || typeof child === 'number') {
      return this.renderText(child);
    } else {
      var nextChild;
      ({child: nextChild, context} = this.resolve(child, context));
      return this.renderComponent(nextChild, context, parentNamespace);
    }
  }

  resolveElement(
    element: mixed,
    context: Object,
  ): {|
    nextChild: mixed,
    nextContext: Object,
  |} {
    var Component = element.type;
    var publicContext = processContext(Component, context);

    // TODO: === START: Cache Hook ===
    if (this.hasCacheStrategy) {
      if (this.useCacheStrategy) {
        // .getCacheState() should return undefined if the element does not support caching
        var cacheState = this.cacheStrategy.getCacheState(Component, element.props, context);
        if (typeof cacheState !== 'undefined') {
          return {
            nextContext: publicContext,
            nextChild: new CacheElement(cacheState, element),
          };
        }
      } else {
        // Reset flag
        this.useCacheStrategy = true;
      }
    }
    // TODO: === END: Cache Hook ===

    var inst;
    var queue = [];
    var replace = false;
    var updater = {
      isMounted: function(publicInstance) {
        return false;
      },
      enqueueForceUpdate: function(publicInstance) {
        if (queue === null) {
          warnNoop(publicInstance, 'forceUpdate');
          return null;
        }
      },
      enqueueReplaceState: function(publicInstance, completeState) {
        replace = true;
        queue = [completeState];
      },
      enqueueSetState: function(publicInstance, partialState) {
        if (queue === null) {
          warnNoop(publicInstance, 'setState');
          return null;
        }
        queue.push(partialState);
      },
    };

    if (shouldConstruct(Component)) {
      inst = new Component(element.props, publicContext, updater);
    } else {
      inst = Component(element.props, publicContext, updater);
      if (inst == null || inst.render == null) {
        validateRenderResult(inst, Component);
        return {nextChild: inst, nextContext: context};
      }
    }

    inst.props = element.props;
    inst.context = publicContext;
    inst.updater = updater;

    var initialState = inst.state;
    if (initialState === undefined) {
      inst.state = initialState = null;
    }
    if (inst.componentWillMount) {
      inst.componentWillMount();
      if (queue.length) {
        var oldQueue = queue;
        var oldReplace = replace;
        queue = null;
        replace = false;

        if (oldReplace && oldQueue.length === 1) {
          inst.state = oldQueue[0];
        } else {
          var nextState = oldReplace ? oldQueue[0] : inst.state;
          var dontMutate = true;
          for (var i = oldReplace ? 1 : 0; i < oldQueue.length; i++) {
            var partial = oldQueue[i];
            var partialState =
              typeof partial === 'function'
                ? partial.call(inst, nextState, element.props, publicContext)
                : partial;
            if (partialState) {
              if (dontMutate) {
                dontMutate = false;
                nextState = Object.assign({}, nextState, partialState);
              } else {
                Object.assign(nextState, partialState);
              }
            }
          }
          inst.state = nextState;
        }
      } else {
        queue = null;
      }
    }
    var child = inst.render();

    if (__DEV__) {
      if (child === undefined && inst.render._isMockFunction) {
        // This is probably bad practice. Consider warning here and
        // deprecating this convenience.
        child = null;
      }
    }
    validateRenderResult(child, Component);

    var childContext;
    if (typeof inst.getChildContext === 'function') {
      var childContextTypes = Component.childContextTypes;
      invariant(
        typeof childContextTypes === 'object',
        '%s.getChildContext(): childContextTypes must be defined in order to ' +
        'use getChildContext().',
        getComponentName(Component) || 'Unknown',
      );
      childContext = inst.getChildContext();
      for (let contextKey in childContext) {
        invariant(
          contextKey in childContextTypes,
          '%s.getChildContext(): key "%s" is not defined in childContextTypes.',
          getComponentName(Component) || 'Unknown',
          contextKey,
        );
      }
    }
    if (childContext) {
      context = Object.assign({}, context, childContext);
    }
    return {nextChild: child, nextContext: context};
  }

  renderDOM(
    element: ReactElement,
    context: Object,
    parentNamespace: string,
  ): string {
    var tag = element.type.toLowerCase();

    let namespace = parentNamespace;
    if (parentNamespace === Namespaces.html) {
      namespace = getIntrinsicNamespace(tag);
    }

    if (__DEV__) {
      if (namespace === Namespaces.html) {
        // Should this check be gated by parent namespace? Not sure we want to
        // allow <SVG> or <mATH>.
        warning(
          tag === element.type,
          '<%s /> is using uppercase HTML. Always use lowercase HTML tags ' +
            'in React.',
          element.type,
        );
      }
    }

    validateDangerousTag(tag);

    var props = element.props;
    if (tag === 'input') {
      if (__DEV__) {
        ReactControlledValuePropTypes.checkPropTypes(
          'input',
          props,
          getStackAddendum,
        );

        if (
          props.checked !== undefined &&
          props.defaultChecked !== undefined &&
          !didWarnDefaultChecked
        ) {
          warning(
            false,
            '%s contains an input of type %s with both checked and defaultChecked props. ' +
              'Input elements must be either controlled or uncontrolled ' +
              '(specify either the checked prop, or the defaultChecked prop, but not ' +
              'both). Decide between using a controlled or uncontrolled input ' +
              'element and remove one of these props. More info: ' +
              'https://fb.me/react-controlled-components',
            'A component',
            props.type,
          );
          didWarnDefaultChecked = true;
        }
        if (
          props.value !== undefined &&
          props.defaultValue !== undefined &&
          !didWarnDefaultInputValue
        ) {
          warning(
            false,
            '%s contains an input of type %s with both value and defaultValue props. ' +
              'Input elements must be either controlled or uncontrolled ' +
              '(specify either the value prop, or the defaultValue prop, but not ' +
              'both). Decide between using a controlled or uncontrolled input ' +
              'element and remove one of these props. More info: ' +
              'https://fb.me/react-controlled-components',
            'A component',
            props.type,
          );
          didWarnDefaultInputValue = true;
        }
      }

      props = Object.assign(
        {
          type: undefined,
        },
        props,
        {
          defaultChecked: undefined,
          defaultValue: undefined,
          value: props.value != null ? props.value : props.defaultValue,
          checked: props.checked != null ? props.checked : props.defaultChecked,
        },
      );
    } else if (tag === 'textarea') {
      if (__DEV__) {
        ReactControlledValuePropTypes.checkPropTypes(
          'textarea',
          props,
          getStackAddendum,
        );
        if (
          props.value !== undefined &&
          props.defaultValue !== undefined &&
          !didWarnDefaultTextareaValue
        ) {
          warning(
            false,
            'Textarea elements must be either controlled or uncontrolled ' +
              '(specify either the value prop, or the defaultValue prop, but not ' +
              'both). Decide between using a controlled or uncontrolled textarea ' +
              'and remove one of these props. More info: ' +
              'https://fb.me/react-controlled-components',
          );
          didWarnDefaultTextareaValue = true;
        }
      }

      var initialValue = props.value;
      if (initialValue == null) {
        var defaultValue = props.defaultValue;
        // TODO (yungsters): Remove support for children content in <textarea>.
        var textareaChildren = props.children;
        if (textareaChildren != null) {
          if (__DEV__) {
            warning(
              false,
              'Use the `defaultValue` or `value` props instead of setting ' +
                'children on <textarea>.',
            );
          }
          invariant(
            defaultValue == null,
            'If you supply `defaultValue` on a <textarea>, do not pass children.',
          );
          if (Array.isArray(textareaChildren)) {
            invariant(
              textareaChildren.length <= 1,
              '<textarea> can only have at most one child.',
            );
            textareaChildren = textareaChildren[0];
          }

          defaultValue = '' + textareaChildren;
        }
        if (defaultValue == null) {
          defaultValue = '';
        }
        initialValue = defaultValue;
      }

      props = Object.assign({}, props, {
        value: undefined,
        children: '' + initialValue,
      });
    } else if (tag === 'select') {
      if (__DEV__) {
        ReactControlledValuePropTypes.checkPropTypes(
          'select',
          props,
          getStackAddendum,
        );

        for (var i = 0; i < valuePropNames.length; i++) {
          var propName = valuePropNames[i];
          if (props[propName] == null) {
            continue;
          }
          var isArray = Array.isArray(props[propName]);
          if (props.multiple && !isArray) {
            warning(
              false,
              'The `%s` prop supplied to <select> must be an array if ' +
                '`multiple` is true.%s',
              propName,
              '', // getDeclarationErrorAddendum(),
            );
          } else if (!props.multiple && isArray) {
            warning(
              false,
              'The `%s` prop supplied to <select> must be a scalar ' +
                'value if `multiple` is false.%s',
              propName,
              '', // getDeclarationErrorAddendum(),
            );
          }
        }

        if (
          props.value !== undefined &&
          props.defaultValue !== undefined &&
          !didWarnDefaultSelectValue
        ) {
          warning(
            false,
            'Select elements must be either controlled or uncontrolled ' +
              '(specify either the value prop, or the defaultValue prop, but not ' +
              'both). Decide between using a controlled or uncontrolled select ' +
              'element and remove one of these props. More info: ' +
              'https://fb.me/react-controlled-components',
          );
          didWarnDefaultSelectValue = true;
        }
      }
      this.currentSelectValue =
        props.value != null ? props.value : props.defaultValue;
      props = Object.assign({}, props, {
        value: undefined,
      });
    } else if (tag === 'option') {
      var selected = null;
      var selectValue = this.currentSelectValue;
      var optionChildren = flattenOptionChildren(props.children);
      if (selectValue != null) {
        var value;
        if (props.value != null) {
          value = props.value + '';
        } else {
          value = optionChildren;
        }
        selected = false;
        if (Array.isArray(selectValue)) {
          // multiple
          for (var j = 0; j < selectValue.length; j++) {
            if ('' + selectValue[j] === value) {
              selected = true;
              break;
            }
          }
        } else {
          selected = '' + selectValue === value;
        }

        props = Object.assign(
          {
            selected: undefined,
            children: undefined,
          },
          props,
          {
            selected: selected,
            children: optionChildren,
          },
        );
      }
    }

    if (__DEV__) {
      validatePropertiesInDevelopment(tag, props);
    }

    assertValidProps(tag, props, getStackAddendum);

    var out = createOpenTagMarkup(
      element.type,
      tag,
      props,
      namespace,
      this.makeStaticMarkup,
      (this.stack.length - this.cacheFrameCounter) === 1,
    );
    var footer = '';
    if (omittedCloseTags.hasOwnProperty(tag)) {
      out += '/>';
    } else {
      out += '>';
      footer = '</' + element.type + '>';
    }
    var children;
    var innerMarkup = getNonChildrenInnerMarkup(props);
    if (innerMarkup != null) {
      children = [];
      if (newlineEatingTags[tag] && innerMarkup.charAt(0) === '\n') {
        // text/html ignores the first character in these tags if it's a newline
        // Prefer to break application/xml over text/html (for now) by adding
        // a newline specifically to get eaten by the parser. (Alternately for
        // textareas, replacing "^\n" with "\r\n" doesn't get eaten, and the first
        // \r is normalized out by HTMLTextAreaElement#value.)
        // See: <http://www.w3.org/TR/html-polyglot/#newlines-in-textarea-and-pre>
        // See: <http://www.w3.org/TR/html5/syntax.html#element-restrictions>
        // See: <http://www.w3.org/TR/html5/syntax.html#newlines>
        // See: Parsing of "textarea" "listing" and "pre" elements
        //  from <http://www.w3.org/TR/html5/syntax.html#parsing-main-inbody>
        out += '\n';
      }
      out += innerMarkup;
    } else {
      children = toArray(props.children);
    }
    var frame = {
      domNamespace: getChildNamespace(parentNamespace, element.type),
      tag,
      children,
      childIndex: 0,
      context: context,
      footer: footer,
    };
    if (__DEV__) {
      ((frame: any): FrameDev).debugElementStack = [];
    }
    this.appendFrame(frame);
    this.previousWasTextNode = false;
    return out;
  }

  resolve(
    child: mixed,
    context: Object,
  ): {|
    child: mixed,
    context: Object,
  |} {
    while (React.isValidElement(child)) {
      // Safe because we just checked it's an element.
      var element: ReactElement = ((child: any): ReactElement);
      if (__DEV__) {
        pushElementToDebugStack(element);
      }
      if (typeof element.type !== 'function') {
        break;
      }
      ({nextChild: child, nextContext: context} = this.resolveElement(element, context));
    }
    return {child, context};
  }
}

export default ReactDOMServerRenderer;
