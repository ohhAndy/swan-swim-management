import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

(BigInt.prototype as any).toJSON = function () {
  return this.toString(); // Serialize BigInt IDs as strings
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: ['http://localhost:3000','http://localhost:3001'] });
  await app.listen(process.env.PORT ? Number(process.env.PORT) : 3001);
}
bootstrap();