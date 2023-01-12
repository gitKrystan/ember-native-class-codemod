import type { JSCodeshift } from 'jscodeshift';
import minimatch from 'minimatch';
import type EOProp from './EOProp';
import type { EOProps } from './EOProp';
import { DEFAULT_OPTIONS, Options } from './options';
import { LIFECYCLE_HOOKS, getPropName } from './util';
import { assert } from './util/types';

const UNSUPPORTED_PROP_NAMES = ['actions', 'layout'] as const;

const TYPE_PATTERNS = {
  service: '**/services/**/*.js',
  services: '**/services/**/*.js',
  controller: '**/controllers/**/*.js',
  controllers: '**/controllers/**/*.js',
  component: '**/components/**/*.js',
  components: '**/components/**/*.js',
  route: '**/routes/**/*.js',
  routes: '**/routes/**/*.js',
} as const;

const TEST_FILE_PATTERN = '**/*-test.js' as const;

/** Returns true if the specified file is a test file */
export function isTestFile(file: string): boolean {
  return minimatch(file, TEST_FILE_PATTERN);
}

/**
 * Returns true if the given path matches the type of ember object
 * The glob patterns are specified by `TYPE_PATTERNS`
 */
export function isFileOfType(file: string, type: Options['type']): boolean {
  if (!type || !TYPE_PATTERNS[type]) {
    return true;
  }
  return minimatch(file, TYPE_PATTERNS[type]);
}

/**
 * Iterates through instance properties to verify if there are any props that can not be transformed
 */
export function hasValidProps(
  j: JSCodeshift,
  { instanceProps }: EOProps = { instanceProps: [] },
  { decorators, classFields }: Options = DEFAULT_OPTIONS
): string[] {
  const unsupportedPropNames: readonly string[] = decorators ? [] : UNSUPPORTED_PROP_NAMES;

  return instanceProps.reduce((errors, instanceProp) => {
    if (!classFields && instanceProp.type === 'Literal') {
      errors.push(`[${instanceProp.name}]: Need option '--class-fields=true'`);
    }

    if (
      instanceProp.type === 'ObjectExpression' &&
      !['actions', 'queryParams'].includes(instanceProp.name)
    ) {
      errors.push(
        `[${instanceProp.name}]: Transform not supported - value is of type object. For more details: eslint-plugin-ember/avoid-leaking-state-in-ember-objects`
      );
    }

    if (instanceProp.isActions) {
      errors = errors.concat(getLifecycleHookErrors(instanceProp));
      errors = errors.concat(getInfiniteLoopErrors(j, instanceProp));
    }

    if (
      (!decorators && (instanceProp.hasDecorators || instanceProp.isClassDecorator)) ||
      unsupportedPropNames.includes(instanceProp.name) ||
      (instanceProp.isCallExpression && !instanceProp.hasDecorators)
    ) {
      errors.push(
        `[${instanceProp.name}]: Transform not supported - need option '--decorators=true' or the property type ${instanceProp.type} can not be transformed`
      );
    }

    if (instanceProp.hasModifierWithArgs) {
      errors.push(
        `[${instanceProp.name}]: Transform not supported - value has modifiers like 'property' or 'meta'`
      );
    }

    if (instanceProp.hasVolatile && instanceProp.hasMetaDecorator) {
      errors.push(
        `[${instanceProp.name}]: Transform not supported - value has 'volatile' modifier with computed meta ('@ember/object/computed') is not supported`
      );
    }
    return errors;
  }, [] as string[]);
}

/**
 * Iterate over actions and verify that the action name does not match the lifecycle hooks
 * The transformation is not supported if an action has the same name as lifecycle hook
 * Reference: https://github.com/scalvert/ember-native-class-codemod/issues/34
 */
function getLifecycleHookErrors(actionsProp: EOProp) {
  // FIXME: If this never gets hit we can narrow prop type
  assert('properties' in actionsProp.value, 'expected prop value to have properties');
  const actionProps = actionsProp.value.properties;
  let errors: string[] = [];
  for (let actionProp of actionProps) {
    const actionName = getPropName(actionProp);
    // not sure if actionName is ever falsey here? aside from ''...
    if (actionName && LIFECYCLE_HOOKS.includes(actionName)) {
      errors.push(
        `[${actionName}]: Transform not supported - action name matches one of the lifecycle hooks. Rename and try again. See https://github.com/scalvert/ember-native-class-codemod/issues/34 for more details`
      );
    }
  }
  return errors;
}

/**
 * Validation against pattern mentioned https://github.com/scalvert/eslint-plugin-ember-es6-class/pull/2
 */
function getInfiniteLoopErrors(j: JSCodeshift, actionsProp: EOProp) {
  // FIXME: If this never gets hit we can narrow prop type
  assert('properties' in actionsProp.value, 'expected prop value to have properties');
  const actionProps = actionsProp.value.properties;
  let errors: string[] = [];
  for (let actionProp of actionProps) {
    const actionName = getPropName(actionProp);
    if (actionName) {
      // FIXME: If this never gets hit we can narrow prop type
      assert('value' in actionProp, 'expected value in actionProp');
      const functExpr = j(actionProp.value);

      // Occurrences of this.actionName()
      const actionCalls = functExpr.find(j.CallExpression, {
        callee: {
          type: 'MemberExpression',
          object: {
            type: 'ThisExpression',
          },
          property: {
            type: 'Identifier',
            name: actionName,
          },
        },
      });

      // Occurrences of this.get('actionName')() or get(this, 'actionName')()
      const actionLiterals = functExpr.find(j.Literal, { value: actionName });

      if (actionLiterals.length || actionCalls.length) {
        errors.push(
          `[${actionName}]: Transform not supported - calling the passed action would cause an infinite loop. See https://github.com/scalvert/eslint-plugin-ember-es6-class/pull/2 for more details`
        );
      }
    }
    return errors;
  }
  return errors;
}