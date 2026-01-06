const express = require('express');
const router = express.Router();
const { getDatabase } = require('../models/database');
// COMMENTED OUT FOR UI TESTING - Uncomment when ready to use Stripe
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const stripe = null; // Disabled for UI testing

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  const providedPassword = req.headers['x-admin-password'] || req.body.password;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  if (!providedPassword || providedPassword !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized: Invalid password' });
  }

  next();
};

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// ========== PUBLIC ROUTES - Product Viewing ==========

// Get all active products (public)
router.get('/products', (req, res) => {
  try {
    const db = getDatabase();
    db.all(
      'SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC',
      [],
      (err, rows) => {
        if (err) {
          console.error('Error fetching products:', err);
          return res.status(500).json({ error: 'Failed to fetch products' });
        }
        // Convert price from cents to dollars for display
        const products = rows.map(product => ({
          ...product,
          price: product.price / 100
        }));
        res.json(products);
      }
    );
  } catch (error) {
    console.error('Error in GET /store/products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product (public)
router.get('/products/:id', (req, res) => {
  try {
    const db = getDatabase();
    db.get(
      'SELECT * FROM products WHERE id = ? AND active = 1',
      [req.params.id],
      (err, row) => {
        if (err) {
          console.error('Error fetching product:', err);
          return res.status(500).json({ error: 'Failed to fetch product' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Product not found' });
        }
        // Convert price from cents to dollars
        res.json({
          ...row,
          price: row.price / 100
        });
      }
    );
  } catch (error) {
    console.error('Error in GET /store/products/:id:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create Stripe Checkout Session (public)
router.post('/checkout', async (req, res) => {
  try {
    const { productId, customerEmail, customerName } = req.body;

    if (!productId || !customerEmail) {
      return res.status(400).json({ error: 'Product ID and customer email are required' });
    }

    const db = getDatabase();

    // Get product
    db.get(
      'SELECT * FROM products WHERE id = ? AND active = 1 AND in_stock = 1',
      [productId],
      async (err, product) => {
        if (err) {
          console.error('Error fetching product:', err);
          return res.status(500).json({ error: 'Failed to fetch product' });
        }

        if (!product) {
          return res.status(404).json({ error: 'Product not found or out of stock' });
        }

        // COMMENTED OUT FOR UI TESTING - Uncomment when ready to use Stripe
        // if (!stripe) {
        //   return res.status(500).json({ 
        //     error: 'Payment service not configured. Please set STRIPE_SECRET_KEY in environment variables.' 
        //   });
        // }

        // MOCK CHECKOUT FOR UI TESTING
        try {
          // Create mock session ID
          const mockSessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          console.log(`[MOCK] Would create Stripe checkout for product ${productId} (${product.name})`);
          console.log(`[MOCK] Customer: ${customerEmail} (${customerName || 'N/A'})`);
          console.log(`[MOCK] Amount: $${(product.price / 100).toFixed(2)}`);

          // Create order record with mock session
          db.run(
            'INSERT INTO orders (product_id, stripe_session_id, customer_email, customer_name, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
            [productId, mockSessionId, customerEmail, customerName || null, product.price, 'pending'],
            (err) => {
              if (err) {
                console.error('Error creating order:', err);
              }
            }
          );

          // Return mock success response - redirect to success page
          res.json({ 
            sessionId: mockSessionId, 
            url: `${BASE_URL}/store/success?session_id=${mockSessionId}`,
            mock: true // Flag to indicate this is a mock response
          });

          // COMMENTED OUT - Real Stripe code
          // // Create or get Stripe Price
          // let priceId = product.stripe_price_id;
          // 
          // if (!priceId) {
          //   // Create price if it doesn't exist
          //   const price = await stripe.prices.create({
          //     unit_amount: product.price, // price is in cents
          //     currency: 'usd',
          //     product_data: {
          //       name: product.name,
          //       description: product.description || '',
          //     },
          //   });
          //   priceId = price.id;
          // 
          //   // Save price ID to product
          //   db.run(
          //     'UPDATE products SET stripe_price_id = ? WHERE id = ?',
          //     [priceId, productId]
          //   );
          // }
          // 
          // // Create Stripe Checkout Session
          // const session = await stripe.checkout.sessions.create({
          //   payment_method_types: ['card'],
          //   line_items: [
          //     {
          //       price: priceId,
          //       quantity: 1,
          //     },
          //   ],
          //   mode: 'payment',
          //   success_url: `${BASE_URL}/store/success?session_id={CHECKOUT_SESSION_ID}`,
          //   cancel_url: `${BASE_URL}/store/cancel`,
          //   customer_email: customerEmail,
          //   metadata: {
          //     product_id: productId.toString(),
          //     customer_name: customerName || '',
          //   },
          // });
          // 
          // // Create order record
          // db.run(
          //   'INSERT INTO orders (product_id, stripe_session_id, customer_email, customer_name, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
          //   [productId, session.id, customerEmail, customerName || null, product.price, 'pending'],
          //   (err) => {
          //     if (err) {
          //       console.error('Error creating order:', err);
          //     }
          //   }
          // );
          // 
          // res.json({ sessionId: session.id, url: session.url });
        } catch (error) {
          console.error('Error creating checkout:', error);
          res.status(500).json({ error: 'Failed to create checkout session' });
        }
      }
    );
  } catch (error) {
    console.error('Error in POST /store/checkout:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler (public, but secured by Stripe signature)
// COMMENTED OUT FOR UI TESTING - Uncomment when ready to use Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  // COMMENTED OUT FOR UI TESTING
  // const sig = req.headers['stripe-signature'];
  // const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  // 
  // if (!webhookSecret) {
  //   console.error('STRIPE_WEBHOOK_SECRET not set');
  //   return res.status(400).send('Webhook secret not configured');
  // }
  // 
  // let event;
  // 
  // try {
  //   event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  // } catch (err) {
  //   console.error('Webhook signature verification failed:', err.message);
  //   return res.status(400).send(`Webhook Error: ${err.message}`);
  // }
  // 
  // const db = getDatabase();
  // 
  // // Handle the event
  // if (event.type === 'checkout.session.completed') {
  //   const session = event.data.object;
  // 
  //   // Update order status
  //   db.run(
  //     'UPDATE orders SET status = ?, stripe_payment_intent_id = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_session_id = ?',
  //     ['completed', session.payment_intent || null, session.id],
  //     (err) => {
  //       if (err) {
  //         console.error('Error updating order:', err);
  //       } else {
  //         console.log(`Order updated for session ${session.id}`);
  //       }
  //     }
  //   );
  // } else if (event.type === 'checkout.session.async_payment_failed') {
  //   const session = event.data.object;
  // 
  //   // Update order status to failed
  //   db.run(
  //     'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE stripe_session_id = ?',
  //     ['failed', session.id],
  //     (err) => {
  //       if (err) {
  //         console.error('Error updating order:', err);
  //       }
  //     }
  //   );
  // }

  // MOCK RESPONSE FOR UI TESTING
  console.log('[MOCK] Webhook received (Stripe disabled for testing)');
  res.json({ received: true, mock: true });
});

// ========== ADMIN ROUTES - Product Management ==========

// Get all products (admin only - includes inactive)
router.get('/admin/products', authenticateAdmin, (req, res) => {
  try {
    const db = getDatabase();
    db.all(
      'SELECT * FROM products ORDER BY created_at DESC',
      [],
      (err, rows) => {
        if (err) {
          console.error('Error fetching products:', err);
          return res.status(500).json({ error: 'Failed to fetch products' });
        }
        // Convert price from cents to dollars
        const products = rows.map(product => ({
          ...product,
          price: product.price / 100
        }));
        res.json(products);
      }
    );
  } catch (error) {
    console.error('Error in GET /store/admin/products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product (admin only)
router.get('/admin/products/:id', authenticateAdmin, (req, res) => {
  try {
    const db = getDatabase();
    db.get(
      'SELECT * FROM products WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) {
          console.error('Error fetching product:', err);
          return res.status(500).json({ error: 'Failed to fetch product' });
        }
        if (!row) {
          return res.status(404).json({ error: 'Product not found' });
        }
        // Convert price from cents to dollars
        res.json({
          ...row,
          price: row.price / 100
        });
      }
    );
  } catch (error) {
    console.error('Error in GET /store/admin/products/:id:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product (admin only)
router.post('/admin/products', authenticateAdmin, (req, res) => {
  try {
    const { name, description, price, image_url, active, in_stock } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Convert price from dollars to cents
    const priceInCents = Math.round(parseFloat(price) * 100);

    const db = getDatabase();
    db.run(
      'INSERT INTO products (name, description, price, image_url, active, in_stock) VALUES (?, ?, ?, ?, ?, ?)',
      [
        name,
        description || null,
        priceInCents,
        image_url || null,
        active !== undefined ? (active ? 1 : 0) : 1,
        in_stock !== undefined ? (in_stock ? 1 : 0) : 1
      ],
      function(err) {
        if (err) {
          console.error('Error creating product:', err);
          return res.status(500).json({ error: 'Failed to create product' });
        }
        res.status(201).json({
          id: this.lastID,
          name,
          description,
          price: price,
          image_url,
          active: active !== undefined ? active : true,
          in_stock: in_stock !== undefined ? in_stock : true
        });
      }
    );
  } catch (error) {
    console.error('Error in POST /store/admin/products:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product (admin only)
router.put('/admin/products/:id', authenticateAdmin, (req, res) => {
  try {
    const { name, description, price, image_url, active, in_stock } = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Convert price from dollars to cents
    const priceInCents = Math.round(parseFloat(price) * 100);

    const db = getDatabase();
    db.run(
      'UPDATE products SET name = ?, description = ?, price = ?, image_url = ?, active = ?, in_stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        name,
        description || null,
        priceInCents,
        image_url || null,
        active !== undefined ? (active ? 1 : 0) : 1,
        in_stock !== undefined ? (in_stock ? 1 : 0) : 1,
        req.params.id
      ],
      function(err) {
        if (err) {
          console.error('Error updating product:', err);
          return res.status(500).json({ error: 'Failed to update product' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.json({
          id: req.params.id,
          name,
          description,
          price: price,
          image_url,
          active: active !== undefined ? active : true,
          in_stock: in_stock !== undefined ? in_stock : true
        });
      }
    );
  } catch (error) {
    console.error('Error in PUT /store/admin/products/:id:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product (admin only)
router.delete('/admin/products/:id', authenticateAdmin, (req, res) => {
  try {
    const db = getDatabase();
    db.run(
      'DELETE FROM products WHERE id = ?',
      [req.params.id],
      function(err) {
        if (err) {
          console.error('Error deleting product:', err);
          return res.status(500).json({ error: 'Failed to delete product' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
      }
    );
  } catch (error) {
    console.error('Error in DELETE /store/admin/products/:id:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get orders (admin only)
router.get('/admin/orders', authenticateAdmin, (req, res) => {
  try {
    const db = getDatabase();
    db.all(
      `SELECT o.*, p.name as product_name, p.image_url as product_image 
       FROM orders o 
       JOIN products p ON o.product_id = p.id 
       ORDER BY o.created_at DESC`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Error fetching orders:', err);
          return res.status(500).json({ error: 'Failed to fetch orders' });
        }
        // Convert amount from cents to dollars
        const orders = rows.map(order => ({
          ...order,
          amount: order.amount / 100
        }));
        res.json(orders);
      }
    );
  } catch (error) {
    console.error('Error in GET /store/admin/orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

module.exports = router;

