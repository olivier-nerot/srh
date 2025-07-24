const { getDb } = require('./lib/turso');
const { eq, asc } = require('drizzle-orm');
const { sqliteTable, text, integer } = require('drizzle-orm/sqlite-core');

// Define FAQ table directly
const faq = sqliteTable('faq', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  tags: text('tags', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    switch (req.method) {
      case 'GET':
        return await getAllFAQs(req, res);
      case 'POST':
        return await createFAQ(req, res);
      case 'PUT':
        return await updateFAQ(req, res);
      case 'DELETE':
        return await deleteFAQ(req, res);
      case 'PATCH':
        if (req.body.action === 'parseTags') {
          return await parseAllTags(req, res);
        }
        return res.status(400).json({ error: 'Invalid action' });
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('FAQ API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getAllFAQs(req, res) {
  try {
    const db = await getDb();
    const result = await db.select().from(faq).orderBy(asc(faq.id));
    return res.status(200).json({ success: true, faqs: result });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error fetching FAQs',
      faqs: []
    });
  }
}

async function createFAQ(req, res) {
  const { question, answer, tags, isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!question || !answer) {
    return res.status(400).json({ 
      success: false, 
      error: 'Question and answer are required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.insert(faq).values({
      question,
      answer,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return res.status(201).json({ success: true, faq: result[0] });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error creating FAQ' 
    });
  }
}

async function updateFAQ(req, res) {
  const { id, question, answer, tags, isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!id || !question || !answer) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID, question and answer are required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.update(faq)
      .set({
        question,
        answer,
        tags: tags || [],
        updatedAt: new Date(),
      })
      .where(eq(faq.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'FAQ not found' 
      });
    }

    return res.status(200).json({ success: true, faq: result[0] });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error updating FAQ' 
    });
  }
}

async function deleteFAQ(req, res) {
  const { id, isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  if (!id) {
    return res.status(400).json({ 
      success: false, 
      error: 'ID is required' 
    });
  }

  try {
    const db = await getDb();
    const result = await db.delete(faq)
      .where(eq(faq.id, id))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'FAQ not found' 
      });
    }

    return res.status(200).json({ success: true, message: 'FAQ deleted successfully' });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error deleting FAQ' 
    });
  }
}

async function parseAllTags(req, res) {
  const { isAdmin } = req.body;

  // Check if user is admin
  if (!isAdmin) {
    return res.status(403).json({ 
      success: false, 
      error: 'Access denied. Admin privileges required.' 
    });
  }

  try {
    const db = await getDb();
    
    // Get all FAQs
    const allFAQs = await db.select().from(faq);
    let updatedCount = 0;

    for (const faqItem of allFAQs) {
      // Extract tags from question using regex pattern [tag - tag - ...]
      const tagMatch = faqItem.question.match(/^\[([^\]]+)\]/);
      
      if (tagMatch) {
        // Split tags by ' - ' and clean them
        const extractedTags = tagMatch[1]
          .split(' - ')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0);

        if (extractedTags.length > 0) {
          // Remove the tag portion from the question
          const cleanedQuestion = faqItem.question.replace(/^\[([^\]]+)\]\s*/, '').trim();

          // Update the FAQ with extracted tags and cleaned question
          await db.update(faq)
            .set({
              question: cleanedQuestion,
              tags: extractedTags,
              updatedAt: new Date(),
            })
            .where(eq(faq.id, faqItem.id));

          updatedCount++;
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      message: `Successfully parsed tags for ${updatedCount} FAQs`,
      updatedCount
    });
  } catch (error) {
    console.error('Error parsing tags:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error parsing tags' 
    });
  }
}