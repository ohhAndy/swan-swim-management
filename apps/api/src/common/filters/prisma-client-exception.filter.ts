import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
} from "@nestjs/common";
import { BaseExceptionFilter, HttpAdapterHost } from "@nestjs/core";
import { Prisma } from "@prisma/client";

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  constructor(protected readonly httpAdapterHost: HttpAdapterHost) {
    super(httpAdapterHost.httpAdapter);
  }

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    switch (exception.code) {
      case "P2002": {
        const target = exception.meta?.target;
        let message = "Unique constraint failed.";

        if (Array.isArray(target) && target.length > 0) {
          message = `Unique constraint failed on the fields: ${target.join(", ")}`;
        } else if (typeof target === "string") {
          message = `Unique constraint failed on the field: ${target}`;
        } else {
          message = "A record with this unique value already exists.";
        }

        // Use NestJS built-in exception structure for consistency
        const status = 409;
        response.status(status).json({
          statusCode: status,
          message: message,
          error: "Conflict",
        });
        break;
      }
      default:
        // Super handles unknown Prisma errors (usually 500)
        super.catch(exception, host);
        break;
    }
  }
}
