import { Inject, Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { jwtVerify, SignJWT } from 'jose';

export const SESSION_SECRET = Symbol('SESSION_SECRET');

const cookieName = 'session';
const maxAgeSeconds = 30 * 24 * 60 * 60;

const cookieOptions: CookieOptions = { httpOnly: true, secure: true, sameSite: 'lax', path: '/' };

export interface Session {
  userId: string;
}

@Injectable()
export class SessionService {
  private readonly key: Uint8Array;

  constructor(@Inject(SESSION_SECRET) secret: string) {
    this.key = new TextEncoder().encode(secret);
  }

  async start(response: Response, session: Session): Promise<void> {
    const token = await new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(session.userId)
      .setIssuedAt()
      .setExpirationTime(`${maxAgeSeconds}s`)
      .sign(this.key);
    response.cookie(cookieName, token, { ...cookieOptions, maxAge: maxAgeSeconds * 1000 });
  }

  end(response: Response): void {
    response.clearCookie(cookieName, cookieOptions);
  }

  // A sessão do cookie, ou null quando falta, expirou ou a assinatura não confere.
  async read(request: Request): Promise<Session | null> {
    const token: unknown = request.cookies?.[cookieName];
    if (typeof token !== 'string') {
      return null;
    }
    try {
      const { payload } = await jwtVerify(token, this.key, { algorithms: ['HS256'] });
      return payload.sub ? { userId: payload.sub } : null;
    } catch {
      return null;
    }
  }
}
