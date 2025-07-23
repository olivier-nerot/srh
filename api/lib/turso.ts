const { createClient } = require("@libsql/client/node");
const { drizzle } = require("drizzle-orm/libsql");
const schema = require("../../src/db/schema");

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(turso, { schema });

async function testConnection() {
  try {
    const result = await turso.execute("SELECT 1 as test");
    console.log("Turso connection successful:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Turso connection failed:", error);
    return { success: false, error };
  }
}

module.exports = { turso, db, testConnection };