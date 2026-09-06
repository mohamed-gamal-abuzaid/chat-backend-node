import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

export const groups = pgTable('groups', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  createdBy: integer('created_by').references(() => users.id).notNull(), // Admin creator
  createdAt: timestamp('created_at').defaultNow().notNull(),
});