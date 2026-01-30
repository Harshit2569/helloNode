// export.js
import Database from "better-sqlite3";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

// Turso client
const dbTurso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Local SQLite DB
const dbSqlite = new Database("users.db");

// Initialize SQLite table
dbSqlite.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL
  )
`).run();

async function exportUsers() {
  try {
    // Fetch all users from Turso
    const result = await dbTurso.execute("SELECT * FROM users");
    const rows = result.rows;

    console.log(`Fetched ${rows.length} users from Turso`);

    // Prepare insert statement for SQLite
    const insert = dbSqlite.prepare("INSERT OR REPLACE INTO users (id, name) VALUES (?, ?)");

    // Insert each row into SQLite
    const insertMany = dbSqlite.transaction((rows) => {
      for (const row of rows) {
        insert.run(row.id, row.name);
      }
    });

    insertMany(rows);

    console.log("Export completed! Users saved to users.db");
    process.exit(0);
  } catch (err) {
    console.error("Export failed:", err);
    process.exit(1);
  }
}

exportUsers();
