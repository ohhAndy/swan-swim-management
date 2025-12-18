"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateMakeupAttendanceSchema = exports.UpsertAttendanceSchema = void 0;
const zod_1 = require("zod");
exports.UpsertAttendanceSchema = zod_1.z.object({
    classSessionId: zod_1.z.string().min(1),
    enrollmentId: zod_1.z.string().min(1),
    status: zod_1.z.enum(["present", "absent", "excused"]).nullable(),
    notes: zod_1.z.string().optional(),
});
exports.UpdateMakeupAttendanceSchema = zod_1.z.object({
    makeUpId: zod_1.z.string().min(1),
    status: zod_1.z.enum(["requested", "scheduled", "attended", "cancelled", "missed"]).nullable(),
});
