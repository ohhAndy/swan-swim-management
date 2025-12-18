"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSkipSchema = void 0;
const zod_1 = require("zod");
exports.addSkipSchema = zod_1.z.object({
    classSessionId: zod_1.z.string().min(1),
    reason: zod_1.z.string().max(500).optional(),
});
