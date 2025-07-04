// controllers/user.controller.js
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const Log = require('../models/log'); // make sure this is at the top
const Review = require('../models/review');
const logger = require('../utils/logger');
const verificationEmailTemplate = require('../utils/emailTemplates/vertification')
const resendverificationEmailTemplate = require('../utils/emailTemplates/resendverification')
const forgotpasswordEmailTemplate = require('../utils/emailTemplates/forgotpassword')
const resetpasswordEmailTemplate = require('../utils/emailTemplates/resetpassword')

// 🔐 Generate a signed JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
};



const admin = require('firebase-admin');
// const serviceAccount = require('../document-review-system-firebase-adminsdk-fbsvc-3e2832d831.json'); // 🔐 Path to your Firebase Admin SDK JSON
const serviceAccount = process.env.FIREBASE_CREDENTIAL_PATH; // 🔐 Path to your Firebase Admin SDK JSON

// ⚙️ Initialize Firebase Admin once globally
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ @desc    Register a new user
// ✅ @route   POST /api/users/register
// ✅ @access  Public
exports.registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      preferredVerificationMethod = 'email',
    } = req.body;

    // 1️⃣ Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const userPhoneExists = await User.findOne({ phone });
    if (userPhoneExists) {
      return res.status(400).json({ message: 'User Phone Number Already exists' });
    }

    // 2️⃣ Generate OTP (for email or fallback SMS)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Create user with appropriate OTP fields
    const user = await User.create({
      name,
      email,
      phone: phone || null,
      password,
      isVerified: false,
      preferredVerificationMethod,
      emailVerificationOTP: preferredVerificationMethod === 'email' ? otp : undefined,
      emailVerificationExpire: preferredVerificationMethod === 'email' ? Date.now() + 15 * 60 * 1000 : undefined,
      phoneVerificationOTP: preferredVerificationMethod === 'phone' ? otp : undefined,
      phoneVerificationExpire: preferredVerificationMethod === 'phone' ? Date.now() + 15 * 60 * 1000 : undefined,
    });

    // 4️⃣ Handle Email Verification
    if (preferredVerificationMethod === 'email') {

      const { subject, htmlBody } = verificationEmailTemplate(user , otp);
      
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject,
        html: htmlBody,
      });

    } else {
      // 5️⃣ Firebase Phone Auth (SMS is handled client-side)
      if (!user.phone) {
        return res.status(400).json({ message: 'Phone number is required for SMS verification' });
      }

      // 🔐 Firebase handles SMS sending via client-side SDK
      // So here we just return response and expect frontend to trigger phone auth
    }

    // 6️⃣ Log registration
    const logEntry = {
      action: 'register',
      message: `${user.role === 'admin' ? 'Admin' : 'User'} ${user.name} With Email ${user.email} Was Registered`,
    };
    if (user.role === 'admin') logEntry.admin = user;
    else logEntry.user = user;
    await Log.create(logEntry);

    // 7️⃣ Respond to client
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: false,
      token: generateToken(user._id),
      preferredVerificationMethod: user.preferredVerificationMethod,
      message:
        preferredVerificationMethod === 'email'
          ? 'User registered. Please verify your email using the OTP sent.'
          : 'User registered. Please verify your phone number via Firebase Phone Authentication.',
    });
  } catch (error) {
    console.error('Register Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// ✅ @desc    Verify account with OTP (email or phone)
// ✅ @route   POST /api/users/verify
// ✅ @access  Public
exports.verifyAccount = async (req, res) => {
  const { email, otp, firebaseIdToken } = req.body; // 🔁 Include Firebase ID token

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

    const now = Date.now();

    // 1️⃣ Email-based verification
    if (user.preferredVerificationMethod === 'email') {
      if (
        !user.emailVerificationOTP ||
        user.emailVerificationOTP !== otp ||
        user.emailVerificationExpire < now
      ) {
        return res.status(400).json({ message: 'Invalid or expired OTP for email verification' });
      }

      user.isVerified = true;
      user.emailVerificationOTP = undefined;
      user.emailVerificationExpire = undefined;
    }

    // 2️⃣ Phone-based verification using Firebase
    else if (user.preferredVerificationMethod === 'phone') {
      // 🔐 Validate Firebase ID token sent from the frontend
      if (!firebaseIdToken) {
        return res.status(400).json({ message: 'Firebase token is required for phone verification' });
      }

      // ✅ Verify the token with Firebase Admin SDK
      let decoded;
      try {
        decoded = await admin.auth().verifyIdToken(firebaseIdToken);
      } catch (err) {
        logger.error(err.message);
        return res.status(400).json({ message: 'Invalid or expired Firebase token' });
      }

      // ✅ Ensure phone number matches the registered user
      if (!decoded.phone_number || decoded.phone_number !== user.phone) {
        return res.status(400).json({ message: 'Phone number mismatch with registered account' });
      }

      // ✅ Verified successfully
      user.isVerified = true;
      user.phoneVerificationOTP = undefined;
      user.phoneVerificationExpire = undefined;
    }

    await user.save();

    // ✅ Log the verification
    await Log.create({
      action: 'verifyEmail',
      [user.role === 'admin' ? 'admin' : 'user']: user,
      message: `${user.role === 'admin' ? 'Admin' : 'User'} ${user.name} With Email ${user.email} Verified Their Account`,
    });

    res.json({ message: 'Account verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Account Verification Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error during verification' });
  }
};


// ✅ @desc    Resend verification OTP (email or phone)
// ✅ @route   POST /api/users/resend-verification
// ✅ @access  Public
exports.resendVerificationOTP = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'Account already verified' });

    const now = Date.now();

    // ⏱️ Cooldown enforcement
    const lastResend = user.lastOTPResend || 0;
    const cooldown = 2 * 60 * 1000;
    const timeRemaining = cooldown - (now - lastResend);

    if (timeRemaining > 0) {
      const waitSeconds = Math.ceil(timeRemaining / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSeconds} seconds before requesting another OTP.`,
        remainingSeconds: waitSeconds,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = now + 15 * 60 * 1000;

    // 🔁 Update OTP fields in DB
    if (user.preferredVerificationMethod === 'email') {
      user.emailVerificationOTP = otp;
      user.emailVerificationExpire = expiresAt;
    } else {
      user.phoneVerificationOTP = otp;
      user.phoneVerificationExpire = expiresAt;
    }

    user.lastOTPResend = now;
    await user.save();

    // ✉️ Send Email
    if (user.preferredVerificationMethod === 'email') {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const { subject, htmlBody } = resendverificationEmailTemplate(user , otp);

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html: htmlBody,
      });
    }

    // 📲 Send SMS via Firebase (uses custom OTP for unified logic)
    else {
      if (!user.phone) {
        return res.status(400).json({ message: 'Phone number is missing' });
      }

      // Firebase cannot send OTP directly. You simulate it by sending the OTP via a 3rd-party SMS service.
      // Since Firebase doesn't provide SMS in Admin SDK, you must use a client-side flow or fallback SMS service (e.g. Vonage, AWS SNS).
      // For now, we log the OTP to the console for manual testing.
      console.log(`📲 Firebase OTP for ${user.phone}: ${otp}`);
    }

    // 📝 Log the resend attempt
    await Log.create({
      action: 'register',
      [user.role === 'admin' ? 'admin' : 'user']: user,
      message: `${user.role === 'admin' ? 'Admin' : 'User'} ${user.name} With Email ${user.email} Requested a new OTP`,
    });

    res.json({ message: 'New OTP sent successfully (email or SMS)' });
  } catch (error) {
    console.error('Resend OTP Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error during resend' });
  }
};


// ✅ @desc    Login user & get token
// ✅ @route   POST /api/users/login
// ✅ @access  Public

exports.loginUser = async (req, res) => {
  try {

    
    const { email, password } = req.body;
    
    console.log('📩 Login attempt with:', email);
    
    const user = await User.findOne({ email });

    if (!user) {
      console.log('❌ User not found in DB');
      logger.error("User not found in DB");
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('✅ User found:', user.email);
    
    if (!user.isVerified && user.role === "user") {
      return res.status(403).json({ message: 'Please verify your email before logging in.' });
    }
    
    console.log('✅ User Is Verified:', user.email);

    const isMatch = await user.matchPassword(password);
    console.log('🔐 Password match:', isMatch);

    if (!isMatch) {
      console.log('❌ Password mismatch');
      logger.error("Password mismatch");
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('🎉 Login successful');

    // ✅ Log the login
    if (user.role === 'admin') {
      await Log.create({
        action: 'login',
        admin: user,
        message: `Admin ${user.name} With Email ${user.email} Logged In`,
      });
    } else {
      await Log.create({
        action: 'login',
        user: user,
        message: `User ${user.name} With Email ${user.email} Logged In`,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
      preferredVerificationMethod: user.preferredVerificationMethod,
      verificationStatus: user.verificationStatus,
      isVerified: true,
    });
  } catch (error) {
    console.error('Login Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


// ✅ @desc    Logout user (log the event)
// ✅ @route   POST /api/users/logout
// ✅ @access  Private
exports.logoutUser = async (req, res) => {
  try {
    const Log = require('../models/log');

    // ✅ Log the logout

    const { email} = req.body;

    console.log('📩 Logout attempt with:', email);

    const user = await User.findOne({ email });

    if (user.role === 'admin') {
      await Log.create({
        action: 'logout',
        admin: user,
        message: `Admin ${user.name} With Email ${user.email} logged Out`,
      });
    } else {
      await Log.create({
        action: 'logout',
        user: user,
        message: `User ${user.name} With Email ${user.email} logged Out`,
      });
    }
  
    res.json({ message: 'Logout successful' });
  } catch (err) {
    console.error('Logout Logging Error:', err.message);
    logger.error(err.message);
    res.status(500).json({ message: 'Logout failed' });
  }
};


// ✅ @desc    Send OTP to email or phone for password reset
// ✅ @route   POST /api/users/forgot-password
// ✅ @access  Public
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // 1️⃣ Find the user
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2️⃣ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Set OTP and expiration (15 minutes)
    user.resetPasswordOTP = otp;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // 4️⃣ Create reusable transporter for email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });


    const { subject, htmlBody } = forgotpasswordEmailTemplate(user,otp);

    // 6️⃣ Decide which method to send OTP (email or phone)
    if (user.preferredVerificationMethod === 'email') {
      // 👉 Send via email
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject,
        html: htmlBody,
      });
    } else {
      // 👉 Send via Firebase (simulated SMS for password reset)
      if (!user.phone) {
        return res.status(400).json({ message: 'Phone number is missing for SMS verification' });
      }

      // ❗ Firebase Admin SDK cannot send SMS itself — frontend handles that.
      // 🔐 So we simulate it by logging to console or sending via a 3rd-party SMS service (like Vonage).
      // ⚠️ This OTP should be sent to the user’s phone securely in real apps.
      console.log(`📲 Firebase OTP for ${user.phone}: ${otp}`);
    }

    // 7️⃣ Log the password reset attempt
    await Log.create({
      action: 'forgotPassword',
      [user.role === 'admin' ? 'admin' : 'user']: user,
      message: `${user.role === 'admin' ? 'Admin' : 'User'} ${user.name} With Email ${user.email} Is Attempting A Forgot Password`,
    });

    // console.log(otp); // helpful for testing
    res.json({ message: 'OTP sent via email or phone' });
  } catch (error) {
    console.error('Forgot Password Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ @desc    Reset password with OTP
// ✅ @route   POST /api/users/reset-password
// ✅ @access  Public
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // 1️⃣ Find the user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found in DB');
      logger.error(' User not found in DB');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2️⃣ Prevent reusing old password
    const isMatch = await user.matchPassword(newPassword);
    if (isMatch) {
      console.log('❌ The New Password is matching the old one');
      logger.error(' The New Password is matching the old one');
      return res.status(401).json({ message: 'The New Password is matching the old one' });
    }

    // 3️⃣ Check OTP validity (both for email and phone-based flows)
    if (
      !user.resetPasswordOTP ||
      user.resetPasswordOTP !== otp ||
      user.resetPasswordExpire < Date.now()
    ) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // 4️⃣ Set new password and clear OTP fields
    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // 5️⃣ Log the password reset
    if (user.role === 'admin') {
      await Log.create({
        action: 'resetPassword',
        admin: user,
        message: `Admin ${user.name} With Email ${user.email} Is Attempting To Reset His/Her Password`,
      });
    } else {
      await Log.create({
        action: 'resetPassword',
        user: user,
        message: `User ${user.name} With Email ${user.email} Is Attempting To Reset His/Her Password`,
      });
    }

    // 6️⃣ Send confirmation email (applies to all, not only email-based OTP)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const { subject, htmlBody } = resetpasswordEmailTemplate(user);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject,
      html: htmlBody,
    });

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ✅ @desc    Get all documents submitted by the logged-in user
// ✅ @route   GET /api/documents/my-submissions
// ✅ @access  Private (Authenticated users only)

exports.getMyDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      fileName,
      title,
      description,
      category,
      status,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 🔍 Build dynamic filter based on query
    const filter = {
      'user._id': req.user._id, // Only the logged-in user's documents
    };

    if (fileName) {
      filter.fileName = { $regex: fileName, $options: 'i' };
    }
    if (title) {
      filter.title = { $regex: title, $options: 'i' };
    }
    if (description) {
      filter.description = { $regex: description, $options: 'i' };
    }
    if (category) {
      filter.category = { $regex: category, $options: 'i' };
    }
    if (status) {
      filter.status = status.toLowerCase(); // Must be one of the enum values
    }

    const totalDocuments = await Document.countDocuments(filter);
    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

      await Log.create({
        action: 'GetAllPersonalDocs',
        user: req.user,
        message: `User ${req.user.name} With Email ${req.user.email} Is Attempting To View All His / Her Submitted Documents' Data`,
      });

    res.status(200).json({
      pagination: {
        totalDocuments,
        totalPages: Math.ceil(totalDocuments / limit),
        currentPage: parseInt(page),
      },
      documents,
    });
  } catch (error) {
    console.error('Get My Documents Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error retrieving documents' });
  }
};



// controllers/user.controller.js
const Document = require('../models/document');

// ✅ @desc    Get stats for all regular users
// ✅ @route   GET /api/users/stats
// ✅ @access  Admin only
exports.getAllUserStats = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, email, createdAfter, createdBefore } = req.query;

    // 🔍 Build dynamic filters
    const filter = { role: 'user' };

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }

    if (createdAfter || createdBefore) {
      filter.createdAt = {};
      if (createdAfter) filter.createdAt.$gte = new Date(createdAfter);
      if (createdBefore) filter.createdAt.$lte = new Date(createdBefore);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 📊 Count for pagination metadata
    const totalUsers = await User.countDocuments(filter);

    // 🔁 Get paginated users
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 📄 Gather document stats per user
    const userStats = await Promise.all(
      users.map(async (user) => {
        // const documents = await Document.find({ user: user._id });
        const documents = await Document.find({ 'user._id': user._id });

        const pending = documents.filter((doc) => doc.status === 'pending');
        const approved = documents.filter((doc) => doc.status === 'approved');
        const rejected = documents.filter((doc) => doc.status === 'rejected');

        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          totalDocuments: documents.length,
          pendingCount: pending.length,
          approvedCount: approved.length,
          rejectedCount: rejected.length,
          pendingDocuments: pending,
          approvedDocuments: approved,
          rejectedDocuments: rejected,
        };
      })
    );

    await Log.create({
      action: 'GetAllUsersStats',
      user: req.user,
      // document : document,
      message: `Admin ${req.user.name} With Email ${req.user.email} Attempted To View All The Users Data`,
    });

    // 📦 Response with pagination meta
    res.status(200).json({
      pagination: {
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit),
        currentPage: parseInt(page),
      },
      users: userStats,
    });
  } catch (error) {
    console.error('User Stats Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error fetching user stats' });
  }
};


exports.getAdminStats = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const keyword = req.query.keyword
      ? {
          $or: [
            { name: { $regex: req.query.keyword, $options: 'i' } },
            { email: { $regex: req.query.keyword, $options: 'i' } },
          ],
        }
      : {};

    const createdFilter = {};
    if (req.query.createdAfter) {
      createdFilter.$gte = new Date(req.query.createdAfter);
    }
    if (req.query.createdBefore) {
      createdFilter.$lte = new Date(req.query.createdBefore);
    }

    const dateRange =
      Object.keys(createdFilter).length > 0 ? { createdAt: createdFilter } : {};

    const query = { role: 'admin', ...keyword, ...dateRange };

    const totalAdmins = await User.countDocuments(query);
    const admins = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    const adminStats = await Promise.all(
      admins.map(async (admin) => {
        const reviews = await Review.find({"reviewedBy._id": admin._id})
          .populate({
            path: 'document',
            model: 'Document', // make sure this matches your actual model name
            select: '-__v -updatedAt',
            strictPopulate: false,
          });

        const approved = reviews.filter((r) => r.status === 'approved' && r.document);
        const rejected = reviews.filter((r) => r.status === 'rejected' && r.document);
        const pending = reviews.filter((r) => r.status === 'pending' && r.document);

        return {
          adminId: admin._id,
          name: admin.name,
          email: admin.email,
          createdAt: admin.createdAt,
          totalReviewed: reviews.length,
          approvedCount: approved.length,
          rejectedCount: rejected.length,
          pendingCount: pending.length,
          approvedDocuments: approved,  // includes full review + document
          rejectedDocuments: rejected,
          pendingDocuments: pending,
        };
      })
    );


    await Log.create({
      action: 'GetAllAdminsStats',
      user: req.user,
      // document : document,
      message: `Admin ${req.user.name} With Email ${req.user.email} Attempted To View All The Admins' Statistics`,
    });

    res.status(200).json({
      admins: adminStats,
      pagination: {
        total: totalAdmins,
        page,
        limit,
        pages: Math.ceil(totalAdmins / limit),
      },
    });
  } catch (error) {
    console.error('Admin Stats Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error fetching admin stats' });
  }
};
