// controllers/user.controller.js
// const crypto = require('crypto');
const { customAlphabet } = require('nanoid');

const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);
const InviteCode = require('../models/InviteCode');

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
const Document = require('../models/document');

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

// const admin = require("firebase-admin");

// const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;

// if (!serviceAccountJson) {
//   console.error("❌ Missing Firebase service account environment variable.");
//   process.exit(1);
// }

// admin.initializeApp({
//   credential: admin.credential.cert(JSON.parse(serviceAccountJson))
// });


// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

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
      inviteCode,
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

    // ✅ Check invite code
    const codeDoc = await InviteCode.findOne({ code: inviteCode, status: 'unused' });
    if (!codeDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or already used invite code.',
      });
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


        // ✅ Mark code as used
    codeDoc.status = 'used';
    codeDoc.usedBy = (({ _id, email, name, role, phone, isVerified , preferredVerificationMethod }) => ({ _id, email, name, role, phone, isVerified ,preferredVerificationMethod }))(user);
    codeDoc.usedAt = new Date();
    await codeDoc.save();

    // 4️⃣ Handle Email Verification
    if (preferredVerificationMethod === 'email') {

      const { subject, htmlBody } = verificationEmailTemplate(user , otp);
      
      
      const brevoClient = new Brevo.TransactionalEmailsApi();
      brevoClient.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY
      );
      
      /**
       * Sends an email using Brevo with optional PDF attachment
       */
      
        const emailData = {
          sender: {
            name: "CLOA Document Review System",
            email: process.env.EMAIL_USER
          },
          to: [{ email: req.user.email }],
          subject,
          htmlContent: htmlBody,
        };
      
        try {
          await brevoClient.sendTransacEmail(emailData);
          console.log(`📧 Email sent to ${req.user.email}`);
        } catch (err) {
          console.error("📧 Brevo email failed:", err.response?.body || err.message);
        }
    //   await transporter.sendMail({
    //     from: process.env.EMAIL_USER,
    //     to: user.email,
    //     subject,
    //     html: htmlBody,
    //   });

    // } else {
    //   // 5️⃣ Firebase Phone Auth (SMS is handled client-side)
    //   if (!user.phone) {
    //     return res.status(400).json({ message: 'Phone number is required for SMS verification' });
    //   }

    //   // 🔐 Firebase handles SMS sending via client-side SDK
    //   // So here we just return response and expect frontend to trigger phone auth
    }

    // 6️⃣ Log registration
    if (user.role === 'admin') {
      await Log.create({
        action: 'register',
        admin: user,
        message: `Admin ${user.name} With Email ${user.email} Registered An Account.`,
      });
    } else {
      await Log.create({
        action: 'register',
        user: user,
        message: `User ${user.name} With Email ${user.email} Registered An Account.`,
      });
    }
    // const logEntry = {
    //   action: 'register',
    //   message: `${user.role === 'admin' ? 'Admin' : 'User'} ${user.name} With Email ${user.email} Was Registered`,
    // };
    // if (user.role === 'admin') logEntry.admin = user;
    // else logEntry.user = user;
    // await Log.create(logEntry);

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
      // const transporter = nodemailer.createTransport({
      //   service: 'gmail',
      //   auth: {
      //     user: process.env.EMAIL_USER,
      //     pass: process.env.EMAIL_PASS,
      //   },
      // });

      const { subject, htmlBody } = resendverificationEmailTemplate(user , otp);

      
      const brevoClient = new Brevo.TransactionalEmailsApi();
      brevoClient.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY
      );
      
      /**
       * Sends an email using Brevo with optional PDF attachment
       */
      
        const emailData = {
          sender: {
            name: "CLOA Document Review System",
            email: process.env.EMAIL_USER
          },
          to: [{ email: req.user.email }],
          subject,
          htmlContent: htmlBody
        };
      
        try {
          await brevoClient.sendTransacEmail(emailData);
          console.log(`📧 Email sent to ${req.user.email}`);
        } catch (err) {
          console.error("📧 Brevo email failed:", err.response?.body || err.message);
        }

      // await transporter.sendMail({
      //   from: process.env.EMAIL_USER,
      //   to: email,
      //   subject,
      //   html: htmlBody,
      // });
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

    if (!user.isVerified && user.role === "user") {
      return res.status(403).json({ message: 'Please Verify Your Email Before Attempting To Change Your Password.' });
    }
    // 2️⃣ Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 3️⃣ Set OTP and expiration (15 minutes)
    user.resetPasswordOTP = otp;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    // 4️⃣ Create reusable transporter for email
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });


    const { subject, htmlBody } = forgotpasswordEmailTemplate(user,otp);

    // 6️⃣ Decide which method to send OTP (email or phone)
    if (user.preferredVerificationMethod === 'email') {
      // 👉 Send via email

      
      const brevoClient = new Brevo.TransactionalEmailsApi();
      brevoClient.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        process.env.BREVO_API_KEY
      );
      
      /**
       * Sends an email using Brevo with optional PDF attachment
       */
      
        const emailData = {
          sender: {
            name: "CLOA Document Review System",
            email: process.env.EMAIL_USER
          },
          to: [{ email: req.user.email }],
          subject,
          htmlContent: htmlBody
        };
      
        try {
          await brevoClient.sendTransacEmail(emailData);
          console.log(`📧 Email sent to ${req.user.email}`);
        } catch (err) {
          console.error("📧 Brevo email failed:", err.response?.body || err.message);
        }

      // await transporter.sendMail({
      //   from: process.env.EMAIL_USER,
      //   to: email,
      //   subject,
      //   html: htmlBody,
      // });
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
    if (!user.isVerified && user.role === "user") {
      return res.status(403).json({ message: 'Please Verify Your Email Before Attempting To reset Your Password.' });
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
    // const transporter = nodemailer.createTransport({
    //   service: 'gmail',
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });

    const { subject, htmlBody } = resetpasswordEmailTemplate(user);

    
    const brevoClient = new Brevo.TransactionalEmailsApi();
    brevoClient.setApiKey(
      Brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY
    );
    
    /**
     * Sends an email using Brevo with optional PDF attachment
     */
    
      const emailData = {
        sender: {
          name: "CLOA Document Review System",
          email: process.env.EMAIL_USER
        },
        to: [{ email: req.user.email }],
        subject,
        htmlContent: htmlBody
      };
    
      try {
        await brevoClient.sendTransacEmail(emailData);
        console.log(`📧 Email sent to ${req.user.email}`);
      } catch (err) {
        console.error("📧 Brevo email failed:", err.response?.body || err.message);
      }

    // await transporter.sendMail({
    //   from: process.env.EMAIL_USER,
    //   to: user.email,
    //   subject,
    //   html: htmlBody,
    // });

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports.getMyDocuments = async (req, res) => {
//   try {
//     const {
//       page = 1,
//       limit = 10,
//       fieldReviewedKey,
//       fieldReviewedStatus,
//       docNumber,
//       docType,
//       state,
//       status,
//     } = req.query;

//     const skip = (parseInt(page) - 1) * parseInt(limit);

//     // 🔍 Base filter — current user only
//     const filter = {
//       'user._id': req.user._id,
//     };

//     // 🎯 Top-level filters
//     if (docNumber) {
//       filter.docNumber = { $regex: docNumber, $options: 'i' };
//     }
//     if (docType) {
//       filter.docType = { $regex: docType, $options: 'i' };
//     }
//     if (state) {
//       filter.state = { $regex: state, $options: 'i' };
//     }
//     if (status) {
//       filter.status = status.toLowerCase();
//     }

//     // 🧩 Field-level filter (inside `fields` map)
//     if (fieldReviewedKey && fieldReviewedStatus) {
//       // Matches documents where that specific field’s review.status matches the desired value
//       filter[`fields.${fieldReviewedKey}.review.status`] = fieldReviewedStatus.toLowerCase();
//     }

//     // 🧮 Count total before pagination
//     const totalDocuments = await Document.countDocuments(filter);

//     // 📄 Fetch paginated results
//     const documents = await Document.find(filter)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     // 🪵 Log the user action
//     await Log.create({
//       action: 'GetAllPersonalDocs',
//       user: req.user,
//       message: `User ${req.user.name} (Email: ${req.user.email}) viewed their submitted documents.`,
//     });

//     // 📤 Send response
//     res.status(200).json({
//       success: true,
//       pagination: {
//         totalDocuments,
//         totalPages: Math.ceil(totalDocuments / limit),
//         currentPage: parseInt(page),
//       },
//       count: documents.length,
//       documents,
//     });
//   } catch (error) {
//     console.error('Get My Documents Error:', error.message);
//     logger.error(error.message);
//     res.status(500).json({ message: 'Server error retrieving documents' });
//   }
// };



// ✅ @desc    Get all documents submitted by the logged-in user
// ✅ @route   GET /api/documents/my-submissions
// ✅ @access  Private (Authenticated users only)

exports.getMyDocuments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      fieldReviewedKey,
      fieldReviewedStatus,
      docNumber,
      docType,
      state,
      status,
      hasPendingResubmission,
      certificateStatus,
      startDate,
      endDate,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 🎯 Base user filter
    const matchStage = { 'user._id': req.user._id };

    // 🔍 Top-level filters
    if (docNumber) matchStage.docNumber = { $regex: docNumber, $options: 'i' };
    if (docType) matchStage.docType = { $regex: docType, $options: 'i' };
    if (state) matchStage.state = { $regex: state, $options: 'i' };
    if (status) {
      matchStage.status =
        status === 'partiallyApproved'
          ? status
          : status.toLowerCase();
    }
    // 📄 4. Filter by Final Certificate Status
    if (certificateStatus) matchStage['certificate.status'] = { $regex: certificateStatus, $options: 'i' };

    // ⏳ 5. Filter by "hasPendingResubmission" (boolean)
    if (typeof hasPendingResubmission !== 'undefined') {
      const value = hasPendingResubmission === 'true' || hasPendingResubmission === true;
      matchStage.hasPendingResubmission = value;
    }

        // 📅 6. Date range filter (createdAt)
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include full day
        // end.setHours(999,59,59,23); // Include full day
        matchStage.createdAt.$lte = end;
      }
    }
    
    const pipeline = [{ $match: matchStage }];

    // 🧩 Optional field-level filtering (partial key + case-insensitive)
    if (fieldReviewedKey && fieldReviewedStatus) {
      pipeline.push({
        $match: {
          $expr: {
            $gt: [
              {
                $size: {
                  $filter: {
                    input: { $objectToArray: "$fields" },
                    as: "f",
                    cond: {
                      $and: [
                        // Match partial field key (case-insensitive)
                        { $regexMatch: { input: "$$f.k", regex: fieldReviewedKey, options: "i" } },
                        // Match review status (case-insensitive)
                        { $regexMatch: { input: "$$f.v.review.status", regex: fieldReviewedStatus, options: "i" } },
                        // {
                        //   $eq: [
                        //     { $toLower: "$$f.v.review.status" },
                        //     fieldReviewedStatus.toLowerCase()
                        //   ]
                        // }
                      ]
                    }
                  }
                }
              },
              0
            ]
          }
        }
      });
    }
    // if (fieldReviewedStatus) filter['matchStage.fields.name'] = { $regex: currentHolderName, $options: 'i' };

    // 📊 Pagination & sorting
    pipeline.push(
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    );

    // 🧮 Get paginated documents
    const documents = await Document.aggregate(pipeline);

    // 🧮 Total count (run separately without skip/limit)
    const totalDocuments = await Document.aggregate([
      { $match: matchStage },
      ...(fieldReviewedKey && fieldReviewedStatus
        ? [
            {
              $match: {
                $expr: {
                  $gt: [
                    {
                      $size: {
                        $filter: {
                          input: { $objectToArray: "$fields" },
                          as: "f",
                          cond: {
                            $and: [
                              { $regexMatch: { input: "$$f.k", regex: fieldReviewedKey, options: "i" } },
                              { $regexMatch: { input: "$$f.v.review.status", regex: fieldReviewedStatus, options: "i" } },
                              // {
                              //   $eq: [
                              //     { $toLower: "$$f.v.review.status" },
                              //     fieldReviewedStatus.toLowerCase()
                              //   ]
                              // }
                            ]
                          }
                        }
                      }
                    },
                    0
                  ]
                }
              }
            }
          ]
        : []),
      { $count: "total" }
    ]);

    const totalCount = totalDocuments[0]?.total || 0;

    // 🪵 Log action
    await Log.create({
      action: 'GetAllPersonalDocs',
      user: req.user,
      message: `User ${req.user.name} (${req.user.email}) viewed their submitted documents.`,
    });

    // 📤 Respond
    res.status(200).json({
      success: true,
      pagination: {
        totalDocuments: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: parseInt(page),
      },
      count: documents.length,
      documents,
    });
  } catch (error) {
    console.error('Get My Documents Error:', error.message);
    logger.error(error.message);
    res.status(500).json({ message: 'Server error retrieving documents' });
  }
};

exports.getAllUserStats = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, email,expiryStatus,expiresBefore,expiresAfter, createdAfter, createdBefore } = req.query;

    // 🔍 Build dynamic filters
    const filter = { role: 'user' };

    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    if (email) {
      filter.email = { $regex: email, $options: 'i' };
    }
    if (expiryStatus) {
      filter.expiryStatus = { $regex: expiryStatus, $options: 'i' };
    }

    if (createdAfter || createdBefore) {
      filter.createdAt = {};
      if (createdAfter) filter.createdAt.$gte = new Date(createdAfter);
      if (createdBefore) filter.createdAt.$lte = new Date(createdBefore);
    }
    if (expiresAfter || expiresBefore) {
      filter.expiryDate = {};
      if (expiresAfter) filter.expiryDate.$gte = new Date(expiresAfter);
      if (expiresBefore) filter.expiryDate.$lte = new Date(expiresBefore);
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
        const partiallyApproved = documents.filter((doc) => doc.status === 'partiallyApproved');
        const rejected = documents.filter((doc) => doc.status === 'rejected');

        return {
          // userId: user._id,
          // name: user.name,
          // email: user.email,
          // expiryStatus: user.expiryStatus,
          // phone: user.phone,
          user,
          totalDocuments: documents.length,
          pendingCount: pending.length,
          approvedCount: approved.length,
          partiallyApprovedCount: partiallyApproved.length,
          rejectedCount: rejected.length,
          pendingDocuments: pending,
          approvedDocuments: approved,
          partiallyApprovedDocuments: partiallyApproved,
          rejectedDocuments: rejected,
        };
      })
    );

    await Log.create({
      action: 'GetAllUsersStats',
      admin: req.user,
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
        const reviews = await Review.find({"reviewedBy": admin.name})
          .populate({
            path: 'document',
            model: 'Document', // make sure this matches your actual model name
            select: '-__v -updatedAt',
            strictPopulate: false,
          });

        const approved = reviews.filter((r) => r.status === 'approved' && r.document);
        const partiallyApproved = reviews.filter((r) => r.status === 'partiallyApproved' && r.document);
        const rejected = reviews.filter((r) => r.status === 'rejected' && r.document);
        const pending = reviews.filter((r) => r.status === 'pending' && r.document);

        return {
          adminId: admin._id,
          name: admin.name,
          email: admin.email,
          createdAt: admin.createdAt,
          totalReviewed: reviews.length,
          approvedCount: approved.length,
          partiallyApprovedCount: partiallyApproved.length,
          rejectedCount: rejected.length,
          pendingCount: pending.length,
          approvedDocuments: approved,  // includes full review + document
          partiallyApprovedDocuments: partiallyApproved,  // includes full review + document
          rejectedDocuments: rejected,
          pendingDocuments: pending,
        };
      })
    );


    await Log.create({
      action: 'GetAllAdminsStats',
      admin: req.user,
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

exports.generateInviteCode = async (req, res) => {
  try {
    const { generatedFor } = req.body;

    if (!generatedFor) {
      return res.status(400).json({ message: 'generatedFor field is required.' });
    }

    // 🔍 Check for an existing active invite code for the same user/company
    const existingCode = await InviteCode.findOne({
      generatedFor,
      used: false, // Only check active ones
    });

    if (existingCode) {
      return res.status(400).json({
        message: `An active invite code already exists for ${generatedFor}.`,
        existingCode: existingCode.code,
      });
    }
    // const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // e.g. 'A1B2C3D4'
    const code = nanoid(); // e.g. 'A1B2C3D4'

    const newCode = await InviteCode.create({ 
      code,
      generatedFor,
      generatedBy: (({ _id, email, name, role, phone, adminLevel }) => ({ _id, email, name, role, phone, adminLevel }))(req.user)
    });

    
    await Log.create({
      action: 'GenerateRegistrationCode',
      admin: (({ _id, email, name, role, phone, adminLevel }) => ({ _id, email, name, role, phone, adminLevel }))(req.user),
      // document : document,
      message: `Admin ${req.user.name} With Email ${req.user.email} Generated A Registration Code ${(code)} For ${generatedFor}`,
    });

    res.status(201).json({
      success: true,
      message: 'Invite code generated successfully.',
      code: newCode.code,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error generating invite code.' });
  }
};


// exports.extendUserExpiryDate = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // 🧩 1. Fetch the user
//     const user = await User.findById(id);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//         // 2️⃣ Ensure expiryDate exists
//     if (!user.expiryDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'This user does not have an expiry date set.',
//       });
//     }

//     // 3️⃣ Calculate remaining time before expiry
//     const now = new Date();
//     const expiry = new Date(user.expiryDate);
//     const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

//     // 4️⃣ Prevent extending if more than 30 days left
//     if (diffDays > 30) {
//       return res.status(400).json({
//         success: false,
//         message:
//           `Cannot extend this account yet. It still has ${diffDays} days left before expiry.`,
//       });
//     }

//     // 🧩 2. Prevent extending admin accounts
//     if (user.role === 'admin') {
//       return res.status(400).json({ message: 'Cannot extend expiry for admin accounts' });
//     }

//     // 🧮 3. Calculate new expiry date (1 year from now OR from current expiry, whichever is later)
//     const baseDate = user.expiryDate && user.expiryDate > now ? user.expiryDate : now;
//     const newExpiryDate = new Date(baseDate);
//     newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);

//     // 🛠️ 4. Update user record
//     user.expiryDate = newExpiryDate;
//     user.expiryStatus = 'active';
//     await user.save();

//     // 🧾 5. Log the admin action
//     await Log.create({
//       action: 'ExtendUserAccountExpiryDate',
//       admin: req.user,
//       user: { _id: user._id, name: user.name, email: user.email },
//       message: `Admin ${req.user.name} With Email (${req.user.email}) Extended The Expiry Date Of User ${user.name} With Email (${user.email}) By One Year , From ${baseDate.toISOString().split('T')[0]} to ${newExpiryDate.toISOString().split('T')[0]} .`,
//     });

//     // 🟢 6. Respond to client
//     res.status(200).json({
//       success: true,
//       message: `User account expiry extended successfully From ${baseDate.toISOString().split('T')[0]} to ${newExpiryDate.toISOString().split('T')[0]}`,
//       data: {
//         userId: user._id,
//         name: user.name,
//         email: user.email,
//         newExpiryDate,
//         expiryStatus: user.expiryStatus,
//       },
//     });
//   } catch (error) {
//     logger.error('Extend User Expiry Error:', error.message);
//     res.status(500).json({ message: 'Server error while extending user expiry' });
//   }
// };

