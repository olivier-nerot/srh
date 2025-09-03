import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Publications table
export const publications = sqliteTable('publications', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  tags: text('tags', { mode: 'json' }),
  pubdate: integer('pubdate', { mode: 'timestamp' }).notNull(),
  subscribersonly: integer('subscribersonly', { mode: 'boolean' }).notNull(),
  homepage: integer('homepage', { mode: 'boolean' }).notNull(),
  picture: text('picture'),
  attachmentIds: text('attachment_ids', { mode: 'json' }),
  type: text('type').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// JO Textes table
export const jotextes = sqliteTable('jotextes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  content: text('content').notNull(),
  year: text('year'),
  document: integer('document'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// FAQ table
export const faq = sqliteTable('faq', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  tags: text('tags', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Rapports table
export const rapports = sqliteTable('rapports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  content: text('content').notNull(),
  year: text('year'),
  document: integer('document'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Users table (from the initial migration)
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  name: text('name'),
  role: text('role').default('guest'),
  isadmin: integer('isadmin', { mode: 'boolean' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Documents table (from the initial migration)
export const documents = sqliteTable('documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  fileName: text('file_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  mimeType: text('mime_type'),
  category: text('category').notNull(),
  isPublic: integer('is_public', { mode: 'boolean' }).default(true),
  uploadedBy: integer('uploaded_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Articles table (from the initial migration)
export const articles = sqliteTable('articles', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  imageUrl: text('image_url'),
  category: text('category').notNull(),
  status: text('status').default('draft'),
  authorId: integer('author_id'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Liens table - NEW
export const liens = sqliteTable('liens', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  icon: text('icon').notNull(), // Icon identifier (Users, GraduationCap, Building)
  title: text('title').notNull(), // Link title/name
  description: text('description').notNull(), // Link description
  category: text('category').notNull(), // Group category
  url: text('url').notNull(), // Link URL
  logo: text('logo'), // Logo image URL/path (nullable - for backward compatibility)
  picture: text('picture'), // Base64 encoded logo image (nullable)
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});