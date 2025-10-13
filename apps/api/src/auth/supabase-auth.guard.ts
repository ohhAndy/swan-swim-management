import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private supabase;

  constructor(private reflector: Reflector) {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
    );
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No authorization token provided');
    }

    const token = authHeader.substring(7);

    try {
      // Verify JWT token with Supabase
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Attach user to request
      request.user = { authId: user.id, email: user.email };
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}