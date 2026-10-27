import { type DynamicModule, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthController } from './auth.controller.js';
import { SESSION_OPTIONS, type SessionOptions, SessionService } from './session.js';
import { SessionGuard } from './session.guard.js';

@Module({})
export class AuthModule {
  static forRoot(options: SessionOptions): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        { provide: SESSION_OPTIONS, useValue: options },
        SessionService,
        { provide: APP_GUARD, useClass: SessionGuard },
      ],
      controllers: [AuthController],
    };
  }
}
