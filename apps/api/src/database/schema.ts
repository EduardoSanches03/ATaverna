import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// As tabelas do domínio entram aqui conforme cada ticket as introduz.

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
