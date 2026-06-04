const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Gmail SMTP configuration
// You'll need to set up environment variables:
// GMAIL_USER=your-email@gmail.com
// GMAIL_APP_PASSWORD=your-16-character-app-password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Feedback submission endpoint
app.post('/api/feedback', async (req, res) => {
  try {
    const { rating, category, message, timestamp } = req.body;

    // Validate required fields
    if (!message || !rating || !category) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: message, rating, category',
      });
    }

    // Validate message is not empty
    if (message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty',
      });
    }

    // Format the email content
    const emailContent = `
New Feedback Received
====================

Rating: ${rating}/5 ⭐
Category: ${category}
Timestamp: ${timestamp}

Message:
${message}

---
This feedback was submitted through the Word Games app.
    `.trim();

    // Send email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER, // Send to yourself
      subject: `Word Games Feedback - ${category.charAt(0).toUpperCase() + category.slice(1)} (${rating}/5)`,
      text: emailContent,
      html: `
        <h2>New Feedback Received</h2>
        <p><strong>Rating:</strong> ${rating}/5 ⭐</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Timestamp:</strong> ${timestamp}</p>
        <hr />
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <hr />
        <small>This feedback was submitted through the Word Games app.</small>
      `,
    };

    await transporter.sendMail(mailOptions);

    console.log(`Feedback received - ${category} (${rating}/5): ${message.substring(0, 50)}...`);

    res.status(200).json({
      success: true,
      message: 'Feedback sent successfully!',
    });
  } catch (error) {
    console.error('Error sending feedback:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to send feedback. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Word Games Backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Feedback endpoint: POST http://localhost:${PORT}/api/feedback`);

  // Check if Gmail credentials are configured
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️  WARNING: Gmail credentials not configured!');
    console.warn('Set GMAIL_USER and GMAIL_APP_PASSWORD in your .env file');
  }
});
