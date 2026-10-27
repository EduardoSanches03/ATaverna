import type { HealthResponse } from '@ataverna/shared';
import { Controller, Get, Inject, Logger, ServiceUnavailableException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { Public } from '../auth/session.guard.js';
import { DATABASE, type Database } from '../database/database.module.js';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Public()
  @Get()
  async check(): Promise<HealthResponse> {
    try {
      await this.db.execute(sql`select 1`);
    } catch (error) {
      this.logger.error(
        `Healthcheck falhou: banco indisponível (${describe(error)})`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new ServiceUnavailableException({ status: 'error', database: 'unavailable' } satisfies HealthResponse);
    }
    return { status: 'ok', database: 'ok' };
  }
}

function describe(error: unknown): string {
  if (error instanceof Error) {
    // O driver do Postgres guarda o motivo real (ex.: ECONNREFUSED) na causa ou no código do erro.
    const cause = error.cause instanceof Error ? error.cause : error;
    const code = (cause as { code?: string }).code;
    return code ? `${code}: ${cause.message}` : cause.message;
  }
  return String(error);
}
