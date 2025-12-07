const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const router = express.Router();

// Middleware: Check if user is logged in (protects routes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.user = user; // Attach user to request
    next();
  });
};

// POST /api/habits/:id/checkins - Mark habit done for today
router.post("/:habitId/checkins", authenticateToken, async (req, res) => {
  try {
    const habitId = req.params.habitId;
    const userId = req.user.userId;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Check if habit belongs to user
    const [habits] = await pool.query(
      "SELECT id FROM habits WHERE id = ? AND user_id = ?",
      [habitId, userId]
    );
    
    if (habits.length === 0) {
      return res.status(404).json({ error: "Habit not found" });
    }
    
    // Upsert (create or update today's checkin)
    await pool.query(
      `INSERT INTO checkins (habit_id, user_id, date, completed) 
       VALUES (?, ?, ?, TRUE)
       ON DUPLICATE KEY UPDATE completed = TRUE, created_at = CURRENT_TIMESTAMP`,
      [habitId, userId, date]
    );
    
    res.json({ message: "Check-in recorded for today!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/habits/:id/checkins - Get checkins for habit
router.get("/:habitId/checkins", authenticateToken, async (req, res) => {
  try {
    const habitId = req.params.habitId;
    const userId = req.user.userId;
    
    const [checkins] = await pool.query(
      `SELECT date, completed, notes 
       FROM checkins 
       WHERE habit_id = ? AND user_id = ? 
       ORDER BY date DESC 
       LIMIT 30`,
      [habitId, userId]
    );
    
    res.json(checkins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
