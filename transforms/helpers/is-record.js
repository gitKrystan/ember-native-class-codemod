"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRecord = void 0;
/** Checks if the given value is a `Record<string, unknown>`. */
function isRecord(value) {
    return value !== null && typeof value === 'object';
}
exports.isRecord = isRecord;
