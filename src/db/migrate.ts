// This file is deprecated - migrations are now handled via drizzle-kit commands
// Use: npm run db:migrate or npm run db:push

export async function runMigrations() {
  console.log("Migrations should be run via drizzle-kit commands:");
  console.log("npm run db:migrate or npm run db:push");
  throw new Error("Use drizzle-kit commands for migrations");
}