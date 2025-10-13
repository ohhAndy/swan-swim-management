"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferEnrollmentSchema = void 0;
const zod_1 = require("zod");
exports.transferEnrollmentSchema = zod_1.z.object({
    targetOfferingId: zod_1.z.string().min(1, "Target offering ID is required"),
    skippedSessionIds: zod_1.z.array(zod_1.z.string()).default([]),
    transferNotes: zod_1.z.string().optional(),
});
