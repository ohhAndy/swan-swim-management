import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { HttpAdapterHost, Reflector } from "@nestjs/core";
import { ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "../../src/app.module";
import { PrismaClientExceptionFilter } from "../../src/common/filters/prisma-client-exception.filter";
import { SupabaseAuthGuard } from "../../src/auth/supabase-auth.guard";
import { PrismaService } from "../../src/prisma/prisma.service";
import { IS_PUBLIC_KEY } from "../../src/auth/public.decorator";

export async function createTestApp(): Promise<{ app: INestApplication; prisma: PrismaService }> {
  const reflector = new Reflector();

  // Mock SupabaseAuthGuard globally
  jest.spyOn(SupabaseAuthGuard.prototype, "canActivate").mockImplementation((context: ExecutionContext) => {
    const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    if (request.headers["x-mock-unauthorized"]) {
      if (isPublic) return Promise.resolve(true);
      throw new UnauthorizedException("Mocked unauthorized");
    }
    
    request.user = { 
      authId: request.headers["x-mock-auth-id"] || "test-admin", 
      email: request.headers["x-mock-email"] || "admin@test.com" 
    };
    return Promise.resolve(true);
  });

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  const httpAdapter = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));
  app.useGlobalPipes(new ZodValidationPipe());
  
  await app.init();
  const prisma = app.get(PrismaService);

  return { app, prisma };
}
