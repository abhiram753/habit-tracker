const express = require("express");
const cors = require("cors");
const pool = require("./db");  // ← NEW: Import database connection

const app = express();

// middlewares
app.use(cors());
app.use(express.json());
// Auth routes
app.use("/api/auth", require("./routes/auth"));

// Habits & Checkins routes (protected)
app.use("/api/habits", require("./routes/habits"));
app.use("/api/habits", require("./routes/checkins"));


// test route
app.get("/", (req, res) => {
  res.send("Habit Tracker API is running");
});

// NEW: Test MySQL connection
async function testDbConnection() {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS result");
    console.log("MySQL connected, test result:", rows[0].result);
  } catch (err) {
    console.error("MySQL connection error:", err.message);
  }
}

testDbConnection();  // ← Run the test

// choose a port
const PORT = 8000;
// NEW: Test tables exist
app.get("/test-db", async (req, res) => {
  try {
    const [users] = await pool.query("SELECT * FROM users");
    const [habits] = await pool.query("SELECT * FROM habits");
    const [checkins] = await pool.query("SELECT * FROM checkins");
    
    res.json({
      message: "Tables working!",
      users: users.length,
      habits: habits.length,
      checkins: checkins.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});