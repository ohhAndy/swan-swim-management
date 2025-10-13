import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { RolesGuard } from './roles.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SupabaseAuthGuard, RolesGuard],
  exports: [SupabaseAuthGuard, RolesGuard],
})
export class AuthModule {}