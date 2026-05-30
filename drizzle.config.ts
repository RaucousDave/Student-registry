import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  schemaFilter: ["public"],
  tablesFilter: ["user", "session", "account", "verification", "students", "projects", "scores"],
  dbCredentials: { url: process.env.DATABASE_URL! },
  strict: true,
  verbose: true,
});
