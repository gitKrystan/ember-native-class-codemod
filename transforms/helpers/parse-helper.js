"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const camelcase_1 = __importDefault(require("camelcase"));
const ember_codemods_telemetry_helpers_1 = require("ember-codemods-telemetry-helpers");
const util_1 = require("./util");
const validation_helper_1 = require("./validation-helper");
const transform_helper_1 = require("./transform-helper");
const import_helper_1 = require("./import-helper");
const EOProp_1 = __importDefault(require("./EOProp"));
const log_helper_1 = __importDefault(require("./log-helper"));
/**
 * Return the map of instance props and functions from Ember Object
 *
 * For example
 * const myObj = EmberObject.extend({ key: value });
 * will be parsed as:
 * {
 *   instanceProps: [ Property({key: value}) ]
 *  }
 * @param {Object} j - jscodeshift lib reference
 * @param {ObjectExpression} emberObjectExpression
 * @returns {Object} Object of instance and function properties
 */
function getEmberObjectProps(j, eoExpression, importedDecoratedProps = {}, runtimeData = {}) {
    const objProps = (0, util_1.get)(eoExpression, 'properties') || [];
    return {
        instanceProps: objProps.map((objProp) => new EOProp_1.default(objProp, runtimeData, importedDecoratedProps)),
    };
}
/**
 * Get the map of decorators to import other than the computed props, services etc
 * which already have imports in the code
 *
 * @param {EOProp[]} instanceProps
 * @param {Object} decoratorsMap
 */
function getDecoratorsToImportMap(instanceProps, decoratorsMap = {}) {
    return instanceProps.reduce((specs, prop) => {
        return {
            action: specs.action || prop.isActions,
            classNames: specs.classNames || prop.isClassNames,
            classNameBindings: specs.classNameBindings || prop.isClassNameBindings,
            attributeBindings: specs.attributeBindings || prop.isAttributeBindings,
            layout: specs.layout || prop.isLayoutDecorator,
            templateLayout: specs.templateLayout || prop.isTemplateLayoutDecorator,
            off: specs.off || prop.hasOffDecorator,
            tagName: specs.tagName || prop.isTagName,
            unobserves: specs.unobserves || prop.hasUnobservesDecorator,
        };
    }, decoratorsMap);
}
/**
 * Find the `EmberObject.extend` statements
 *
 * @param {Object} j - jscodeshift lib reference
 * @param {File} root
 * @returns {CallExpression[]}
 */
function getEmberObjectCallExpressions(j, root) {
    return root
        .find(j.CallExpression, { callee: { property: { name: 'extend' } } })
        .filter((eoCallExpression) => (0, util_1.startsWithUpperCaseLetter)((0, util_1.get)(eoCallExpression, 'value.callee.object.name')) &&
        (0, util_1.get)(eoCallExpression, 'parentPath.value.type') !== 'ClassDeclaration');
}
/**
 * Returns the variable name
 *
 * @param {VariableDeclaration} varDeclaration
 * @returns {String}
 */
function getVariableName(varDeclaration) {
    return (0, util_1.get)(varDeclaration, 'value.declarations.0.id.name');
}
/**
 * Return closest parent var declaration statement
 *
 * @param {Object} j - jscodeshift lib reference
 * @param {CallExpression} eoCallExpression
 * @returns {VariableDeclaration}
 */
function getClosestVariableDeclaration(j, eoCallExpression) {
    const varDeclarations = j(eoCallExpression).closest(j.VariableDeclaration);
    return varDeclarations.length > 0 ? varDeclarations.get() : null;
}
/**
 * Get the expression to replace
 *
 * It returns either VariableDeclaration or the CallExpression depending on how the object is created
 *
 * @param {Object} j - jscodeshift lib reference
 * @param {CallExpression} eoCallExpression
 * @returns {CallExpression|VariableDeclaration}
 */
function getExpressionToReplace(j, eoCallExpression) {
    const varDeclaration = getClosestVariableDeclaration(j, eoCallExpression);
    const isFollowedByCreate = (0, util_1.get)(eoCallExpression, 'parentPath.value.property.name') === 'create';
    let expressionToReplace = eoCallExpression;
    if (varDeclaration && !isFollowedByCreate) {
        expressionToReplace = varDeclaration;
    }
    return expressionToReplace;
}
/**
 * Returns name of class to be created
 *
 * @param {Object} j - jscodeshift lib reference
 * @param {String} classVariableName
 * @param {String} filePath
 * @return {String}
 */
function getClassName(j, eoCallExpression, filePath, type = '') {
    const varDeclaration = getClosestVariableDeclaration(j, eoCallExpression);
    const classVariableName = getVariableName(varDeclaration);
    if (classVariableName) {
        return classVariableName;
    }
    let className = (0, util_1.capitalizeFirstLetter)((0, camelcase_1.default)(path_1.default.basename(filePath, 'js')));
    const capitalizedType = (0, util_1.capitalizeFirstLetter)(type);
    if (capitalizedType === className) {
        className = (0, util_1.capitalizeFirstLetter)((0, camelcase_1.default)(path_1.default.basename(path_1.default.dirname(filePath))));
    }
    if (!['Component', 'Helper', 'EmberObject'].includes(type)) {
        className = `${className}${capitalizedType}`;
    }
    return className;
}
/**
 * Parse ember object call expression, returns EmberObjectExpression and list of mixins
 *
 * @param {CallExpression} eoCallExpression
 * @returns {Object}
 */
function parseEmberObjectCallExpression(eoCallExpression) {
    const callExpressionArgs = (0, util_1.get)(eoCallExpression, 'value.arguments') || [];
    const props = {
        eoExpression: null,
        mixins: [],
    };
    callExpressionArgs.forEach((callExpressionArg) => {
        if (callExpressionArg.type === 'ObjectExpression') {
            props.eoExpression = callExpressionArg;
        }
        else {
            props.mixins.push(callExpressionArg);
        }
    });
    return props;
}
/**
 * Main entry point for parsing and replacing ember objects
 *
 * @param {Object} j - jscodeshift lib reference
 * @param {File} root
 * @param {String} filePath
 * @param {Object} options
 */
function replaceEmberObjectExpressions(j, root, filePath, options = {}) {
    options.runtimeData = (0, ember_codemods_telemetry_helpers_1.getTelemetryFor)(path_1.default.resolve(filePath));
    if (!options.runtimeData) {
        log_helper_1.default.warn(`[${filePath}]: SKIPPED Could not find runtime data NO_RUNTIME_DATA`);
        return;
    }
    if ((0, validation_helper_1.isTestFile)(filePath)) {
        log_helper_1.default.warn(`[${filePath}]: Skipping test file`);
        return;
    }
    if (options.type && !(0, validation_helper_1.isFileOfType)(filePath, options.type)) {
        log_helper_1.default.warn(`[${filePath}]: FAILURE Type mismatch, expected type '${options.type}' did not match type of file`);
        return;
    }
    // Parse the import statements
    const importedDecoratedProps = (0, import_helper_1.getImportedDecoratedProps)(j, root);
    let transformed = false;
    let decoratorsToImportMap = {};
    getEmberObjectCallExpressions(j, root).forEach((eoCallExpression) => {
        const { eoExpression, mixins } = parseEmberObjectCallExpression(eoCallExpression);
        const eoProps = getEmberObjectProps(j, eoExpression, importedDecoratedProps, options.runtimeData);
        const errors = (0, validation_helper_1.hasValidProps)(j, eoProps, options);
        if ((0, util_1.get)(eoCallExpression, 'parentPath.value.type') === 'MemberExpression') {
            errors.push('class has chained definition (e.g. EmberObject.extend().reopenClass();');
        }
        if (errors.length) {
            log_helper_1.default.warn(`[${filePath}]: FAILURE \nValidation errors: \n\t${errors.join('\n\t')}`);
            return;
        }
        let className = getClassName(j, eoCallExpression, filePath, (0, util_1.get)(options, 'runtimeData.type'));
        const superClassName = (0, util_1.get)(eoCallExpression, 'value.callee.object.name');
        if (className === superClassName) {
            className = `_${className}`;
        }
        const es6ClassDeclaration = (0, transform_helper_1.createClass)(j, className, eoProps, superClassName, mixins, options);
        const expressionToReplace = getExpressionToReplace(j, eoCallExpression);
        j(expressionToReplace).replaceWith((0, transform_helper_1.withComments)(es6ClassDeclaration, expressionToReplace.value));
        transformed = true;
        decoratorsToImportMap = getDecoratorsToImportMap(eoProps.instanceProps, decoratorsToImportMap);
    });
    // Need to find another way, as there might be a case where
    // one object from a file is transformed and other is not
    if (transformed) {
        const decoratorsToImport = Object.keys(decoratorsToImportMap).filter((key) => decoratorsToImportMap[key]);
        (0, import_helper_1.createDecoratorImportDeclarations)(j, root, decoratorsToImport, options);
        log_helper_1.default.info(`[${filePath}]: SUCCESS`);
    }
    return transformed;
}
module.exports = {
    getClassName,
    getClosestVariableDeclaration,
    getEmberObjectCallExpressions,
    getEmberObjectProps,
    getExpressionToReplace,
    getVariableName,
    replaceEmberObjectExpressions,
};
