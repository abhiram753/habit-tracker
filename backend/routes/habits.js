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

// GET /api/habits - List user's habits
router.get("/", authenticateToken, async (req, res) => {
  try {
    const [habits] = await pool.query(
      "SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.userId]
    );
    res.json(habits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/habits - Create new habit
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, category, frequency, target_days } = req.body;
    
    const [result] = await pool.query(
      "INSERT INTO habits (user_id, name, category, frequency, target_days) VALUES (?, ?, ?, ?, ?)",
      [req.user.userId, name, category || 'other', frequency || 'daily', target_days || 1]
    );
    
    res.status(201).json({ 
      message: "Habit created", 
      habitId: result.insertId 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/habits/:id - Update habit
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const habitId = req.params.id;
    const { name, category, frequency, target_days, is_active } = req.body;
    
    const [result] = await pool.query(
      "UPDATE habits SET name = ?, category = ?, frequency = ?, target_days = ?, is_active = ? WHERE id = ? AND user_id = ?",
      [name, category, frequency, target_days, is_active, habitId, req.user.userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Habit not found" });
    }
    
    res.json({ message: "Habit updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/habits/:id - Delete habit
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const habitId = req.params.id;
    
    const [result] = await pool.query(
      "DELETE FROM habits WHERE id = ? AND user_id = ?",
      [habitId, req.user.userId]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Habit not found" });
    }
    
    res.json({ message: "Habit deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
