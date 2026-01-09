import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const CurrentLocationId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    // Headers are usually lowercase in Node/Express
    const locationId = request.headers["x-location-id"];
    return locationId;
  }
);
