import { AnyObject, verified, isRecord, isString } from './types';
import type { Collection, JSCodeshift } from 'jscodeshift';
import type { Property, MemberProperty, HasCallee } from './ast';
import type * as ast from 'ast-types/gen/kinds';

const LAYOUT_DECORATOR_NAME = 'layout';
const LAYOUT_DECORATOR_LOCAL_NAME = 'templateLayout';

const DECORATOR_PATHS = {
  '@ember/object': {
    importPropDecoratorMap: {
      observer: 'observes',
      computed: 'computed',
    },
    decoratorPath: '@ember/object',
  },
  '@ember/object/evented': {
    importPropDecoratorMap: {
      on: 'on',
    },
    decoratorPath: '@ember-decorators/object',
  },
  '@ember/controller': {
    importPropDecoratorMap: {
      inject: 'inject',
    },
    decoratorPath: '@ember/controller',
  },
  '@ember/service': {
    importPropDecoratorMap: {
      inject: 'inject',
    },
    decoratorPath: '@ember/service',
  },
  '@ember/object/computed': {
    decoratorPath: '@ember/object/computed',
  },
} as const;

const DECORATOR_PATH_OVERRIDES = {
  observes: '@ember-decorators/object',
} as const;

const EMBER_DECORATOR_SPECIFIERS = {
  '@ember/object': ['action'],
  '@ember-decorators/object': ['off', 'on', 'unobserves'],
  '@ember-decorators/component': [
    'classNames',
    'attributeBindings',
    'classNameBindings',
    LAYOUT_DECORATOR_NAME,
    'tagName',
    LAYOUT_DECORATOR_LOCAL_NAME,
  ],
} as const;

const METHOD_DECORATORS = ['action', 'on', 'observer'] as const;

const ACTION_SUPER_EXPRESSION_COMMENT = [
  ' TODO: This call to super is within an action, and has to refer to the parent',
  " class's actions to be safe. This should be refactored to call a normal method",
  ' on the parent class. If the parent class has not been converted to native',
  ' classes, it may need to be refactored as well. See',
  ' https: //github.com/scalvert/ember-native-class-codemod/blob/master/README.md',
  ' for more details.',
] as const;

const LIFECYCLE_HOOKS = [
  // Methods
  '$',
  'addObserver',
  'cacheFor',
  'decrementProperty',
  'destroy',
  'didReceiveAttrs',
  'didRender',
  'didUpdate',
  'didUpdateAttrs',
  'get',
  'getProperties',
  'getWithDefault',
  'has',
  'incrementProperty',
  'init',
  'notifyPropertyChange',
  'off',
  'on',
  'one',
  'readDOMAttr',
  'removeObserver',
  'rerender',
  'send',
  'set',
  'setProperties',
  'toString',
  'toggleProperty',
  'trigger',
  'willDestroy',
  'willRender',
  'willUpdate',

  // Events
  'didInsertElement',
  'didReceiveAttrs',
  'didRender',
  'didUpdate',
  'didUpdateAttrs',
  'willClearRender',
  'willDestroyElement',
  'willInsertElement',
  'willRender',
  'willUpdate',

  // Touch events
  'touchStart',
  'touchMove',
  'touchEnd',
  'touchCancel',

  // Keyboard events
  'keyDown',
  'keyUp',
  'keyPress',

  // Mouse events
  'mouseDown',
  'mouseUp',
  'contextMenu',
  'click',
  'doubleClick',
  'mouseMove',
  'focusIn',
  'focusOut',
  'mouseEnter',
  'mouseLeave',

  // Form events
  'submit',
  'change',
  'focusIn',
  'focusOut',
  'input',

  // HTML5 drag and drop events
  'dragStart',
  'drag',
  'dragEnter',
  'dragLeave',
  'dragOver',
  'dragEnd',
  'drop',
] as const;

/**
 * Get a property from and object, useful to get nested props without checking for null values
 *
 * @deprecated
 */
function get(obj: AnyObject, path: string): unknown {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;

  for (const part of parts) {
    const next = current[part];
    if (next === undefined || next === null) {
      return current;
    } else {
      current = verified(next, isRecord);
    }
  }

  return current;
}

/**
 * Get the first declaration in the program
 */
function getFirstDeclaration(j: JSCodeshift, root: Collection<unknown>) {
  return j(root.find(j.Declaration).at(0).get());
}

/**
 * Return name of the property
 */
function getPropName(prop: AnyObject): string {
  return verified(get(prop, 'key.name'), isString);
}

/**
 * Return type of the property
 */
function getPropType(prop: AnyObject): string {
  return verified(get(prop, 'value.type'), isString);
}

/**
 * Return the callee name of the property
 */
function getPropCalleeName(prop: Property): string | undefined {
  return prop.value.callee.name ?? prop.value.callee.object?.callee.name;
  // return get(prop, 'value.callee.name') || get(prop, 'value.callee.object.callee.name');
}

/**
 * Returns true if class property should have value
 *
 * @param {Property} prop
 * @returns {Boolean}
 */
function shouldSetValue(prop: Property) {
  if (!prop.hasDecorators) {
    return true;
  }
  return prop.decoratorNames.every(
    (decoratorName) => decoratorName === 'className' || decoratorName === 'attribute'
  );
}

/**
 * Convert the first letter to uppercase
 *
 * @param {String} name
 * @returns {String}
 */
function capitalizeFirstLetter(name: string): string {
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
}

/**
 * Returns true if the first character in the word is uppercase
 *
 * @param {String} word
 * @returns {Boolean}
 */
function startsWithUpperCaseLetter(word = ''): boolean {
  return !!word && word.charAt(0) !== word.charAt(0).toLowerCase();
}

const CLASS_DECORATOR_PROPS = new Set([
  'layout',
  'tagName',
  'classNames',
  'classNameBindings',
  'attributeBindings',
]);

/**
 * Return true if prop is of name `tagName` or `classNames`
 */
function isClassDecoratorProp(propName: string): boolean {
  return CLASS_DECORATOR_PROPS.has(propName);
}

/**
 * Get property modifier from the property callee object
 */
function getModifier(calleeObject: HasCallee): { prop: MemberProperty | undefined; args: unknown } {
  return {
    prop: calleeObject?.callee?.property,
    args: calleeObject.arguments,
  };
}

export {
  ACTION_SUPER_EXPRESSION_COMMENT,
  capitalizeFirstLetter,
  DECORATOR_PATHS,
  DECORATOR_PATH_OVERRIDES,
  EMBER_DECORATOR_SPECIFIERS,
  get,
  getFirstDeclaration,
  getModifier,
  getPropCalleeName,
  getPropName,
  getPropType,
  isClassDecoratorProp,
  LAYOUT_DECORATOR_LOCAL_NAME,
  LAYOUT_DECORATOR_NAME,
  LIFECYCLE_HOOKS,
  METHOD_DECORATORS,
  shouldSetValue,
  startsWithUpperCaseLetter,
};
