#!/usr/bin/env node

/**
 * Script to parse SRH Journal Officiel texts and insert them into the publications table
 * Usage: node scripts/parse_srh_textes.js [input_file]
 */

const fs = require('fs');
const path = require('path');
const { fileURLToPath } = require('url');

// Import database connection
const { getDb } = require('../api/lib/turso.js');

// Since we can't import ES modules directly, we'll create the schema here
// This matches the publications schema we updated
const publicationsSchema = {
  id: 'INTEGER PRIMARY KEY AUTOINCREMENT',
  title: 'TEXT NOT NULL',
  content: 'TEXT NOT NULL',
  tags: 'TEXT DEFAULT "[]"', // JSON array
  pubdate: 'INTEGER NOT NULL', // timestamp
  subscribersonly: 'INTEGER DEFAULT 0', // boolean
  homepage: 'INTEGER DEFAULT 1', // boolean
  picture: 'TEXT', // Base64 encoded image data
  attachment_ids: 'TEXT DEFAULT "[]"', // JSON array
  type: 'TEXT NOT NULL DEFAULT "publication"',
  created_at: 'INTEGER NOT NULL',
  updated_at: 'INTEGER NOT NULL'
};

/**
 * Parse JO texts from various input formats
 * Supports:
 * - Plain text files with line-separated entries
 * - CSV files with title, date, description columns
 * - JSON files with structured data
 */
class JOTextParser {
  constructor() {
    this.defaultPicture = this.loadDefaultPicture();
  }

  /**
   * Load the default JO picture as base64
   */
  loadDefaultPicture() {
    try {
      const imagePath = path.join(__dirname, '..', 'src', 'assets', 'images', 'jo.gif');
      if (fs.existsSync(imagePath)) {
        const imageBuffer = fs.readFileSync(imagePath);
        return `data:image/gif;base64,${imageBuffer.toString('base64')}`;
      }
    } catch (error) {
      console.warn('Could not load default JO image:', error.message);
    }
    return null;
  }

  /**
   * Parse a plain text file with line-separated entries
   */
  parseTextFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    return lines.map((line, index) => ({
      title: line.trim(),
      content: null, // As requested
      tags: ['Journal Officiel'],
      pubdate: new Date().getTime(), // Current timestamp
      subscribersonly: false,
      homepage: true,
      picture: this.defaultPicture,
      type: 'jo',
      source: `line_${index + 1}`
    }));
  }

  /**
   * Parse a CSV file with columns: title, date, description, etc.
   */
  parseCsvFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    
    if (lines.length === 0) return [];
    
    // Assume first line is header
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const titleIndex = headers.findIndex(h => h.includes('title') || h.includes('titre'));
    const dateIndex = headers.findIndex(h => h.includes('date'));
    const descIndex = headers.findIndex(h => h.includes('desc') || h.includes('content'));
    
    return lines.slice(1).map((line, index) => {
      const columns = line.split(',').map(c => c.trim());
      
      let pubdate = new Date().getTime();
      if (dateIndex >= 0 && columns[dateIndex]) {
        const parsedDate = new Date(columns[dateIndex]);
        if (!isNaN(parsedDate.getTime())) {
          pubdate = parsedDate.getTime();
        }
      }
      
      return {
        title: columns[titleIndex] || `Texte JO ${index + 1}`,
        content: null, // As requested
        tags: ['Journal Officiel'],
        pubdate,
        subscribersonly: false,
        homepage: true,
        picture: this.defaultPicture,
        type: 'jo',
        source: `csv_row_${index + 1}`
      };
    });
  }

  /**
   * Parse a JSON file with structured JO data
   */
  parseJsonFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content);
    
    const items = Array.isArray(data) ? data : [data];
    
    return items.map((item, index) => {
      let pubdate = new Date().getTime();
      if (item.date || item.pubdate) {
        const dateStr = item.date || item.pubdate;
        const parsedDate = new Date(dateStr);
        if (!isNaN(parsedDate.getTime())) {
          pubdate = parsedDate.getTime();
        }
      }
      
      return {
        title: item.title || item.name || `Texte JO ${index + 1}`,
        content: null, // As requested
        tags: item.tags || ['Journal Officiel'],
        pubdate,
        subscribersonly: item.subscribersonly || false,
        homepage: item.homepage !== undefined ? item.homepage : true,
        picture: item.picture || this.defaultPicture,
        type: 'jo',
        source: `json_item_${index + 1}`
      };
    });
  }

  /**
   * Auto-detect file format and parse accordingly
   */
  parseFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    console.log(`Parsing file: ${filePath} (${ext})`);
    
    switch (ext) {
      case '.csv':
        return this.parseCsvFile(filePath);
      case '.json':
        return this.parseJsonFile(filePath);
      case '.txt':
      default:
        return this.parseTextFile(filePath);
    }
  }

  /**
   * Generate sample data for testing
   */
  generateSampleData() {
    const sampleTitles = [
      "Arrêté du 15 janvier 2025 relatif aux conditions d'exercice de la radiologie",
      "Décret n° 2025-001 modifiant les dispositions relatives aux praticiens hospitaliers",
      "Circulaire DGS/PP2/2025/001 relative à l'organisation des services de radiologie",
      "Arrêté du 20 janvier 2025 fixant les tarifs de la permanence des soins",
      "Décret n° 2025-002 portant statut particulier des radiologues hospitaliers"
    ];

    return sampleTitles.map((title, index) => ({
      title,
      content: null,
      tags: ['Journal Officiel', 'Réglementation'],
      pubdate: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).getTime(), // Spread over last 5 days
      subscribersonly: false,
      homepage: true,
      picture: this.defaultPicture,
      type: 'jo',
      source: `sample_${index + 1}`
    }));
  }
}

/**
 * Insert parsed data into the publications table
 */
async function insertIntoDatabase(items) {
  try {
    const db = await getDb();
    
    console.log(`Inserting ${items.length} JO texts into database...`);
    
    for (const item of items) {
      const now = Date.now();
      
      // Use raw SQL to ensure compatibility
      const query = `
        INSERT INTO publications (
          title, content, tags, pubdate, subscribersonly, homepage, 
          picture, attachment_ids, type, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        item.title,
        item.content,
        JSON.stringify(item.tags),
        item.pubdate,
        item.subscribersonly ? 1 : 0,
        item.homepage ? 1 : 0,
        item.picture,
        JSON.stringify([]), // Empty attachment_ids array
        item.type,
        now,
        now
      ];
      
      await db.run(query, values);
      console.log(`✓ Inserted: ${item.title}`);
    }
    
    console.log(`Successfully inserted ${items.length} JO texts.`);
    
  } catch (error) {
    console.error('Database insertion failed:', error);
    throw error;
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    const args = process.argv.slice(2);
    const parser = new JOTextParser();
    
    let items = [];
    
    if (args.length > 0) {
      const inputFile = args[0];
      
      if (!fs.existsSync(inputFile)) {
        console.error(`Error: Input file '${inputFile}' does not exist.`);
        process.exit(1);
      }
      
      items = parser.parseFile(inputFile);
    } else {
      console.log('No input file provided. Generating sample data for testing...');
      items = parser.generateSampleData();
    }
    
    if (items.length === 0) {
      console.log('No items to insert.');
      return;
    }
    
    console.log(`Parsed ${items.length} JO texts:`);
    items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.title}`);
    });
    
    // Confirm before inserting
    if (process.env.NODE_ENV !== 'test') {
      console.log('\nPress Ctrl+C to cancel, or press Enter to continue...');
      await new Promise(resolve => {
        process.stdin.once('data', resolve);
      });
    }
    
    await insertIntoDatabase(items);
    
    console.log('\n✅ JO texts parsing and insertion completed successfully!');
    console.log('\nYou can now view them at: /publications?type=jo');
    
  } catch (error) {
    console.error('❌ Error during execution:', error);
    process.exit(1);
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { JOTextParser, insertIntoDatabase, main };
}

// Run if called directly
if (require.main === module) {
  main();
}