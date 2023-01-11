import { Transform } from 'jscodeshift';

import path from 'path';
import { getOptions } from 'codemod-cli';
import { replaceEmberObjectExpressions } from '../helpers/parse-helper';
import { isRecord } from '../helpers/is-record';

export interface Options {
  decorators?: boolean;
  classFields?: boolean;
  classicDecorator?: boolean;
  quote?: 'single' | 'double';
  quotes?: 'single' | 'double';
  /** @private */
  runtimeData?: unknown;
}

const DEFAULT_OPTIONS = {
  decorators: true,
  classFields: true,
  classicDecorator: true,
  quote: 'single',
};

const transformer: Transform = function (file, api) {
  const extension = path.extname(file.path);

  if (!['.js', '.ts'].includes(extension.toLowerCase())) {
    // do nothing on non-js/ts files
    return;
  }

  const j = api.jscodeshift;
  const cliOptions = getOptions();
  if (!isRecord(cliOptions)) {
    throw new Error('Could not parse CLI options.');
  }
  const options = Object.assign({}, DEFAULT_OPTIONS, cliOptions as Options);
  let { source } = file;

  const root = j(source);

  const replaced = replaceEmberObjectExpressions(j, root, file.path, options);
  if (replaced) {
    source = root.toSource({
      quote: options.quotes || options.quote,
    });
  }
  return source;
};

export default transformer;

// Set the parser, needed for supporting decorators
export const parser = 'flow';
