# Hosting Guide for Valentino Tree Website

This guide covers multiple hosting options for your full-stack application, from easiest to more advanced setups.

## Quick Overview

Your application consists of:
- **Frontend**: React app (static files after build)
- **Backend**: Node.js/Express API server
- **Database**: SQLite (file-based)

## Option 1: Railway (Recommended - Easiest)

Railway is great for full-stack apps and offers a free tier.

### Steps:

1. **Sign up** at [railway.app](https://railway.app)

2. **Install Railway CLI** (optional, but helpful):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

3. **Deploy Backend**:
   - Create a new project in Railway
   - Connect your GitHub repository
   - Add a new service → Select `backend` folder
   - Railway will auto-detect Node.js
   - Add environment variables in Railway dashboard:
     ```
     PORT=5000
     ADMIN_PASSWORD=your-secure-password
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_SECURE=false
     SMTP_USER=your-email@gmail.com
     SMTP_PASS=your-app-password
     SMTP_FROM=your-email@gmail.com
     OWNER_EMAIL=your-email@gmail.com
     ```
   - Railway will provide a URL like: `https://your-backend.railway.app`

4. **Deploy Frontend**:
   - Add another service → Select `frontend` folder
   - Set build command: `npm run build`
   - Set start command: `npx serve -s build -l 3000`
   - Add environment variable:
     ```
     REACT_APP_API_URL=https://your-backend.railway.app/api
     ```
   - Install `serve` package: Add to `frontend/package.json`:
     ```json
     "scripts": {
       "start": "react-scripts start",
       "build": "react-scripts build",
       "serve": "serve -s build -l 3000"
     }
     ```

**Note**: For SQLite on Railway, the database file persists in the service's filesystem, but consider upgrading to PostgreSQL for production.

---

## Option 2: Render (Free Tier Available)

Render offers free hosting with some limitations.

### Steps:

1. **Sign up** at [render.com](https://render.com)

2. **Deploy Backend**:
   - New → Web Service
   - Connect your GitHub repo
   - Settings:
     - **Name**: `valentino-tree-backend`
     - **Root Directory**: `backend`
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: Node
   - Add environment variables (same as Railway)
   - Render provides: `https://your-backend.onrender.com`

3. **Deploy Frontend**:
   - New → Static Site
   - Connect GitHub repo
   - Settings:
     - **Root Directory**: `frontend`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `build`
   - Add environment variable:
     ```
     REACT_APP_API_URL=https://your-backend.onrender.com/api
     ```

**Note**: Free tier services spin down after inactivity. Consider paid tier for production.

---

## Option 3: Vercel (Frontend) + Railway/Render (Backend)

Best for separating concerns and using Vercel's excellent frontend hosting.

### Frontend on Vercel:

1. **Sign up** at [vercel.com](https://vercel.com)

2. **Deploy**:
   - Import your GitHub repository
   - Settings:
     - **Root Directory**: `frontend`
     - **Framework Preset**: Create React App
     - **Build Command**: `npm run build`
     - **Output Directory**: `build`
   - Add environment variable:
     ```
     REACT_APP_API_URL=https://your-backend-url.com/api
     ```

3. **Backend**: Deploy separately on Railway or Render (see Option 1 or 2)

---

## Option 4: Fly.io (Good for SQLite)

Fly.io works well with SQLite and offers persistent volumes.

### Steps:

1. **Install Fly CLI**:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Deploy Backend**:
   ```bash
   cd backend
   fly launch
   ```
   - Follow prompts
   - Create `fly.toml` in backend folder (Fly will generate it)
   - Add environment variables:
     ```bash
     fly secrets set ADMIN_PASSWORD=your-password
     fly secrets set SMTP_USER=your-email@gmail.com
     # ... etc
     ```

4. **Deploy Frontend**:
   - Similar process, or use Vercel/Netlify for frontend

---

## Option 5: Traditional VPS (DigitalOcean, Linode, AWS EC2)

For more control, use a VPS.

### Steps:

1. **Create a VPS** (Ubuntu 22.04 recommended)

2. **SSH into server**:
   ```bash
   ssh root@your-server-ip
   ```

3. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2** (process manager):
   ```bash
   sudo npm install -g pm2
   ```

5. **Clone and setup**:
   ```bash
   git clone your-repo-url
   cd valentino_tree
   
   # Backend
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your values
   pm2 start server.js --name "valentino-backend"
   pm2 save
   pm2 startup
   
   # Frontend
   cd ../frontend
   npm install
   npm run build
   # Serve with nginx or PM2
   ```

6. **Setup Nginx** (reverse proxy):
   ```bash
   sudo apt install nginx
   ```
   
   Create `/etc/nginx/sites-available/valentino-tree`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       # Frontend
       location / {
           root /path/to/valentino_tree/frontend/build;
           try_files $uri $uri/ /index.html;
       }
       
       # Backend API
       location /api {
           proxy_pass http://localhost:5000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/valentino-tree /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **Setup SSL** (Let's Encrypt):
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## Important Considerations

### Database (SQLite → PostgreSQL for Production)

For production, consider migrating to PostgreSQL:

1. **Install PostgreSQL** on your server or use a managed service
2. **Update backend** to use `pg` instead of `sqlite3`
3. **Update database.js** to use PostgreSQL connection

### Environment Variables

Always keep these secure:
- Never commit `.env` files
- Use hosting platform's environment variable settings
- Use strong `ADMIN_PASSWORD`

### CORS Configuration

If frontend and backend are on different domains, ensure CORS is properly configured (already done in your code).

### Email Service

For production, consider:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very affordable)

Update `backend/config/email.js` to use these services.

### Domain Name

1. Purchase domain (Namecheap, GoDaddy, etc.)
2. Point DNS to your hosting provider
3. Update environment variables with your domain

---

## Quick Deploy Checklist

- [ ] Backend deployed and accessible
- [ ] Frontend built and deployed
- [ ] Environment variables set correctly
- [ ] API URL configured in frontend
- [ ] Database accessible (SQLite file or PostgreSQL)
- [ ] Email service configured
- [ ] Domain name configured (optional)
- [ ] SSL certificate installed (HTTPS)
- [ ] Test booking flow end-to-end
- [ ] Test admin dashboard access

---

## Recommended Setup for Production

**Best Combination:**
- **Frontend**: Vercel (free, fast, easy)
- **Backend**: Railway or Render (free tier available)
- **Database**: PostgreSQL on Railway/Render or separate managed database
- **Email**: SendGrid or Mailgun
- **Domain**: Point to Vercel frontend

This gives you:
- ✅ Free hosting (with limitations)
- ✅ Easy deployment
- ✅ Automatic SSL
- ✅ Good performance
- ✅ Easy scaling

---

## Need Help?

- Check hosting provider's documentation
- Verify environment variables are set correctly
- Check server logs for errors
- Ensure ports are open (if using VPS)
- Test API endpoints directly with Postman/curl

