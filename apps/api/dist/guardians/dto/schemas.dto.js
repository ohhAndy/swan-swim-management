"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchGuardianSchema = exports.updateGuardianSchema = exports.createGuardianSchema = exports.addressSchema = void 0;
const zod_1 = require("zod");
const phoneRegex = /^\d{3}[-\s]\d{3}[-\s]\d{4}$/;
exports.addressSchema = zod_1.z.object({
    streetNumber: zod_1.z.string().min(1, "Street number required"),
    streetName: zod_1.z.string().min(1, "Street name required"),
    unit: zod_1.z.string().min(1).optional().transform(v => v || undefined),
    city: zod_1.z.string().min(1),
    province: zod_1.z.string().min(1),
    postalCode: zod_1.z.string().min(3).max(12),
    countryCode: zod_1.z.string().length(2).transform(s => s.toUpperCase()),
});
exports.createGuardianSchema = zod_1.z.object({
    fullName: zod_1.z.string().min(1).max(120),
    shortCode: zod_1.z.string().min(1).max(32).optional(),
    email: zod_1.z.email(),
    phone: zod_1.z.string().regex(phoneRegex, "Invalid phone number"),
    address: exports.addressSchema.optional(),
    notes: zod_1.z.string().max(1000).optional(),
});
exports.updateGuardianSchema = exports.createGuardianSchema.partial();
exports.searchGuardianSchema = zod_1.z.object({
    query: zod_1.z.string().optional(),
    page: zod_1.z.coerce.number().min(1).default(1),
    pageSize: zod_1.z.coerce.number().min(1).max(100).default(20),
});
