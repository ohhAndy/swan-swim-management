"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.d2iso = exports.b2s = void 0;
//Bigint to String
const b2s = (x) => x.toString();
exports.b2s = b2s;
//Date to ISOString
const d2iso = (d) => d.toISOString();
exports.d2iso = d2iso;
