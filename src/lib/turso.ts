import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db/schema";

export const turso = createClient({
  url: import.meta.env.VITE_TURSO_DATABASE_URL,
  authToken: import.meta.env.VITE_TURSO_AUTH_TOKEN,
});

export const db = drizzle(turso, { schema });

// Test connection function
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