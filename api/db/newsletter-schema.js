const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Newsletter queue table
const newsletterQueue = sqliteTable('newsletter_queue', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(), // Delta JSON
  selectedPublicationIds: text('selected_publication_ids', { mode: 'json' }).$type(),
  status: text('status', { enum: ['draft', 'pending', 'sending', 'completed', 'failed'] }).notNull().default('draft'),
  totalRecipients: integer('total_recipients').notNull(),
  sentCount: integer('sent_count').notNull().default(0),
  failedCount: integer('failed_count').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }),
});

// Newsletter recipients tracking table
const newsletterRecipients = sqliteTable('newsletter_recipients', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  newsletterId: integer('newsletter_id').notNull(), // FK to newsletter_queue
  userId: integer('user_id').notNull(), // FK to users
  email: text('email').notNull(),
  status: text('status', { enum: ['pending', 'sent', 'failed'] }).notNull().default('pending'),
  sentAt: integer('sent_at', { mode: 'timestamp_ms' }),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

module.exports = {
  newsletterQueue,
  newsletterRecipients
};
