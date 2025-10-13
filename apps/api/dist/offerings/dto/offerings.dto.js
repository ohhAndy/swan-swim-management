"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateOfferingSchema = void 0;
const zod_1 = require("zod");
exports.UpdateOfferingSchema = zod_1.z.object({
    title: zod_1.z.string(),
    notes: zod_1.z.string(),
});
