import { createClient } from "@libsql/client/node";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../../src/db/schema";

export const turso = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

export const db = drizzle(turso, { schema });

export async function testConnection() {
  try {
    const result = await turso.execute("SELECT 1 as test");
    console.log("Turso connection successful:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("Turso connection failed:", error);
    return { success: false, error };
  }
}