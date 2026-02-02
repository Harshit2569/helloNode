


import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import csv from "csv-parser";
import { db, admin } from "./firebase.js";

dotenv.config();

const app = express();
const PORT = 3000;



const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });



app.use(express.json());
app.use(express.urlencoded({ extended: true }));



app.get("/", (req, res) => {
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

    <h2>Users</h2>
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



app.post("/create-user", async (req, res) => {
  const { name } = req.body;
  if (!name) return res.send("Name required");

  await db.collection("users").add({
    name,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  res.redirect("/");
});



app.post("/upload-json", upload.single("file"), async (req, res) => {
  try {
    console.log("Original:", req.file.originalname);
    console.log("Saved as:", req.file.filename);

    const raw = fs.readFileSync(req.file.path, "utf-8");
    const users = JSON.parse(raw);

    if (!Array.isArray(users)) {
      return res.send("JSON must be an array");
    }

    for (const user of users) {
      await db.collection("users").add({
        name: user.name,
        sourceFile: req.file.originalname,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    fs.unlinkSync(req.file.path);
    res.send("✅ JSON uploaded successfully");
  } catch (err) {
    res.status(500).send(err.message);
  }
});



app.post("/upload-csv", upload.single("file"), async (req, res) => {
  const users = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => {
      users.push(row);
    })
    .on("end", async () => {
      for (const user of users) {
        await db.collection("users").add({
          name: user.name,
          sourceFile: req.file.originalname,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }

      fs.unlinkSync(req.file.path);
      res.send("✅ CSV uploaded successfully");
    });
});



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



app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
