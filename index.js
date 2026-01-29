// import express from "express";

// const app = express();
// const PORT = 3000;


// app.get("/", (req, res) => {
//   res.send("Hello World from Express 🚀");
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

// import express from "express";

// const app = express();
// const PORT = 3000;

// // Middleware to parse JSON
// app.use(express.json());

// // In-memory "database" for users
// const users = [];

// // Home route (optional)
// app.get("/", (req, res) => {
//   res.send("<h1>Hello World from Express 🚀</h1>");
// });

// // POST API to create a user (JSON-friendly)
// app.post("/create-user", (req, res) => {
//   const { name } = req.body;

//   if (!name) {
//     return res.status(400).json({ error: "Name is required" });
//   }

//   const user = { id: users.length + 1, name };
//   users.push(user);

//   res.status(201).json({
//     message: "User created successfully",
//     user,
//   });
// });

// // GET API to list all users (optional)
// app.get("/users", (req, res) => {
//   res.json(users);
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });


import express from "express";

const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// In-memory "database" for users
const users = [];

// Home route with button to see users
app.get("/", (req, res) => {
  res.send(`
    <h1>Hello World from Express 🚀</h1>



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

// POST API to create a user (JSON-friendly)
app.post("/create-user", (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  const user = { id: users.length + 1, name };
  users.push(user);

  res.status(201).json({
    message: "User created successfully",
    user,
  });
});

// GET API to list all users
app.get("/users", (req, res) => {
  res.json(users);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
