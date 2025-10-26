-- Newsletter queue table for managing batch sending
CREATE TABLE IF NOT EXISTS newsletter_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  selected_publication_ids TEXT, -- JSON array
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sending', 'completed', 'failed')),
  total_recipients INTEGER NOT NULL,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  completed_at INTEGER
);

-- Newsletter recipients tracking table
CREATE TABLE IF NOT EXISTS newsletter_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  newsletter_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'sent', 'failed')),
  sent_at INTEGER,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (newsletter_id) REFERENCES newsletter_queue(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_newsletter_queue_status ON newsletter_queue(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_newsletter_id ON newsletter_recipients(newsletter_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_status ON newsletter_recipients(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_recipients_user_id ON newsletter_recipients(user_id);
