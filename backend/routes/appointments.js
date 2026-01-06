const express = require('express');
const router = express.Router();
const { getDatabase } = require('../models/database');
const { sendClientConfirmation, sendOwnerNotification } = require('../config/email');

// Simple password-based authentication middleware
const authenticateAdmin = (req, res, next) => {
  const providedPassword = req.headers['x-admin-password'] || req.body.password;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!providedPassword || providedPassword !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid password' });
  }

  next();
};

// Create new appointment
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, service_type, date, time, address, message } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !service_type || !date || !time || !address) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, email, phone, service_type, date, time, address' 
      });
    }

    const db = getDatabase();
    
    // Insert appointment
    const appointment = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO appointments (name, email, phone, service_type, date, time, address, message, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [name, email, phone, service_type, date, time, address, message || null],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({
              id: this.lastID,
              name,
              email,
              phone,
              service_type,
              date,
              time,
              address,
              message: message || null,
              status: 'pending'
            });
          }
        }
      );
    });

    // Send emails (don't fail the request if email fails)
    try {
      await sendClientConfirmation(appointment);
      await sendOwnerNotification(appointment);
    } catch (emailError) {
      console.error('Email sending failed, but appointment was saved:', emailError);
    }

    res.status(201).json({ 
      message: 'Appointment created successfully',
      appointment 
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Get all appointments (admin only - protected)
router.get('/', authenticateAdmin, (req, res) => {
  try {
    const db = getDatabase();
    
    db.all('SELECT * FROM appointments ORDER BY created_at DESC', [], (err, rows) => {
      if (err) {
        console.error('Error fetching appointments:', err);
        return res.status(500).json({ error: 'Failed to fetch appointments' });
      }
      res.json(rows);
    });
  } catch (error) {
    console.error('Error in GET /appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Update appointment status (admin only - protected)
router.put('/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const db = getDatabase();
    
    db.run(
      'UPDATE appointments SET status = ? WHERE id = ?',
      [status, id],
      function(err) {
        if (err) {
          console.error('Error updating appointment:', err);
          return res.status(500).json({ error: 'Failed to update appointment' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Appointment not found' });
        }
        res.json({ message: 'Appointment updated successfully' });
      }
    );
  } catch (error) {
    console.error('Error in PUT /appointments/:id:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// Delete appointment (admin only - protected)
router.delete('/:id', authenticateAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.run('DELETE FROM appointments WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Error deleting appointment:', err);
        return res.status(500).json({ error: 'Failed to delete appointment' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Appointment not found' });
      }
      res.json({ message: 'Appointment deleted successfully' });
    });
  } catch (error) {
    console.error('Error in DELETE /appointments/:id:', error);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

module.exports = router;

