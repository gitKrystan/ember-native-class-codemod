import {
  get,
  getPropName,
  getPropType,
  getModifier,
  isClassDecoratorProp,
  LAYOUT_DECORATOR_LOCAL_NAME,
  LAYOUT_DECORATOR_NAME,
} from './util/index';
import type { AnyObject } from './util/types';
import type * as ast from 'ast-types/gen/kinds';

type JsonValue = string | boolean | number | null | JsonObject | JsonArray;
type JsonArray = JsonValue[];
interface JsonObject extends Record<string, JsonValue> {}

interface RuntimeData {
  type: string;
  computedProperties: JsonValue[];
  offProperties: JsonObject;
  overriddenActions: JsonValue[];
  overriddenProperties: JsonValue[];
  unobservedProperties: JsonObject;
}

interface Decorator {
  readonly name: 'unobserves' | 'off';
}

interface DecoratorArgs {
  unobserves?: unknown;
  off?: unknown;
}

/**
 * Ember Object Property
 *
 * A wrapper object for ember object properties
 */
class EOProp {
  readonly _prop: ast.NodeKind;
  readonly decorators: Decorator[] = [];
  readonly modifiers: unknown[] = [];
  readonly decoratorArgs: DecoratorArgs = {};
  readonly isComputed: boolean | undefined; // FIXME: default to false?
  readonly isOverridden: boolean | undefined; // FIXME: default to false?
  readonly overriddenActions: JsonValue[] | undefined; // FIXME: Default to [] ?
  readonly runtimeType: string | undefined;

  readonly emberType: string | undefined;

  constructor(
    eoProp: ast.PropertyKind,
    runtimeData: RuntimeData,
    importedDecoratedProps: AnyObject
  ) {
    this._prop = eoProp;

    // FIXME: Make a RuntimeData class?
    if (runtimeData.type) {
      const {
        type,
        computedProperties = [],
        offProperties = {},
        overriddenActions = [],
        overriddenProperties = [],
        unobservedProperties = {},
      } = runtimeData;

      this.emberType = type;

      const name = this.name;
      if (Object.keys(unobservedProperties).includes(name)) {
        this.decorators.push({ name: 'unobserves' });
        this.decoratorArgs['unobserves'] = unobservedProperties[name];
      }
      if (Object.keys(offProperties).includes(name)) {
        this.decorators.push({ name: 'off' });
        this.decoratorArgs['off'] = offProperties[name];
      }
      if (computedProperties.includes(name)) {
        this.isComputed = true;
      }
      if (this.isActions) {
        this.overriddenActions = overriddenActions;
      }
      this.isOverridden = overriddenProperties.includes(name);
      this.runtimeType = type;
    }

    if (this.is('CallExpression')) {
      let calleeObject = this._prop.value;
      const modifiers = [getModifier(calleeObject)];
      while (get(calleeObject, 'callee.type') === 'MemberExpression') {
        calleeObject = get(calleeObject, 'callee.object');
        modifiers.push(getModifier(calleeObject));
      }
      this.calleeObject = calleeObject;
      this.modifiers = modifiers.reverse();
      this.modifiers.shift();

      if (importedDecoratedProps[this.calleeName]) {
        this.decorators.push(importedDecoratedProps[this.calleeName]);
      } else if (this.isComputed) {
        this.decorators.push({ name: this.calleeName });
      }
    }
  }

  get value() {
    return get(this._prop, 'value');
  }

  get kind() {
    let kind = get(this._prop, 'kind');
    let method = get(this._prop, 'method');

    if (
      kind === 'init' &&
      this.hasDecorators &&
      this.decorators.find((d) => d.importedName === 'computed')
    ) {
      kind = 'get';
    }

    if (method || this.hasMethodDecorator) {
      kind = 'method';
    }

    return kind;
  }

  get key() {
    return get(this._prop, 'key');
  }

  get name() {
    return getPropName(this._prop);
  }

  get type() {
    return getPropType(this._prop);
  }

  get calleeName() {
    return get(this.calleeObject, 'callee.name');
  }

  get comments() {
    return this._prop.comments;
  }

  get computed() {
    return this._prop.computed;
  }

  get isClassDecorator() {
    return isClassDecoratorProp(this.name);
  }

  get decoratorNames() {
    return this.decorators.map((d) => d.name);
  }

  get classDecoratorName() {
    if (this.name === LAYOUT_DECORATOR_NAME && this.value.name === LAYOUT_DECORATOR_NAME) {
      return LAYOUT_DECORATOR_LOCAL_NAME;
    }
    return this.name;
  }

  get isLayoutDecorator() {
    return this.classDecoratorName === LAYOUT_DECORATOR_NAME;
  }

  get isTemplateLayoutDecorator() {
    return this.classDecoratorName === LAYOUT_DECORATOR_LOCAL_NAME;
  }

  is<K extends ast.NodeKind['type']>(
    type: K
  ): this is { _prop: Extract<ast.NodeKind, { type: K }> } {
    return this.type === type;
  }

  get isCallExpression() {
    return this.type === 'CallExpression';
  }

  get hasDecorators() {
    return this.decorators.length;
  }

  get callExprArgs() {
    return get(this.calleeObject, 'arguments') || [];
  }

  get shouldRemoveLastArg() {
    return this.kind === 'method' || this.kind === 'get';
  }

  get hasModifierWithArgs() {
    return this.modifiers.some((modifier) => modifier.args.length);
  }

  get hasVolatile() {
    return this.modifiers.some((modifier) => get(modifier, 'prop.name') === 'volatile');
  }

  get hasReadOnly() {
    return this.modifiers.some((modifier) => get(modifier, 'prop.name') === 'readOnly');
  }

  get isVolatileReadOnly() {
    return this.modifiers.length === 2 && this.hasVolatile && this.hasReadOnly;
  }

  get isTagName() {
    return this.name === 'tagName';
  }

  get isClassNames() {
    return this.name === 'classNames';
  }

  get isClassNameBindings() {
    return this.name === 'classNameBindings';
  }

  get isAttributeBindings() {
    return this.name === 'attributeBindings';
  }

  get isActions() {
    return this.name === 'actions';
  }

  get hasUnobservesDecorator() {
    return this.decoratorNames.includes('unobserves');
  }

  get hasOffDecorator() {
    return this.decoratorNames.includes('off');
  }

  get hasRuntimeData() {
    return !!this.runtimeType;
  }

  get hasMethodDecorator() {
    return this.decorators.find((d) => d.isMethodDecorator);
  }

  get hasMetaDecorator() {
    return this.decorators.find((d) => d.isMetaDecorator);
  }
}

export default EOProp;
