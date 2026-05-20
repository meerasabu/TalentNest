const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/authMiddleware');

// Multer storage configuration for profile images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Signup Route
router.post('/signup', async (req, res) => {
  const { firstName, lastName, campusEmail, department, graduationYear, password } = req.body;

  try {
    // Check if user already exists
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [campusEmail]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user into database
    const year = graduationYear ? parseInt(graduationYear, 10) : null;
    const newUser = await pool.query(
      `INSERT INTO users (first_name, last_name, email, department, graduation_year, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, first_name, last_name, email, department, graduation_year, role`,
      [firstName, lastName, campusEmail, department, year, passwordHash]
    );

    res.status(201).json({ success: true, user: newUser.rows[0], message: 'Account created successfully.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  const { campusEmail, password } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [campusEmail]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = userResult.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid credentials.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      success: true, 
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        department: user.department,
        graduationYear: user.graduation_year,
        bio: user.bio,
        phoneNumber: user.phone_number,
        campusLocation: user.campus_location,
        skills: user.skills || [],
        profileImage: user.profile_image,
        bannerImage: user.banner_image,
        role: user.role
      },
      message: 'Login successful.' 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

// Update Profile Route
router.put('/profile/:id', verifyToken, upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'bannerImage', maxCount: 1 }]), async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, bio, department, graduationYear, phoneNumber, campusLocation, skills } = req.body;
  
  // Parse ID
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ success: false, message: 'Invalid user ID format.' });
  }

  console.log('--- Profile Update Request ---');
  console.log('User ID:', userId);
  console.log('Body Keys:', Object.keys(req.body));

  try {
    // Basic Validation
    if (!firstName) {
      return res.status(400).json({ success: false, message: 'First name is required.' });
    }

    // Determine image URLs
    let profileImageUrl = req.body.profileImageUrl || null;
    let bannerImageUrl = req.body.bannerImageUrl || null;

    if (req.files && req.files['profileImage']) {
      profileImageUrl = `/uploads/${req.files['profileImage'][0].filename}`;
    }
    if (req.files && req.files['bannerImage']) {
      bannerImageUrl = `/uploads/${req.files['bannerImage'][0].filename}`;
    }

    // Sanitize graduationYear
    const gradYearInt = (graduationYear && graduationYear !== "null" && graduationYear !== "" && graduationYear !== "undefined") ? parseInt(graduationYear, 10) : null;

    // Parse skills
    let skillsArray = [];
    if (skills && skills !== "undefined" && skills !== "null") {
      try {
        skillsArray = typeof skills === 'string' ? JSON.parse(skills) : skills;
      } catch (e) {
        console.error('Error parsing skills JSON:', e);
        skillsArray = [];
      }
    }

    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, bio = $3, department = $4, graduation_year = $5, 
           phone_number = $6, campus_location = $7, skills = $8, profile_image = $9, banner_image = $10
       WHERE id = $11
       RETURNING id, first_name, last_name, email, department, graduation_year, bio, phone_number, campus_location, skills, profile_image, banner_image, role`,
      [firstName, lastName || '', bio || '', department || '', gradYearInt, phoneNumber || '', campusLocation || '', JSON.stringify(skillsArray), profileImageUrl, bannerImageUrl, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const row = result.rows[0];
    const updatedUser = {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      department: row.department,
      graduationYear: row.graduation_year,
      bio: row.bio,
      phoneNumber: row.phone_number,
      campusLocation: row.campus_location,
      skills: row.skills || [],
      profileImage: row.profile_image,
      bannerImage: row.banner_image,
      role: row.role
    };

    console.log('Profile updated successfully for user:', userId);
    res.status(200).json({ success: true, user: updatedUser, message: 'Profile updated successfully.' });
  } catch (error) {
    console.error('CRITICAL Profile update error:', error);
    res.status(500).json({ success: false, message: 'Database error during update.', details: error.message });
  }
});

// Forgot Password - Send OTP
const { sendOtpEmail } = require('../utils/mailer');
router.post('/forgot-password', async (req, res) => {
  const { campusEmail } = req.body;

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [campusEmail]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No registered account found with this email.' });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Save OTP to DB
    await pool.query(
      'UPDATE users SET reset_otp = $1, reset_otp_expires_at = $2 WHERE email = $3',
      [otp, expiresAt, campusEmail]
    );

    // Send OTP via SMTP
    try {
      await sendOtpEmail(campusEmail, otp);
      
      res.status(200).json({
        success: true,
        message: 'Secure 6-digit OTP has been sent to your email address.'
      });
    } catch (mailErr) {
      console.error('SMTP Email dispatch failed:', mailErr.message);
      
      // We could optionally revert the OTP in DB here, but it will expire anyway.
      // Send a clear 500 error to the client indicating the email failed to send.
      res.status(500).json({ 
        success: false, 
        message: 'Failed to send OTP email due to server configuration. Please contact support or check your SMTP settings.' 
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Failed to process forgot password request.' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { campusEmail, otp } = req.body;

  try {
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND reset_otp = $2 AND reset_otp_expires_at > NOW()',
      [campusEmail, otp]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP. Please request a new code.' });
    }

    // Generate brief reset authorization token
    const resetToken = jwt.sign(
      { email: campusEmail, resetAuthorized: true },
      process.env.JWT_SECRET,
      { expiresIn: '10m' } // 10 minutes limit to complete password change
    );

    // Optional: Clear OTP immediately upon verification
    await pool.query('UPDATE users SET reset_otp = NULL, reset_otp_expires_at = NULL WHERE email = $1', [campusEmail]);

    res.status(200).json({
      success: true,
      resetToken,
      message: 'OTP verified successfully. Please create a new password.'
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP.' });
  }
});

// Secure Password Reset
router.post('/reset-password', async (req, res) => {
  const { campusEmail, resetToken, newPassword } = req.body;

  try {
    // Verify the temporary authorization token
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Invalid or expired reset session. Please try again.' });
    }

    if (decoded.email !== campusEmail || !decoded.resetAuthorized) {
      return res.status(403).json({ success: false, message: 'Unauthorized reset request.' });
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const updateResult = await pool.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id',
      [passwordHash, campusEmail]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully! Redirecting to Sign In...'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

module.exports = router;
