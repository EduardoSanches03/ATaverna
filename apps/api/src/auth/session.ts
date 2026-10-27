import { Inject, Injectable } from '@nestjs/common';
import type { CookieOptions, Request, Response } from 'express';
import { jwtVerify, SignJWT } from 'jose';

export const SESSION_OPTIONS = Symbol('SESSION_OPTIONS');

export interface SessionOptions {
  secret: string;
  secureCookie: boolean;
}

const cookieName = 'session';
const maxAgeSeconds = 30 * 24 * 60 * 60;

export interface Session {
  userId: string;
}

@Injectable()
export class SessionService {
  private readonly key: Uint8Array;
  private readonly cookieOptions: CookieOptions;

  constructor(@Inject(SESSION_OPTIONS) options: SessionOptions) {
    this.key = new TextEncoder().encode(options.secret);
    this.cookieOptions = { httpOnly: true, secure: options.secureCookie, sameSite: 'lax', path: '/' };
  }

  async start(response: Response, session: Session): Promise<void> {
    const token = await new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(session.userId)
      .setIssuedAt()
      .setExpirationTime(`${maxAgeSeconds}s`)
      .sign(this.key);
    response.cookie(cookieName, token, { ...this.cookieOptions, maxAge: maxAgeSeconds * 1000 });
  }

  end(response: Response): void {
    response.clearCookie(cookieName, this.cookieOptions);
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
