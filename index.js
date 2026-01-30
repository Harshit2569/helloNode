





import express from "express";
import dotenv from "dotenv";
import { db, admin } from "./firebase.js";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
          ? data.map(u => '<li>'  + ' ' + u.name + '</li>').join('')
          : '<li>No users found</li>';
      };
    </script>
  `);
});

// Create user
app.post("/create-user", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.send("Name required");

  const docRef = await db.collection("users").add({
    name,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.send(`
    <h3>User Created</h3>
    <p>ID: ${docRef.id}</p>
    <p>Name: ${name}</p>
    <a href="/">Back</a>
  `);
});

// List users
app.get("/users", async (req, res) => {
  const snapshot = await db
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  const users = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.json(users);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
