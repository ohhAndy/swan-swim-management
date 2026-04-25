import { HttpAdapterHost, NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import helmet from "helmet";
import compression from "compression";
import { PrismaClientExceptionFilter } from "./common/filters/prisma-client-exception.filter";
import { ZodValidationPipe } from "nestjs-zod";
import { json, urlencoded } from "express";

(BigInt.prototype as any).toJSON = function () {
  return this.toString(); // Serialize BigInt IDs as strings
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit for report card images
  app.use(json({ limit: "50mb" }));
  app.use(urlencoded({ extended: true, limit: "50mb" }));

  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
  app.useGlobalPipes(new ZodValidationPipe());

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  });
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}
bootstrap();
