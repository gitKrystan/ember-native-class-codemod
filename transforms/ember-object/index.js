"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parser = void 0;
const path_1 = __importDefault(require("path"));
const codemod_cli_1 = require("codemod-cli");
const parse_helper_1 = require("../helpers/parse-helper");
const is_record_1 = require("../helpers/is-record");
const DEFAULT_OPTIONS = {
    decorators: true,
    classFields: true,
    classicDecorator: true,
    quote: 'single',
};
const transformer = function (file, api) {
    const extension = path_1.default.extname(file.path);
    if (!['.js', '.ts'].includes(extension.toLowerCase())) {
        // do nothing on non-js/ts files
        return;
    }
    const j = api.jscodeshift;
    const cliOptions = (0, codemod_cli_1.getOptions)();
    if (!(0, is_record_1.isRecord)(cliOptions)) {
        throw new Error('Could not parse CLI options.');
    }
    const options = Object.assign({}, DEFAULT_OPTIONS, cliOptions);
    let { source } = file;
    const root = j(source);
    const replaced = (0, parse_helper_1.replaceEmberObjectExpressions)(j, root, file.path, options);
    if (replaced) {
        source = root.toSource({
            quote: options.quotes || options.quote,
        });
    }
    return source;
};
exports.default = transformer;
// Set the parser, needed for supporting decorators
exports.parser = 'flow';
