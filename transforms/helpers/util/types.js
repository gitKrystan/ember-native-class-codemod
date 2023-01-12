"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verified = exports.assert = exports.isString = exports.isRecord = void 0;
/** Checks if the given value is a `Record<string, unknown>`. */
function isRecord(value) {
    return value !== null && typeof value === 'object';
}
exports.isRecord = isRecord;
function isString(value) {
    return typeof value === 'string';
}
exports.isString = isString;
function assert(condition, message = 'Assertion Error') {
    if (!condition) {
        throw Error(message);
    }
}
exports.assert = assert;
function verified(value, condition, message = condition.name ? `Verification Error: ${condition.name}` : 'Verification Error') {
    assert(condition(value), message);
    return value;
}
exports.verified = verified;
