"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollWithSkipSchema = void 0;
const zod_1 = require("zod");
exports.EnrollWithSkipSchema = zod_1.z.object({
    studentId: zod_1.z.string().min(1),
    offeringId: zod_1.z.string().min(1),
    skippedDates: zod_1.z.array(zod_1.z.string()).min(0),
    classRatio: zod_1.z.string().min(1),
});
