import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser, RequestStaffUser } from './auth.types';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Contains authId and email
  },
);

export const CurrentStaffUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): RequestStaffUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.staffUser; // Contains full staff user info with role
  },
);