import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const publications = sqliteTable('publications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(), // HTML content
  tags: text('tags', { mode: 'json' }).$type<string[]>().default([]),
  pubdate: integer('pubdate', { mode: 'timestamp' }).notNull(),
  subscribersonly: integer('subscribersonly', { mode: 'boolean' }).notNull().default(false),
  homepage: integer('homepage', { mode: 'boolean' }).notNull().default(true),
  picture: text('picture'), // Base64 encoded image data
  attachmentIds: text('attachment_ids', { mode: 'json' }).$type<number[]>().default([]),
  type: text('type', { enum: ['publication', 'communique', 'jo', 'rapport'] }).notNull().default('publication'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});