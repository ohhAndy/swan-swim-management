"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentStaffUser = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Contains authId and email
});
exports.CurrentStaffUser = (0, common_1.createParamDecorator)((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.staffUser; // Contains full staff user info with role
});
