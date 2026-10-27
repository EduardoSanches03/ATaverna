import type { HealthResponse } from '@ataverna/shared';
import { Controller, Get, Inject } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DATABASE, type Database } from '../database/database.module.js';

@Controller('health')
export class HealthController {
  constructor(@Inject(DATABASE) private readonly db: Database) {}

  @Get()
  async check(): Promise<HealthResponse> {
    await this.db.execute(sql`select 1`);
    return { status: 'ok', database: 'ok' };
  }
}
