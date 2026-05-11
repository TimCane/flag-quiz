import { drizzle } from "drizzle-orm/better-sqlite3";
import type Database from "better-sqlite3";
import * as schema from "./schema.js";

export function createDrizzleDb(sqlite: Database.Database) {
  return drizzle(sqlite, { schema });
}

export type DrizzleDb = ReturnType<typeof createDrizzleDb>;
