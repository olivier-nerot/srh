const { createClient } = require("@libsql/client/node");
const { drizzle } = require("drizzle-orm/libsql");

let db, turso;

async function initializeDb() {
  if (db) return { db, turso };
  
  try {
    const usersModule = await import("../../src/db/schema/users.js");
    const articlesModule = await import("../../src/db/schema/articles.js");
    const documentsModule = await import("../../src/db/schema/documents.js");
    
    const schema = {
      users: usersModule.users,
      articles: articlesModule.articles,
      documents: documentsModule.documents,
    };
    console.log("Schema imported successfully:", Object.keys(schema));
  } catch (error) {
    console.error("Schema import failed:", error);
    // Fallback: create db without schema for now
    const schema = {};
  }
  
  turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  db = drizzle(turso, { schema });
  return { db, turso };
}

async function testConnection() {
  try {
    const { turso } = await initializeDb();
    const result = await turso.execute("SELECT 1 as test");
    console.log("Turso connection successful:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Turso connection failed:", error);
    return { success: false, error };
  }
}

async function getDb() {
  const { db } = await initializeDb();
  return db;
}

module.exports = { testConnection, getDb };