/* eslint-disable @typescript-eslint/no-empty-interface, jsdoc/require-jsdoc */

import type { Type } from 'ast-types/lib/types';
import type {
  ASTNode,
  ArrayExpression,
  ArrayPattern,
  AssignmentPattern,
  CallExpression,
  FunctionExpression,
  Identifier,
  ImportDeclaration,
  MemberExpression,
  Node,
  ObjectExpression,
  ObjectMethod,
  ObjectPattern,
  ObjectProperty,
  PropertyPattern,
  RestElement,
  SpreadElementPattern,
  SpreadPropertyPattern,
  StringLiteral,
  TSParameterProperty,
  ThisExpression,
  ASTPath as _ASTPath,
  Collection as _Collection,
} from 'jscodeshift';
import { LAYOUT_DECORATOR_NAME } from './util/index';
import { isRecord } from './util/types';

export type {
  ASTNode,
  CallExpression,
  ClassDeclaration,
  ClassMethod,
  ClassProperty,
  CommentLine,
  Declaration,
  Decorator,
  FunctionExpression,
  Identifier,
  ImportDeclaration,
  ImportDefaultSpecifier,
  ImportSpecifier,
  MemberExpression,
  VariableDeclaration,
} from 'jscodeshift';

export interface ASTPath<N extends ASTNode = ASTNode> extends _ASTPath<N> {
  parentPath: ASTPath | null | undefined;
}

export interface Collection<N extends Node | ASTNode = ASTNode>
  extends _Collection<N> {}

export function isPath(u: unknown): u is ASTPath & { parentPath?: ASTPath } {
  return isRecord(u) && isRecord(u['value']);
}

export function isNode<T extends ASTNode['type'] = ASTNode['type']>(
  u: unknown,
  type?: T
): u is Extract<ASTNode, { type: T }> {
  return (
    isRecord(u) &&
    typeof u['type'] === 'string' &&
    (!type || u['type'] === type)
  );
}

export interface EOExtendExpression extends CallExpression {
  callee: EOExtendExpressionCallee;
  arguments: Array<EOExpression | EOMixin>;
}

export function isEOExtendExpression(u: unknown): u is EOExtendExpression {
  return (
    isNode(u, 'CallExpression') &&
    isEOExtendExpressionCallee(u.callee) &&
    u.arguments.every(
      (argument) => isEOExpression(argument) || isEOMixin(argument)
    )
  );
}

interface EOExtendExpressionCallee extends MemberExpression {
  object: Identifier;
  property: EOExtendExpressionCalleeProperty;
}

function isEOExtendExpressionCallee(u: unknown): u is EOExtendExpressionCallee {
  return (
    (isNode(u, 'MemberExpression') || isNode(u, 'OptionalMemberExpression')) &&
    isNode(u.object, 'Identifier') &&
    isEOExtendExpressionCalleeProperty(u.property)
  );
}

interface EOExtendExpressionCalleeProperty extends Identifier {
  name: 'extend';
}

function isEOExtendExpressionCalleeProperty(
  u: unknown
): u is EOExtendExpressionCalleeProperty {
  return isNode(u, 'Identifier') && u.name === 'extend';
}

export interface EOExpression extends ObjectExpression {
  properties: Array<EOProperty | EOMethod>;
}

export function isEOExpression(u: unknown): u is EOExpression {
  return (
    isNode(u, 'ObjectExpression') &&
    u.properties.every(
      (property) => isEOProperty(property) || isEOMethod(property)
    )
  );
}

export interface EOMixin extends Identifier {}

function isEOMixin(u: unknown): u is EOMixin {
  return isNode(u, 'Identifier');
}

/** A top-level instance property in an Ember Object's ObjectExpression */
export interface EOProperty extends ObjectProperty {
  key: Identifier;
}

function isEOProperty(u: unknown): u is EOProperty {
  return isNode(u, 'ObjectProperty') && isNode(u.key, 'Identifier');
}

/** A top-level instance property in an Ember Object's ObjectExpression */
export interface EOMethod extends ObjectMethod {
  key: Identifier;
}

export function isEOMethod(u: unknown): u is EOMethod {
  return isNode(u, 'ObjectMethod') && isNode(u.key, 'Identifier');
}

export type EOPropertyForMethod = EOMethod | EOPropertyWithFunctionExpression;

export function isEOPropertyForMethod(u: unknown): u is EOPropertyForMethod {
  return isEOMethod(u) || isEOPropertyWithFunctionExpression(u);
}

interface EOPropertyWithFunctionExpression extends EOProperty {
  value: FunctionExpression;
}

export function isEOPropertyWithFunctionExpression(
  u: unknown
): u is EOPropertyWithFunctionExpression {
  return isEOProperty(u) && isNode(u.value, 'FunctionExpression');
}

export interface EOPropertyWithCallExpression extends EOProperty {
  value: EOCallExpression;
}

export function isEOPropertyWithCallExpression(
  u: unknown
): u is EOPropertyWithCallExpression {
  return isEOProperty(u) && isEOCallExpression(u.value);
}

/** A CallExpression value for an EOProperty */
export interface EOCallExpression extends CallExpression {
  callee: Identifier | EOMemberExpressionForModifier;
}

export function isEOCallExpression(u: unknown): u is EOCallExpression {
  return (
    isNode(u, 'CallExpression') &&
    (isNode(u.callee, 'Identifier') ||
      isEOMemberExpressionForModifier(u.callee))
  );
}

export interface EOMemberExpressionForModifier extends MemberExpression {
  object: EOCallExpression;
}

export function isEOMemberExpressionForModifier(
  u: unknown
): u is EOMemberExpressionForModifier {
  return isNode(u, 'MemberExpression') && isEOCallExpression(u.object);
}

export interface EOCallExpressionInnerCallee extends CallExpression {
  callee: Identifier;
}

export function isEOCallExpressionInnerCallee(
  u: unknown
): u is EOCallExpressionInnerCallee {
  return isNode(u, 'CallExpression') && isNode(u.callee, 'Identifier');
}

/** An EOProperty that should be transformed into a class decorator */
export interface EOPropertyForClassDecorator extends EOProperty {
  value: EOClassDecoratorValue;
  key: EOClassDecoratorKey;
}

export function isEOPropertyForClassDecorator(
  u: unknown
): u is EOPropertyForClassDecorator {
  return (
    isEOProperty(u) &&
    isEOClassDecoratorValue(u.value) &&
    isEOClassDecoratorKey(u.key)
  );
}

export type EOClassDecoratorValue =
  | StringLiteral
  | ArrayExpression
  | Identifier;

function isEOClassDecoratorValue(u: unknown): u is EOClassDecoratorValue {
  return (
    isNode(u, 'StringLiteral') ||
    isNode(u, 'ArrayExpression') ||
    isNode(u, 'Identifier')
  );
}

interface EOClassDecoratorKey extends Identifier {
  name:
    | 'layout'
    | 'tagName'
    | 'classNames'
    | 'classNameBindings'
    | 'attributeBindings';
}

const ClassDecoratorPropNames = new Set([
  LAYOUT_DECORATOR_NAME,
  'tagName',
  'classNames',
  'classNameBindings',
  'attributeBindings',
]);

export function isEOClassDecoratorKey(u: unknown): u is EOClassDecoratorKey {
  return isNode(u, 'Identifier') && ClassDecoratorPropNames.has(u.name);
}

export interface EOPropertyWithActionsObject extends EOProperty {
  value: EOActionsObjectExpression;
  key: EOActionsObjectKey;
}

export function isEOPropertyForActionsObject(
  u: unknown
): u is EOPropertyWithActionsObject {
  return (
    isEOProperty(u) &&
    isEOActionsObjectExpression(u.value) &&
    isEOActionsObjectKey(u.key)
  );
}

interface EOActionsObjectExpression extends ObjectExpression {
  properties: Array<EOActionMethod | EOActionProperty>;
}

function isEOActionsObjectExpression(
  u: unknown
): u is EOActionsObjectExpression {
  return (
    isNode(u, 'ObjectExpression') &&
    u.properties.every(
      (property) => isEOActionMethod(property) || isEOActionProperty(property)
    )
  );
}

export interface EOActionMethod extends ObjectMethod {
  key: Identifier;
}

export function isEOActionMethod(u: unknown): u is EOActionMethod {
  return isNode(u, 'ObjectMethod') && isNode(u.key, 'Identifier');
}

export interface EOActionProperty extends ObjectProperty {
  key: Identifier;
  value: Identifier;
}

export function isEOActionProperty(u: unknown): u is EOActionProperty {
  return (
    isNode(u, 'ObjectProperty') &&
    isNode(u.key, 'Identifier') &&
    isNode(u.value, 'Identifier')
  );
}

interface EOActionsObjectKey extends Identifier {
  name: 'actions';
}

function isEOActionsObjectKey(u: unknown): u is EOActionsObjectKey {
  return isNode(u, 'Identifier') && u.name === 'actions';
}

export interface EOPropertySimple extends EOProperty {
  value: Exclude<
    EOProperty['value'],
    | ArrayPattern
    | AssignmentPattern
    | ObjectPattern
    | PropertyPattern
    | RestElement
    | SpreadElementPattern
    | SpreadPropertyPattern
    | TSParameterProperty
  >;
}

export function isEOPropertySimple(u: unknown): u is EOPropertySimple {
  return (
    isEOProperty(u) &&
    !u.value.type.includes('Pattern') &&
    u.value.type !== 'RestElement' &&
    u.value.type !== 'TSParameterProperty'
  );
}

interface EOActionInfiniteCall extends CallExpression {
  callee: EOActionInfiniteCallCallee;
}

export function makeEOActionInfiniteCallAssertion(
  name: string
): (u: unknown) => u is EOActionInfiniteCall {
  return function isEOActionInfiniteCallForName(
    u: unknown
  ): u is EOActionInfiniteCall {
    return isEOActionInfiniteCall(u, name);
  };
}

function isEOActionInfiniteCall(
  u: unknown,
  name?: string
): u is EOActionInfiniteCall {
  return (
    isNode(u, 'CallExpression') && isEOActionInfiniteCallCallee(u.callee, name)
  );
}

interface EOActionInfiniteCallCallee extends MemberExpression {
  object: ThisExpression;
  property: Identifier;
}

function isEOActionInfiniteCallCallee(
  u: unknown,
  name?: string
): u is EOActionInfiniteCallCallee {
  return (
    isNode(u, 'MemberExpression') &&
    isNode(u.object, 'ThisExpression') &&
    isNode(u.property, 'Identifier') &&
    (!name || u.property.name === name)
  );
}

interface EOActionInfiniteLiteral extends StringLiteral {
  value: string;
}

export function makeEOActionInfiniteLiteralAssertion(
  name: string
): (u: unknown) => u is EOActionInfiniteLiteral {
  return function isEOActionInfiniteLiteralForName(
    u: unknown
  ): u is EOActionInfiniteLiteral {
    return isEOActionInfiniteLiteral(u, name);
  };
}

function isEOActionInfiniteLiteral(
  u: unknown,
  name?: string
): u is EOActionInfiniteLiteral {
  return isNode(u, 'StringLiteral') && (!name || u.value === name);
}

export interface EOSuperExpression extends CallExpression {
  callee: EOSuperExpressionCallee;
}

export function isEOSuperExpression(u: unknown): u is EOSuperExpression {
  return isNode(u, 'CallExpression') && isEOSuperExpressionCallee(u.callee);
}

interface EOSuperExpressionCallee extends MemberExpression {
  property: Identifier & { name: '_super' };
}

function isEOSuperExpressionCallee(u: unknown): u is EOSuperExpressionCallee {
  return (
    isNode(u, 'MemberExpression') &&
    isNode(u.property, 'Identifier') &&
    u.property.name === '_super'
  );
}

export interface DecoratorImportDeclaration extends ImportDeclaration {
  source: StringLiteral;
}

export function makeDecoratorImportDeclarationAssertion(
  path: string
): (u: unknown) => u is DecoratorImportDeclaration {
  return function isDecoratorImportDeclarationForPath(
    u: unknown
  ): u is DecoratorImportDeclaration {
    return isDecoratorImportDeclaration(u, path);
  };
}

export function isDecoratorImportDeclaration(
  u: unknown,
  path?: string
): u is DecoratorImportDeclaration {
  return (
    isNode(u, 'ImportDeclaration') &&
    isDecoratorImportDeclarationSource(u.source, path)
  );
}

interface DecoratorImportDeclarationSource extends StringLiteral {}

function isDecoratorImportDeclarationSource(
  u: unknown,
  value?: string | undefined
): u is DecoratorImportDeclarationSource {
  return isNode(u, 'StringLiteral') && (!value || u.value === value);
}

/** Find nodes of a specific type within the nodes of this collection. */
export function findPaths<T extends ASTNode, M extends T>(
  collection: Collection,
  type: Type<T>,
  assertion: (v: unknown) => v is M
): Collection<M> {
  return collection.find(type as Type<M>, assertion);
}

/** Get the first path in a collection */
export function getFirstPath<T extends ASTNode>(
  collection: Collection<T>
): ASTPath<T> | undefined {
  return collection.length > 0 ? (collection.get() as ASTPath<T>) : undefined;
}