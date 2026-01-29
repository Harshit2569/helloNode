



import express from "express";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // to handle form submissions

// Needed to get current file directory in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("__dirname:", __dirname);

const dbPath = path.resolve("users.db");
console.log("SQLite DB path:", dbPath);


// SQLite setup
const db = new Database(dbPath);
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )
`).run();

// Home page with form and button
app.get("/", (req, res) => {
  res.send(`
    <h1>Node.js App 🚀</h1>

    <h2>Create a User</h2>
    <form id="createUserForm" method="POST" action="/create-user">
      <input type="text" name="name" placeholder="Enter your name" required />
      <button type="submit">Create User</button>
    </form>

    <h2>All Users</h2>
    <button id="showUsersBtn">Show Users</button>
    <ul id="usersList"></ul>

    <script>
      const btn = document.getElementById('showUsersBtn');
      const list = document.getElementById('usersList');

      btn.addEventListener('click', async () => {
        list.innerHTML = '<li>Loading...</li>';
        const response = await fetch('/users');
        const users = await response.json();
        if (users.length === 0) {
          list.innerHTML = '<li>No users found</li>';
          return;
        }
        list.innerHTML = users.map(u => '<li>' + u.id + ': ' + u.name + '</li>').join('');
      });
    </script>
  `);
});

// Create user route (handles form submission)
app.post("/create-user", (req, res) => {
  const { name } = req.body;
  if (!name) return res.send("Name is required");

  const stmt = db.prepare("INSERT INTO users (name) VALUES (?)");
  const info = stmt.run(name);

  res.send(`
    <h2>User Created Successfully!</h2>
    <p>ID: ${info.lastInsertRowid}</p>
    <p>Name: ${name}</p>
    <a href="/">Go Back</a>
  `);
});

// API to list users (used by fetch)
app.get("/users", (req, res) => {
  const users = db.prepare("SELECT * FROM users").all();
  res.json(users);
});

// Start server
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
