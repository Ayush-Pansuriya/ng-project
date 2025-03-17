const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const User = require('../schema/user');

const router = express.Router();
const JWT_SECRET = 'your_jwt_secret'; 

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your email',
    pass: ''    //you get it from google account settings app security do not share with anyone and enable 2 step verification
  }
});

// Verify transporter configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email transporter is ready');
  }
});

// Temporary OTP storage
const otpStore = new Map();

// Generate a 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
// In auth.js, update sendOTPEmail function
const sendOTPEmail = async (email, otp) => {
  try {
    const mailOptions = {
      from: '', // Must match transporter.user
      to: email,
      subject: 'Your Registration OTP',
      text: '[E-Commerce] Your One-Time Password (OTP) Code',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #121212; color: #fff; padding: 20px; border-radius: 8px; max-width: 600px; margin: auto;">
        <h2 style="color: #4A90E2;">Your One-Time Password (OTP)</h2>
        <p>Dear User,</p>
        <p>Please use the following One-Time Password (OTP) to complete your action. For your security, do not share this code with anyone.</p>
        <div style="background-color: #2D2D2D; padding: 10px; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0;">
          ${otp}
        </div>
        <p>If you did not request this, please ignore this email or contact support if you suspect any issues.</p>
        <p>Best Regards,<br><a href="#" style="color: #4A90E2; text-decoration: none;">E-Commerce Team</a></p>
  </div>`
    };
    const info = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', {
      messageId: info.messageId,
      from: mailOptions.from,
      to: mailOptions.to,
      response: info.response
    });
    return info;
  } catch (error) {
    console.error('Failed to send OTP email:', error);
    throw error;
  }
};

// Step 1: Send OTP
router.post('/register/send-otp', async (req, res) => {
  try {
    console.log('Received /send-otp request:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOTP();
    console.log('Generated OTP:', otp);
    otpStore.set(email, { otp, password, expires: Date.now() + 5 * 60 * 1000 });

    await sendOTPEmail(email, otp);
    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Error in /register/send-otp:', error.message, error.stack);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Step 2: Verify OTP and Register
router.post('/register/verify-otp', async (req, res) => {
  try {
    console.log('Received /verify-otp request:', req.body);
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ message: 'OTP not requested or expired' });
    }

    if (storedData.otp !== otp || Date.now() > storedData.expires) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(storedData.password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      role: 'user'
    });
    await user.save();
    console.log('User saved:', user._id);

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    otpStore.delete(email);
    res.status(201).json({ message: 'Registration successful', token });
  } catch (error) {
    console.error('Error in /register/verify-otp:', error.message, error.stack);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Existing login route
router.post('/login', async (req, res) => {
  try {
    console.log('Received /login request:', req.body);
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.status(200).json({ message: 'Login successful', token });
  } catch (error) {
    console.error('Error in /login:', error.message, error.stack);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

// Step 2: Verify OTP and Register
router.post('/register/verify-otp/admin', async (req, res) => {
  try {
    console.log('Received /verify-otp request:', req.body);
    const already = await User.findOne({ email });
    if (already) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const { email, otp } = req.body;
    

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP are required' });
    }

    const storedData = otpStore.get(email);
    if (!storedData) {
      return res.status(400).json({ message: 'OTP not requested or expired' });
    }

    if (storedData.otp !== otp || Date.now() > storedData.expires) {
      otpStore.delete(email);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    const hashedPassword = await bcrypt.hash(storedData.password, 10);
    const user = new User({
      email,
      password: hashedPassword,
      role: 'admin'
    });
    await user.save();
    console.log('User saved:', user._id);

    const token = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    otpStore.delete(email);
    res.status(201).json({ message: 'Registration successful', token });
  } catch (error) {
    console.error('Error in /register/verify-otp:', error.message, error.stack);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;