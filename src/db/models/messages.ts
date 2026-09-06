import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';
import { groups } from './groups';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').references(() => users.id).notNull(),
  receiverId: integer('receiver_id').references(() => users.id), // Nullable if group message
  groupId: integer('group_id').references(() => groups.id),       // Nullable if private message
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});