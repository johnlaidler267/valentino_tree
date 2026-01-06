const nodemailer = require('nodemailer');

// Create transporter based on environment variables
const createTransporter = () => {
  // For development, you can use a test account or real SMTP
  // Using Gmail as example - user should configure their own SMTP
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
};

const sendClientConfirmation = async (appointment) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: appointment.email,
    subject: 'Appointment Confirmation - Valentino Tree',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Thank you for your appointment request!</h2>
        <p>Dear ${appointment.name},</p>
        <p>We have received your appointment request for tree services. Here are the details:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Service Type:</strong> ${appointment.service_type}</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time}</p>
          <p><strong>Address:</strong> ${appointment.address}</p>
          ${appointment.message ? `<p><strong>Message:</strong> ${appointment.message}</p>` : ''}
        </div>
        <p>We will review your request and confirm the appointment shortly. You will receive another email once your appointment is confirmed.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Valentino Tree Team</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Client confirmation email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending client confirmation email:', error);
    throw error;
  }
};

const sendOwnerNotification = async (appointment) => {
  const transporter = createTransporter();
  const ownerEmail = process.env.OWNER_EMAIL || process.env.SMTP_USER;
  
  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: ownerEmail,
    subject: 'New Appointment Request - Valentino Tree',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">New Appointment Request</h2>
        <p>You have received a new appointment request:</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Name:</strong> ${appointment.name}</p>
          <p><strong>Email:</strong> ${appointment.email}</p>
          <p><strong>Phone:</strong> ${appointment.phone}</p>
          <p><strong>Service Type:</strong> ${appointment.service_type}</p>
          <p><strong>Date:</strong> ${appointment.date}</p>
          <p><strong>Time:</strong> ${appointment.time}</p>
          <p><strong>Address:</strong> ${appointment.address}</p>
          ${appointment.message ? `<p><strong>Message:</strong> ${appointment.message}</p>` : ''}
        </div>
        <p>Please log into the admin dashboard to confirm or manage this appointment.</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Owner notification email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending owner notification email:', error);
    throw error;
  }
};

module.exports = {
  sendClientConfirmation,
  sendOwnerNotification
};

