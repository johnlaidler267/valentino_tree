# Tree Services Booking Website

A full-stack web application for a tree services business that allows clients to easily book appointments and provides an admin dashboard for managing appointments.

> **📦 Want to deploy this site?** See [HOSTING.md](./HOSTING.md) for comprehensive hosting instructions.

## Features

- **Client Booking**: Simple, user-friendly form for booking tree service appointments
- **Admin Dashboard**: Secure admin interface to view, filter, update, and delete appointments
- **Email Notifications**: Automatic email confirmations to clients and notifications to business owner
- **Minimalistic Design**: Clean, professional, and responsive UI
- **Database Storage**: SQLite (development) or PostgreSQL (production) database support

## Technology Stack

- **Frontend**: React 18, React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (development) / PostgreSQL (production)
- **Email**: Nodemailer

## Project Structure

```
valentino_tree/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx
│   │   │   ├── BookingForm.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── backend/           # Node.js/Express backend
│   ├── routes/
│   │   ├── appointments.js
│   │   └── admin.js
│   ├── models/
│   │   └── database.js
│   ├── config/
│   │   └── email.js
│   ├── server.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- An email account for sending notifications (Gmail recommended for testing)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```env
   # Server Configuration
   PORT=5000

   # Database Configuration
   DB_PATH=./appointments.db

   # Email Configuration (SMTP)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your-email@gmail.com

   # Owner Email (for notifications)
   OWNER_EMAIL=owner@example.com

   # Admin Password
   ADMIN_PASSWORD=admin123
   ```

   **Note for Gmail users**: You'll need to generate an "App Password" instead of using your regular password:
   - Go to your Google Account settings
   - Enable 2-Step Verification
   - Generate an App Password for "Mail"
   - Use that App Password in `SMTP_PASS`

4. Start the backend server:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:5000` (or the port specified in your `.env` file).

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the frontend directory (optional, defaults to `http://localhost:5000`):
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   ```

4. Start the development server:
   ```bash
   npm start
   ```

   The frontend will run on `http://localhost:3000` and automatically open in your browser.

## Usage

### For Clients

1. Visit the homepage to view available services
2. Click "Book Appointment" in the navigation
3. Fill out the booking form with:
   - Personal information (name, email, phone)
   - Service type
   - Preferred date and time
   - Service address
   - Optional message
4. Submit the form
5. Receive a confirmation email

### For Administrators

1. Navigate to the Admin page
2. Enter the admin password (set in backend `.env` file)
3. View all appointments in a table format
4. Use the search box to find specific appointments
5. Filter appointments by status (pending, confirmed, completed, cancelled)
6. Update appointment status using the dropdown in each row
7. Delete appointments using the Delete button

## API Endpoints

### Public Endpoints

- `POST /api/appointments` - Create a new appointment
  - Body: `{ name, email, phone, service_type, date, time, address, message? }`

### Protected Endpoints (Require Admin Password)

- `GET /api/appointments` - Get all appointments
  - Headers: `x-admin-password: <admin-password>`
- `PUT /api/appointments/:id` - Update appointment status
  - Headers: `x-admin-password: <admin-password>`
  - Body: `{ status: 'pending' | 'confirmed' | 'completed' | 'cancelled' }`
- `DELETE /api/appointments/:id` - Delete an appointment
  - Headers: `x-admin-password: <admin-password>`
- `POST /api/admin/login` - Verify admin password
  - Body: `{ password: <admin-password> }`

## Database Schema

The `appointments` table contains the following fields:

- `id` - Primary key (auto-increment)
- `name` - Client's full name
- `email` - Client's email address
- `phone` - Client's phone number
- `service_type` - Type of service requested
- `date` - Preferred appointment date
- `time` - Preferred appointment time
- `address` - Service address
- `message` - Optional additional message
- `status` - Appointment status (pending, confirmed, completed, cancelled)
- `created_at` - Timestamp of when the appointment was created

## Email Configuration

The application sends two types of emails:

1. **Client Confirmation**: Sent to the client when they book an appointment
2. **Owner Notification**: Sent to the business owner when a new appointment is created

Both emails are sent using the SMTP configuration in the backend `.env` file. If email sending fails, the appointment will still be saved to the database.

## Security Notes

- The admin password is stored in environment variables and should be kept secure
- In production, consider implementing more robust authentication (JWT tokens, session management)
- The admin password is sent in request headers - consider using HTTPS in production
- SQLite is suitable for development and small deployments; consider PostgreSQL or MySQL for production

## Troubleshooting

### Backend Issues

- **Database errors**: Ensure the backend directory has write permissions for creating the SQLite database file
- **Email not sending**: Verify your SMTP credentials and that your email provider allows SMTP access
- **Port already in use**: Change the `PORT` in your `.env` file

### Frontend Issues

- **API connection errors**: Ensure the backend is running and the `REACT_APP_API_URL` matches your backend URL
- **CORS errors**: The backend has CORS enabled, but ensure both servers are running

## Production Deployment

For production deployment:

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Serve the built files using a static file server or integrate with the Express backend

3. Use environment-specific `.env` files

4. Consider using a production database (PostgreSQL, MySQL) instead of SQLite

5. Set up proper HTTPS/SSL certificates

6. Implement more robust authentication and authorization

## License

This project is open source and available for use.

## Support

For issues or questions, please check the code comments or create an issue in the repository.

