
import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import csv from "csv-parser";
import { db, admin } from "./firebase.js";
import stream from "stream";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ================= MULTER MEMORY STORAGE =================
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= HOME PAGE =================
app.get("/", async (req, res) => {
  let jsonHtml = "";
  if (req.query.show === "json") {
    const snapshot = await db
      .collection("users")
      .orderBy("createdAt", "desc")
      .get();

    const users = snapshot.docs.map((doc) => ({
      name: doc.data().name,
    }));

    jsonHtml = `
      <h3>📄 Uploaded Users</h3>
      <pre style="background:#f4f4f4; padding:10px;">
${JSON.stringify(users, null, 2)}
      </pre>
    `;
  }

  res.send(`
    <h1>Pulsar</h1>

    <h2>Create User (Manual)</h2>
    <form method="POST" action="/create-user">
      <input name="name" placeholder="Enter name" required />
      <button type="submit">Create User</button>
    </form>

    <hr/>

    <h2>Upload Users via JSON</h2>
    <form method="POST" action="/upload-json" enctype="multipart/form-data">
      <input type="file" name="file" accept=".json" required />
      <br/><br/>
      <button type="submit">Upload JSON</button>
    </form>

    <hr/>

    <h2>Upload Users via CSV</h2>
    <form method="POST" action="/upload-csv" enctype="multipart/form-data">
      <input type="file" name="file" accept=".csv" required />
      <br/><br/>
      <button type="submit">Upload CSV</button>
    </form>

    <hr/>

    ${jsonHtml}

    <h2>Users List</h2>
    <button onclick="loadUsers()">Load Users</button>
    <ul id="list"></ul>

    <script>
      async function loadUsers() {
        const ul = document.getElementById('list');
        ul.innerHTML = '<li>Loading...</li>';
        const res = await fetch('/users');
        const data = await res.json();
        ul.innerHTML = data.length
          ? data.map(u => '<li>' + u.name + '</li>').join('')
          : '<li>No users found</li>';
      }
    </script>
  `);
});

// ================= CREATE USER =================
app.post("/create-user", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.send("Name required");

  await db.collection("users").add({
    name,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.redirect("/?show=json");
});

// ================= UPLOAD JSON =================
app.post("/upload-json", upload.single("file"), async (req, res) => {
  try {
    const users = JSON.parse(req.file.buffer.toString("utf-8"));

    if (!Array.isArray(users)) return res.send("JSON must be an array");

    for (const user of users) {
      await db.collection("users").add({
        name: user.name,
        sourceFile: req.file.originalname,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.redirect("/?show=json");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// ================= UPLOAD CSV =================
app.post("/upload-csv", upload.single("file"), async (req, res) => {
  const users = [];

  const readable = new stream.Readable();
  readable._read = () => {};
  readable.push(req.file.buffer);
  readable.push(null);

  readable
    .pipe(csv())
    .on("data", (row) => users.push(row))
    .on("end", async () => {
      for (const user of users) {
        await db.collection("users").add({
          name: user.name,
          sourceFile: req.file.originalname,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      res.redirect("/?show=json");
    });
});

// ================= LIST USERS =================
app.get("/users", async (req, res) => {
  const snapshot = await db
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  const users = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.json(users);
});

// ================= START SERVER =================
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

