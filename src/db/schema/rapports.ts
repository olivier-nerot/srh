import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const rapports = sqliteTable('rapports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  content: text('content'),
  year: text('year'),
  document: integer('document'), // references documents.id but avoiding circular import
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});