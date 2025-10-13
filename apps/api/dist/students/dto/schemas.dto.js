"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchStudentsSchema = exports.updateStudentSchema = exports.createStudentSchema = void 0;
const zod_1 = require("zod");
exports.createStudentSchema = zod_1.z.object({
    guardianId: zod_1.z.string(),
    shortCode: zod_1.z.string().min(1).max(32).optional(),
    firstName: zod_1.z.string().min(1).max(64),
    lastName: zod_1.z.string().min(1).max(64),
    level: zod_1.z.string().optional(),
    birthdate: zod_1.z.coerce.date().optional(),
});
exports.updateStudentSchema = exports.createStudentSchema.partial();
exports.searchStudentsSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    pageSize: zod_1.z.coerce.number().min(1).max(100).default(20),
    guardianId: zod_1.z.string().optional(),
    enrollmentStatus: zod_1.z.enum(["active", "inactive"]).optional(),
    level: zod_1.z.string().optional(),
});
