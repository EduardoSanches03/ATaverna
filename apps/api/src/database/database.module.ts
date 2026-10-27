import { type DynamicModule, Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

export const DATABASE = Symbol('DATABASE');
const POOL = Symbol('POOL');

export type Database = NodePgDatabase<typeof schema>;

@Global()
@Module({})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(POOL) private readonly pool: pg.Pool) {}

  static forRoot(databaseUrl: string): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [
        { provide: POOL, useFactory: () => new pg.Pool({ connectionString: databaseUrl }) },
        { provide: DATABASE, inject: [POOL], useFactory: (pool: pg.Pool) => drizzle(pool, { schema }) },
      ],
      exports: [DATABASE],
    };
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}
