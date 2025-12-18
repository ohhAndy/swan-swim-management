"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateTermSchema = exports.ClassTemplateSchema = void 0;
const zod_1 = require("zod");
exports.ClassTemplateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    weekday: zod_1.z.number().int().min(0).max(6),
    startTime: zod_1.z.string().regex(/^\d{2}:\d{2}$/),
    duration: zod_1.z.number().int().min(15).max(240),
    capacity: zod_1.z.number().int().min(1).max(50),
    notes: zod_1.z.string().trim().optional(),
});
exports.CreateTermSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    slug: zod_1.z.string().min(1).optional(),
    startDate: zod_1.z.preprocess((val) => new Date(val), zod_1.z.date()),
    endDate: zod_1.z.preprocess((val) => new Date(val), zod_1.z.date()),
    weeks: zod_1.z.number().int().min(1).max(20).default(8),
    templates: zod_1.z.array(exports.ClassTemplateSchema).min(1),
});
