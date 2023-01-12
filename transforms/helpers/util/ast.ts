import type * as ast from 'ast-types/gen/kinds';

export interface Property {
  readonly hasDecorators: boolean;
  readonly decoratorNames: string[];

  readonly value: {
    readonly callee: {
      name?: string;
      object?: {
        callee: {
          name: string;
        };
      };
    };
  };
}

export interface HasDecorators {
  decorators: Decorator[];
}

export interface Decorator {}

export interface Expression {
  readonly arguments?: unknown;
  readonly callee: {
    readonly property?: Property;
  };
}

export interface ArrayClassDecoratorProp {
  readonly type: 'ArrayExpression';
  readonly classDecoratorName: string;
  readonly value: {
    readonly elements: ArgumentParam[];
  };
}

export interface OtherClassDecoratorProp {
  // FIXME: What is the actual name
  readonly type: 'Other';
  readonly classDecoratorName: string;
  readonly value: ArgumentParam;
}

export type ClassDecoratorProp = ArrayClassDecoratorProp | OtherClassDecoratorProp;

export type ArgumentParam = ast.ExpressionKind | ast.SpreadElementKind;

type HasProperty = Extract<ast.ExpressionKind, { property: unknown }>;

export type HasCallee = (
  | Extract<ast.ExpressionKind, { callee: unknown }>
  | Extract<ast.ExpressionKind, { arguments: unknown }>
) & {
  callee?: {
    property?: MemberProperty;
  };
  arguments?: ArgumentParam[];
};
export type MemberProperty = ast.IdentifierKind | ast.ExpressionKind;
