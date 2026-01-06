const express = require('express');
const router = express.Router();
const { getDatabase } = require('../models/database');
// const { Resend } = require('resend'); // COMMENTED OUT FOR UI TESTING

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const providedPassword = req.headers['x-admin-password'] || req.body.password;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!providedPassword || providedPassword !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid password' });
  }

  next();
};

// Initialize Resend (using free tier - requires API key in env)
// COMMENTED OUT FOR UI TESTING - Uncomment when ready to use Resend
// const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const resend = null; // Disabled for UI testing
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Subscribe to newsletter
router.post('/subscribe', (req, res) => {
  try {
    const { email, name } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    const db = getDatabase();
    
    // Check if email already exists
    db.get('SELECT * FROM newsletter_subscribers WHERE email = ?', [email], (err, row) => {
      if (err) {
        console.error('Error checking existing subscriber:', err);
        return res.status(500).json({ error: 'Failed to process subscription' });
      }

      if (row) {
        if (row.active === 1) {
          return res.status(200).json({ 
            message: 'You are already subscribed to our newsletter!',
            alreadySubscribed: true
          });
        } else {
          // Reactivate subscription
          db.run(
            'UPDATE newsletter_subscribers SET active = 1, subscribed_at = CURRENT_TIMESTAMP WHERE email = ?',
            [email],
            function(updateErr) {
              if (updateErr) {
                console.error('Error reactivating subscription:', updateErr);
                return res.status(500).json({ error: 'Failed to reactivate subscription' });
              }
              res.status(200).json({ 
                message: 'Welcome back! Your subscription has been reactivated.',
                reactivated: true
              });
            }
          );
        }
      } else {
        // Insert new subscriber
        db.run(
          'INSERT INTO newsletter_subscribers (email, name, active) VALUES (?, ?, 1)',
          [email, name || null],
          function(insertErr) {
            if (insertErr) {
              console.error('Error inserting subscriber:', insertErr);
              return res.status(500).json({ error: 'Failed to subscribe to newsletter' });
            }
            res.status(201).json({ 
              message: 'Successfully subscribed to newsletter!',
              subscribed: true
            });
          }
        );
      }
    });
  } catch (error) {
    console.error('Error in POST /newsletter/subscribe:', error);
    res.status(500).json({ error: 'Failed to process subscription' });
  }
});

// Get all subscribers (admin only)
router.get('/subscribers', (req, res) => {
  try {
    const providedPassword = req.headers['x-admin-password'] || req.body.password;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (!providedPassword || providedPassword !== adminPassword) {
      return res.status(401).json({ error: 'Unauthorized: Invalid password' });
    }

    const db = getDatabase();
    
    db.all(
      'SELECT * FROM newsletter_subscribers WHERE active = 1 ORDER BY subscribed_at DESC',
      [],
      (err, rows) => {
        if (err) {
          console.error('Error fetching subscribers:', err);
          return res.status(500).json({ error: 'Failed to fetch subscribers' });
        }
        res.json(rows);
      }
    );
  } catch (error) {
    console.error('Error in GET /newsletter/subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// Unsubscribe (public endpoint) - GET for email links, POST for forms
router.get('/unsubscribe', (req, res) => {
  try {
    const email = req.query.email;

    if (!email) {
      return res.status(400).send(`
        <html>
          <body style="font-family: Arial, sans-serif; padding: 2rem; text-align: center;">
            <h2>Unsubscribe</h2>
            <p>Email parameter is required.</p>
          </body>
        </html>
      `);
    }

    const db = getDatabase();
    
    db.run(
      'UPDATE newsletter_subscribers SET active = 0 WHERE email = ?',
      [email],
      function(err) {
        if (err) {
          console.error('Error unsubscribing:', err);
          return res.status(500).send(`
            <html>
              <body style="font-family: Arial, sans-serif; padding: 2rem; text-align: center;">
                <h2>Error</h2>
                <p>Failed to unsubscribe. Please try again later.</p>
              </body>
            </html>
          `);
        }
        if (this.changes === 0) {
          return res.status(404).send(`
            <html>
              <body style="font-family: Arial, sans-serif; padding: 2rem; text-align: center;">
                <h2>Not Found</h2>
                <p>Email not found in our records.</p>
              </body>
            </html>
          `);
        }
        res.send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 2rem; text-align: center;">
              <h2 style="color: #10b981;">Successfully Unsubscribed</h2>
              <p>You have been unsubscribed from our newsletter.</p>
              <p style="color: #6b7280; font-size: 0.875rem;">You can resubscribe at any time.</p>
            </body>
          </html>
        `);
      }
    );
  } catch (error) {
    console.error('Error in GET /newsletter/unsubscribe:', error);
    res.status(500).send(`
      <html>
        <body style="font-family: Arial, sans-serif; padding: 2rem; text-align: center;">
          <h2>Error</h2>
          <p>Failed to unsubscribe. Please try again later.</p>
        </body>
      </html>
    `);
  }
});

router.post('/unsubscribe', (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const db = getDatabase();
    
    db.run(
      'UPDATE newsletter_subscribers SET active = 0 WHERE email = ?',
      [email],
      function(err) {
        if (err) {
          console.error('Error unsubscribing:', err);
          return res.status(500).json({ error: 'Failed to unsubscribe' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Email not found in our records' });
        }
        res.json({ message: 'Successfully unsubscribed from newsletter' });
      }
    );
  } catch (error) {
    console.error('Error in POST /newsletter/unsubscribe:', error);
    res.status(500).json({ error: 'Failed to unsubscribe' });
  }
});

// ========== ADMIN ROUTES - Newsletter Drafts & Sending ==========

// Get all drafts (admin only)
router.get('/drafts', authenticateAdmin, (req, res) => {
  try {
    const db = getDatabase();
    db.all(
      'SELECT * FROM newsletter_drafts ORDER BY updated_at DESC',
      [],
      (err, rows) => {
        if (err) {
          console.error('Error fetching drafts:', err);
          return res.status(500).json({ error: 'Failed to fetch drafts' });
        }
        res.json(rows);
      }
    );
  } catch (error) {
    console.error('Error in GET /newsletter/drafts:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// Get single draft (admin only)
router.get('/drafts/:id', authenticateAdmin, (req, res) => {
  try {
    const db = getDatabase();
    db.get(
      'SELECT * FROM newsletter_drafts WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) {
          console.error('Error fetching draft:', err);
          return res.status(500).json({ error: 'Failed to fetch draft' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Draft not found' });
        }
        res.json(row);
      }
    );
  } catch (error) {
    console.error('Error in GET /newsletter/drafts/:id:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

// Create draft (admin only)
router.post('/drafts', authenticateAdmin, (req, res) => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO newsletter_drafts (subject, content) VALUES (?, ?)',
      [subject, content],
      function(err) {
        if (err) {
          console.error('Error creating draft:', err);
          return res.status(500).json({ error: 'Failed to create draft' });
        }
        res.status(201).json({ id: this.lastID, subject, content });
      }
    );
  } catch (error) {
    console.error('Error in POST /newsletter/drafts:', error);
    res.status(500).json({ error: 'Failed to create draft' });
  }
});

// Update draft (admin only)
router.put('/drafts/:id', authenticateAdmin, (req, res) => {
  try {
    const { subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    const db = getDatabase();
    db.run(
      'UPDATE newsletter_drafts SET subject = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [subject, content, req.params.id],
      function(err) {
        if (err) {
          console.error('Error updating draft:', err);
          return res.status(500).json({ error: 'Failed to update draft' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Draft not found' });
        }
        res.json({ id: req.params.id, subject, content });
      }
    );
  } catch (error) {
    console.error('Error in PUT /newsletter/drafts/:id:', error);
    res.status(500).json({ error: 'Failed to update draft' });
  }
});

// Delete draft (admin only)
router.delete('/drafts/:id', authenticateAdmin, (req, res) => {
  try {
    const db = getDatabase();
    db.run(
      'DELETE FROM newsletter_drafts WHERE id = ?',
      [req.params.id],
      function(err) {
        if (err) {
          console.error('Error deleting draft:', err);
          return res.status(500).json({ error: 'Failed to delete draft' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Draft not found' });
        }
        res.json({ message: 'Draft deleted successfully' });
      }
    );
  } catch (error) {
    console.error('Error in DELETE /newsletter/drafts/:id:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

// Send newsletter (admin only)
// This endpoint is idempotent - prevents double-sending by checking if draft was already sent
router.post('/send', authenticateAdmin, async (req, res) => {
  try {
    const { draftId, subject, content } = req.body;

    if (!subject || !content) {
      return res.status(400).json({ error: 'Subject and content are required' });
    }

    // COMMENTED OUT FOR UI TESTING - Uncomment when ready to use Resend
    // if (!resend) {
    //   return res.status(500).json({ 
    //     error: 'Email service not configured. Please set RESEND_API_KEY in environment variables.' 
    //   });
    // }

    const db = getDatabase();

    // Get all active subscribers
    db.all(
      'SELECT email, name FROM newsletter_subscribers WHERE active = 1',
      [],
      async (err, subscribers) => {
        if (err) {
          console.error('Error fetching subscribers:', err);
          return res.status(500).json({ error: 'Failed to fetch subscribers' });
        }

        if (subscribers.length === 0) {
          return res.status(400).json({ error: 'No active subscribers found' });
        }

        // Check if this draft was already sent (idempotency check)
        if (draftId) {
          db.get(
            'SELECT * FROM newsletter_sends WHERE draft_id = ?',
            [draftId],
            async (err, existingSend) => {
              if (err) {
                console.error('Error checking send history:', err);
                return res.status(500).json({ error: 'Failed to check send history' });
              }
              
              if (existingSend) {
                return res.status(400).json({ 
                  error: 'This draft has already been sent. Create a new draft to send again.' 
                });
              }

              // Proceed with sending
              await sendNewsletterToSubscribers(subscribers, subject, content, draftId, db, res);
            }
          );
        } else {
          // No draft ID, allow sending (for ad-hoc sends)
          await sendNewsletterToSubscribers(subscribers, subject, content, null, db, res);
        }
      }
    );
  } catch (error) {
    console.error('Error in POST /newsletter/send:', error);
    res.status(500).json({ error: 'Failed to send newsletter' });
  }
});

// Helper function to send newsletter to all subscribers
async function sendNewsletterToSubscribers(subscribers, subject, content, draftId, db, res) {
  try {
    // COMMENTED OUT FOR UI TESTING - Uncomment when ready to use Resend
    // const unsubscribeUrl = `${BASE_URL}/api/newsletter/unsubscribe`;
    // 
    // // Add unsubscribe link to content
    // const emailContent = `
    //   ${content}
    //   <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
    //   <p style="font-size: 12px; color: #666;">
    //     <a href="${unsubscribeUrl}?email={{email}}">Unsubscribe from this newsletter</a>
    //   </p>
    // `;

    let successCount = 0;
    let failCount = 0;

    // COMMENTED OUT FOR UI TESTING - Mock email sending
    // Send to each subscriber
    // for (const subscriber of subscribers) {
    //   try {
    //     // Replace {{email}} placeholder with actual email
    //     const personalizedContent = emailContent.replace(/\{\{email\}\}/g, subscriber.email);
    //     
    //     await resend.emails.send({
    //       from: FROM_EMAIL,
    //       to: subscriber.email,
    //       subject: subject,
    //       html: personalizedContent,
    //     });
    //     successCount++;
    //   } catch (emailError) {
    //     console.error(`Error sending to ${subscriber.email}:`, emailError);
    //     failCount++;
    //   }
    // }

    // MOCK RESPONSE FOR UI TESTING - Simulates successful send
    successCount = subscribers.length;
    console.log(`[MOCK] Would send newsletter "${subject}" to ${subscribers.length} subscribers`);

    // Log send history
    db.run(
      'INSERT INTO newsletter_sends (draft_id, subject, recipient_count) VALUES (?, ?, ?)',
      [draftId, subject, successCount],
      (err) => {
        if (err) {
          console.error('Error logging send history:', err);
        }
      }
    );

    res.json({
      message: 'Newsletter sent successfully (MOCK - Resend disabled for testing)',
      sent: successCount,
      failed: failCount,
      total: subscribers.length
    });
  } catch (error) {
    console.error('Error in sendNewsletterToSubscribers:', error);
    res.status(500).json({ error: 'Failed to send newsletter' });
  }
}

// Get send history (admin only)
router.get('/sends', authenticateAdmin, (req, res) => {
  try {
    const db = getDatabase();
    db.all(
      'SELECT * FROM newsletter_sends ORDER BY sent_at DESC',
      [],
      (err, rows) => {
        if (err) {
          console.error('Error fetching send history:', err);
          return res.status(500).json({ error: 'Failed to fetch send history' });
        }
        res.json(rows);
      }
    );
  } catch (error) {
    console.error('Error in GET /newsletter/sends:', error);
    res.status(500).json({ error: 'Failed to fetch send history' });
  }
});

module.exports = router;

