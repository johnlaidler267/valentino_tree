# Setup Guide for Newsletter & Store Features

This guide covers the setup required for the new Newsletter and Store features.

## Environment Variables

Add these to your `.env` file in the `backend` directory:

### Newsletter (Resend)
```
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Getting Resend API Key:**
1. Sign up at https://resend.com (free tier: 3,000 emails/month)
2. Create an API key in the dashboard
3. Verify your domain (or use `onboarding@resend.dev` for testing)
4. Add the API key to your `.env` file

### Store (Stripe)
```
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
BASE_URL=http://localhost:3000
```

**Getting Stripe Keys:**
1. Sign up at https://stripe.com (free to start)
2. Get your test API keys from the Dashboard → Developers → API keys
3. For webhooks:
   - Go to Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/store/webhook`
   - Copy the webhook signing secret
   - For local testing, use Stripe CLI: `stripe listen --forward-to localhost:5000/api/store/webhook`

### Base URL
```
BASE_URL=http://localhost:3000  # For development
# BASE_URL=https://yourdomain.com  # For production
```

## Database

The database schema is automatically created when the server starts. New tables:
- `newsletter_drafts` - Saved newsletter drafts
- `newsletter_sends` - Send history
- `products` - Store products
- `orders` - Purchase orders

## Features

### Newsletter Feature
- **Admin Access**: Go to `/admin` → Newsletter tab
- **Create Drafts**: Write and save newsletter drafts
- **Send Newsletters**: One-click send to all subscribers
- **Send History**: Track all sent newsletters
- **Idempotency**: Prevents accidental double-sending of drafts

### Store Feature
- **Public Store**: Browse products at `/store`
- **Product Management**: Admin → Products tab
- **Stripe Checkout**: Hosted payment page (no custom UI needed)
- **Order Tracking**: View orders in Admin → Products → Orders tab
- **Webhooks**: Automatic order status updates

## Testing

### Test Newsletter
1. Add a test subscriber via the newsletter signup form
2. Go to Admin → Newsletter
3. Create a draft and send it
4. Check the email inbox

### Test Store
1. Create a product in Admin → Products
2. Go to `/store` and view products
3. Click "Buy Now" (use Stripe test card: 4242 4242 4242 4242)
4. Complete checkout
5. Check Admin → Products → Orders for the order

## Security Notes

- Admin routes are protected by password (set `ADMIN_PASSWORD` in `.env`)
- Stripe webhooks are verified using webhook signatures
- Newsletter sending is idempotent (prevents double-sends)

## Production Deployment

1. Set `BASE_URL` to your production domain
2. Use production Stripe keys (switch from test to live mode)
3. Verify your domain in Resend
4. Update webhook URL in Stripe dashboard
5. Set strong `ADMIN_PASSWORD`

