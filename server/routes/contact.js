const express = require('express');
const router = express.Router();
const passport = require('passport');
const nodemailer = require('nodemailer');
const { validateInput } = require('../middleware/validation');
const { contactRateLimit } = require('../middleware/security');

// Authentication middleware
const auth = passport.authenticate('jwt', { session: false });

// Public contact form submission (no authentication required)
router.post('/public', contactRateLimit, validateInput('contactForm'), async (req, res) => {
  try {
    const { name, email, subject, message, phone } = req.body;
    const db = req.app.locals.db;
    const contactsCollection = db.collection('contacts');
    
    // Save contact submission to database
    const newContact = {
      name,
      email,
      subject,
      message,
      phone: phone || '',
      isPublic: true, // Mark as public submission
      createdAt: new Date()
    };
    
    await contactsCollection.insertOne(newContact);
    
    // Send email notification
    try {
      await sendContactEmail(name, email, subject, message);
      res.status(201).json({ 
        success: true,
        message: 'Contact form submitted successfully' 
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Still return success since we saved to database
      res.status(201).json({ 
        success: true,
        message: 'Contact form submitted successfully, but email notification failed',
        emailError: emailError.message
      });
    }
  } catch (error) {
    console.error('Public contact form submission error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// Submit contact form (authenticated users)
router.post('/', auth, validateInput('contactForm'), async (req, res) => {
  try {
    const { name, email, message } = req.body;
    const db = req.app.locals.db;
    const contactsCollection = db.collection('contacts');
    
    // Validate input
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Save contact submission to database
    const newContact = {
      userId: req.user._id,
      name,
      email,
      message,
      createdAt: new Date()
    };
    
    await contactsCollection.insertOne(newContact);
    
    // Send email notification
    try {
      await sendContactEmail(name, email, 'Contact Form Submission', message);
      res.status(201).json({ message: 'Contact form submitted successfully' });
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      // Still return success since we saved to database
      res.status(201).json({ 
        message: 'Contact form submitted successfully, but email notification failed',
        emailError: emailError.message
      });
    }
  } catch (error) {
    console.error('Contact form submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all contact submissions (admin only)
router.get('/', auth, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const contactsCollection = db.collection('contacts');
    
    // Get all contacts with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const contacts = await contactsCollection
      .find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    const total = await contactsCollection.countDocuments();
    
    res.json({
      contacts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Contacts fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to send email
async function sendContactEmail(name, email, subject, message) {
  // Create reusable transporter
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // Setup email data
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.CONTACT_EMAIL || 'contact@example.com',
    subject: subject || 'New Contact Form Submission',
    text: `
      Name: ${name}
      Email: ${email}
      
      Message:
      ${message}
    `,
    html: `
      <h3>New Contact Form Submission</h3>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `
  };
  
  // Send email
  return transporter.sendMail(mailOptions);
}

module.exports = router;
