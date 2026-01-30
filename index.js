

import express from "express";
import { createClient } from "@libsql/client";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validate env vars
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.error(" Missing Turso environment variables");
  process.exit(1);
}

// Turso client
const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Init DB
async function initDB() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    )
  `);
  console.log(" Database ready");
}

initDB();

// Home page
app.get("/", (req, res) => {
  res.send(`
    <h1>Pulsar</h1>

    <h2>Create User</h2>
    <form method="POST" action="/create-user">
      <input name="name" placeholder="Enter name" required />
      <button type="submit">Create</button>
    </form>

    <h2>Users</h2>
    <button id="load">Load Users</button>
    <ul id="list"></ul>

    <script>
      document.getElementById('load').onclick = async () => {
        const ul = document.getElementById('list');
        ul.innerHTML = '<li>Loading...</li>';
        const res = await fetch('/users');
        const data = await res.json();
        ul.innerHTML = data.length
          ? data.map(u => '<li>' + u.id + ': ' + u.name + '</li>').join('')
          : '<li>No users found</li>';
      };
    </script>
  `);
});

// Create user
app.post("/create-user", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.send("Name required");

  const result = await db.execute({
    sql: "INSERT INTO users (name) VALUES (?)",
    args: [name],
  });

  res.send(`
    <h3>User Created</h3>
    <p>ID: ${result.lastInsertRowid}</p>
    <p>Name: ${name}</p>
    <a href="/">Back</a>
  `);
});

// List users
app.get("/users", async (req, res) => {
  const result = await db.execute("SELECT * FROM users");
  res.json(result.rows);
});

// Start server
app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});



