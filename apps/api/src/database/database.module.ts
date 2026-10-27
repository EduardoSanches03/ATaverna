import { type DynamicModule, Global, Inject, Logger, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { poolLimits } from './pool-limits.js';
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
        { provide: POOL, useFactory: () => createPool(databaseUrl) },
        { provide: DATABASE, inject: [POOL], useFactory: (pool: pg.Pool) => drizzle(pool, { schema }) },
      ],
      exports: [DATABASE],
    };
  }

  async onApplicationShutdown() {
    await this.pool.end();
  }
}

function createPool(databaseUrl: string): pg.Pool {
  const logger = new Logger('Database');
  const pool = new pg.Pool({ connectionString: databaseUrl, ...poolLimits });
  // Sem este listener, um erro numa conexão ociosa (ex.: restart do Postgres) derruba o processo.
  // O pool já descarta a conexão quebrada e abre outra na próxima query.
  pool.on('error', (error) => {
    logger.error(`Conexão ociosa com o banco caiu: ${error.message}`);
  });
  return pool;
}
