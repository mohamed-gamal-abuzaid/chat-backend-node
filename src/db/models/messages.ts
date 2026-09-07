import { pgTable, serial, text, integer, timestamp, varchar } from 'drizzle-orm/pg-core';
import { users } from './users';
import { groups } from './groups';

export const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  senderId: integer('sender_id').notNull(),
  receiverId: integer('receiver_id'),
  groupId: integer('group_id'),
  content: text('content'),
  mediaUrl: text('media_url'),
  type: varchar('type', { length: 20 }).default('text'),
  status: varchar('status', { length: 20 }).default('sent'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow(),
});