import { randomUUID } from 'node:crypto';
import { credentialsSchema, registerSchema, type UserResponse } from '@ataverna/shared';
import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Inject,
  Post,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Response } from 'express';
import { DATABASE, type Database } from '../database/database.module.js';
import { users } from '../database/schema.js';
import { parseBody } from '../validation.js';
import { hashPassword, verifyPassword } from './password.js';
import { type Session, SessionService } from './session.js';
import { CurrentSession, Public } from './session.guard.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(DATABASE) private readonly db: Database,
    private readonly sessions: SessionService,
  ) {}

  private readonly dummyHash = hashPassword(randomUUID());

  @Public()
  @Post('register')
  async register(@Body() body: unknown, @Res({ passthrough: true }) response: Response): Promise<UserResponse> {
    const { username, password } = parseBody(registerSchema, body);
    const [user] = await this.db
      .insert(users)
      .values({ username, passwordHash: await hashPassword(password) })
      .onConflictDoNothing({ target: users.username })
      .returning({ id: users.id });
    if (!user) {
      throw new ConflictException({ message: 'Nome de usuário já está em uso' });
    }
    await this.sessions.start(response, { userId: user.id });
    return { username };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Res({ passthrough: true }) response: Response): Promise<UserResponse> {
    const { username, password } = parseBody(credentialsSchema, body);
    const [user] = await this.db.select().from(users).where(eq(users.username, username));
    // Sem Usuário, verifica contra um hash qualquer: o tempo de resposta não revela se o nome existe.
    const valid = await verifyPassword(password, user?.passwordHash ?? (await this.dummyHash));
    if (!user || !valid) {
      throw new UnauthorizedException({ message: 'Nome de usuário ou senha inválidos' });
    }
    await this.sessions.start(response, { userId: user.id });
    return { username: user.username };
  }

  // Público: quem tem um cookie expirado também precisa conseguir sair.
  @Public()
  @Post('logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response): void {
    this.sessions.end(response);
  }

  @Get('me')
  async me(@CurrentSession() session: Session): Promise<UserResponse> {
    const [user] = await this.db.select({ username: users.username }).from(users).where(eq(users.id, session.userId));
    // Token válido de um Usuário que não existe mais.
    if (!user) {
      throw new UnauthorizedException({ message: 'Não autenticado' });
    }
    return user;
  }
}
