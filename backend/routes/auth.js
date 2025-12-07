const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const router = express.Router();

// Helper: hash password
const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

// Helper: compare password
const comparePassword = async (password, hashed) => {
  return bcrypt.compare(password, hashed);
};

// SIGNUP - POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Save user
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );
    
    res.status(201).json({ 
      message: "User created", 
      userId: result.insertId 
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

// LOGIN - POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0];
    
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    
    // Check password
    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username }, 
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    
    res.json({ 
      message: "Login successful", 
      token, 
      user: { id: user.id, username: user.username, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
