"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startsWithUpperCaseLetter = exports.shouldSetValue = exports.METHOD_DECORATORS = exports.LIFECYCLE_HOOKS = exports.LAYOUT_DECORATOR_NAME = exports.LAYOUT_DECORATOR_LOCAL_NAME = exports.isClassDecoratorProp = exports.getPropType = exports.getPropName = exports.getPropCalleeName = exports.getModifier = exports.getFirstDeclaration = exports.get = exports.EMBER_DECORATOR_SPECIFIERS = exports.DECORATOR_PATH_OVERRIDES = exports.DECORATOR_PATHS = exports.capitalizeFirstLetter = exports.ACTION_SUPER_EXPRESSION_COMMENT = void 0;
const types_1 = require("./types");
const LAYOUT_DECORATOR_NAME = 'layout';
exports.LAYOUT_DECORATOR_NAME = LAYOUT_DECORATOR_NAME;
const LAYOUT_DECORATOR_LOCAL_NAME = 'templateLayout';
exports.LAYOUT_DECORATOR_LOCAL_NAME = LAYOUT_DECORATOR_LOCAL_NAME;
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
};
exports.DECORATOR_PATHS = DECORATOR_PATHS;
const DECORATOR_PATH_OVERRIDES = {
    observes: '@ember-decorators/object',
};
exports.DECORATOR_PATH_OVERRIDES = DECORATOR_PATH_OVERRIDES;
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
};
exports.EMBER_DECORATOR_SPECIFIERS = EMBER_DECORATOR_SPECIFIERS;
const METHOD_DECORATORS = ['action', 'on', 'observer'];
exports.METHOD_DECORATORS = METHOD_DECORATORS;
const ACTION_SUPER_EXPRESSION_COMMENT = [
    ' TODO: This call to super is within an action, and has to refer to the parent',
    " class's actions to be safe. This should be refactored to call a normal method",
    ' on the parent class. If the parent class has not been converted to native',
    ' classes, it may need to be refactored as well. See',
    ' https: //github.com/scalvert/ember-native-class-codemod/blob/master/README.md',
    ' for more details.',
];
exports.ACTION_SUPER_EXPRESSION_COMMENT = ACTION_SUPER_EXPRESSION_COMMENT;
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
];
exports.LIFECYCLE_HOOKS = LIFECYCLE_HOOKS;
/**
 * Get a property from and object, useful to get nested props without checking for null values
 *
 * @deprecated
 */
function get(obj, path) {
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
        const next = current[part];
        if (next === undefined || next === null) {
            return current;
        }
        else {
            current = (0, types_1.verified)(next, types_1.isRecord);
        }
    }
    return current;
}
exports.get = get;
/**
 * Get the first declaration in the program
 */
function getFirstDeclaration(j, root) {
    return j(root.find(j.Declaration).at(0).get());
}
exports.getFirstDeclaration = getFirstDeclaration;
/**
 * Return name of the property
 */
function getPropName(prop) {
    return (0, types_1.verified)(get(prop, 'key.name'), types_1.isString);
}
exports.getPropName = getPropName;
/**
 * Return type of the property
 */
function getPropType(prop) {
    return (0, types_1.verified)(get(prop, 'value.type'), types_1.isString);
}
exports.getPropType = getPropType;
/**
 * Return the callee name of the property
 */
function getPropCalleeName(prop) {
    return prop.value.callee.name ?? prop.value.callee.object?.callee.name;
    // return get(prop, 'value.callee.name') || get(prop, 'value.callee.object.callee.name');
}
exports.getPropCalleeName = getPropCalleeName;
/**
 * Returns true if class property should have value
 *
 * @param {Property} prop
 * @returns {Boolean}
 */
function shouldSetValue(prop) {
    if (!prop.hasDecorators) {
        return true;
    }
    return prop.decoratorNames.every((decoratorName) => decoratorName === 'className' || decoratorName === 'attribute');
}
exports.shouldSetValue = shouldSetValue;
/**
 * Convert the first letter to uppercase
 *
 * @param {String} name
 * @returns {String}
 */
function capitalizeFirstLetter(name) {
    return name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
}
exports.capitalizeFirstLetter = capitalizeFirstLetter;
/**
 * Returns true if the first character in the word is uppercase
 *
 * @param {String} word
 * @returns {Boolean}
 */
function startsWithUpperCaseLetter(word = '') {
    return !!word && word.charAt(0) !== word.charAt(0).toLowerCase();
}
exports.startsWithUpperCaseLetter = startsWithUpperCaseLetter;
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
function isClassDecoratorProp(propName) {
    return CLASS_DECORATOR_PROPS.has(propName);
}
exports.isClassDecoratorProp = isClassDecoratorProp;
/**
 * Get property modifier from the property callee object
 */
function getModifier(calleeObject) {
    return {
        prop: calleeObject?.callee?.property,
        args: calleeObject.arguments,
    };
}
exports.getModifier = getModifier;
