import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  imageUrl: text('image_url'),
  category: text('category', { enum: ['news', 'publication', 'communique', 'rapport'] }).notNull(),
  status: text('status', { enum: ['draft', 'published', 'archived'] }).default('draft'),
  authorId: integer('author_id').references(() => users.id),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => Date.now()),
});

import { users } from './users';