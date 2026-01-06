const express = require('express');
const router = express.Router();

// Simple password-based authentication middleware
const authenticateAdmin = (req, res, next) => {
  const providedPassword = req.headers['x-admin-password'] || req.body.password;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!providedPassword || providedPassword !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid password' });
  }

  next();
};

// Apply authentication to all admin routes
router.use(authenticateAdmin);

// Admin login check endpoint
router.post('/login', (req, res) => {
  res.json({ message: 'Authentication successful', authenticated: true });
});

module.exports = router;

