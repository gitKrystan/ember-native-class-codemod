import { default as j } from 'jscodeshift';
import type * as AST from '../../ast';
import { replaceMethodSuperExpression } from '../../transform-helper';
import AbstractEOProp from './abstract';

export default class EOFunctionExpressionProp extends AbstractEOProp<
  AST.EOFunctionExpressionProp,
  AST.ClassMethod
> {
  readonly isClassDecorator = false as const;

  protected readonly value = this.rawProp.value;

  protected override readonly supportsObjectLiteralDecorators = true;

  /**
   * Transform functions to class methods
   *
   * For example { foo: function() { }} --> { foo() { }}
   */
  build(): AST.ClassMethod {
    return replaceMethodSuperExpression(
      j.classMethod.from({
        kind: 'method',
        key: this.key,
        params: this.value.params,
        body: this.value.body,
        comments: this.comments,
        decorators: this.existingDecorators,
      }),
      this.replaceSuperWithUndefined
    );
  }
}
