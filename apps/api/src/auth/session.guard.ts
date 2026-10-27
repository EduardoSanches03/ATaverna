import {
  type CanActivate,
  createParamDecorator,
  type ExecutionContext,
  Injectable,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { type Session, SessionService } from './session.js';

const PUBLIC = 'public';

// Libera a rota do guard global: só cadastro, login e healthcheck.
export const Public = () => SetMetadata(PUBLIC, true);

type AuthenticatedRequest = Request & { session?: Session };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly sessions: SessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC, [context.getHandler(), context.getClass()])) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const session = await this.sessions.read(request);
    if (!session) {
      throw new UnauthorizedException({ message: 'Não autenticado' });
    }
    request.session = session;
    return true;
  }
}

// A sessão que o guard validou; só existe em rotas protegidas.
export const CurrentSession = createParamDecorator((_data: unknown, context: ExecutionContext): Session => {
  return context.switchToHttp().getRequest<AuthenticatedRequest>().session!;
});
