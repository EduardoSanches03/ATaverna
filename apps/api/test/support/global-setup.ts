import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import type { TestProject } from 'vitest/node';
import { runMigrations } from '../../src/database/migrate.js';

let container: StartedPostgreSqlContainer;

export async function setup(project: TestProject) {
  container = await new PostgreSqlContainer('postgres:17-alpine').start();
  const databaseUrl = container.getConnectionUri();
  await runMigrations(databaseUrl);
  project.provide('databaseUrl', databaseUrl);
}

export async function teardown() {
  await container?.stop();
}

declare module 'vitest' {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}
