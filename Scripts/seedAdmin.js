// // scripts/seedAdmin.js

// require('dotenv').config();
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');
// const User = require('../models/user');

// // 🔗 Connect to MongoDB
// mongoose
//   .connect(process.env.MONGODB_URI)
//   .then(async () => {
//     console.log('🔌 Connected to MongoDB');

//     const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });

//     if (existingAdmin) {
//       console.log('✅ Admin already exists:', existingAdmin.email);
//     } else {
//       const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

//       console.log('🧪 Seeding admin with:');
//       console.log('Name:', process.env.ADMIN_NAME);
//       console.log('Email:', process.env.ADMIN_EMAIL);
//       console.log('Password:', process.env.ADMIN_PASSWORD);

//       const admin = await User.create({
//         name: process.env.ADMIN_NAME,
//         email: process.env.ADMIN_EMAIL,
//         password: hashedPassword,
//         role: 'admin',
//       });

//       console.log('🎉 Admin created:', admin.email);
//     }

//     mongoose.disconnect();
//   })
//   .catch((err) => {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
//   });



require('dotenv').config(); // ✅ VERY important at the top

const mongoose = require('mongoose');
const User = require('../models/user');

const connectDB = require('../config/db');
const Log = require('../models/log'); // make sure this is at the top

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminName = process.env.ADMIN_NAME;
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminPhone = process.env.ADMIN_PHONE;
    const adminLevel = process.env.ADMIN_LEVEL;

    if (!adminEmail || !adminPassword || !adminName || !adminLevel || !adminPhone) {
      throw new Error('Missing admin environment variables');
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('👤 Admin already exists:', adminEmail);
      return process.exit();
    }

    console.log('🧪 Creating admin with:');
    console.log('Name:', adminName);
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Role:', adminLevel);
    console.log('Phone:', adminPhone);

    const admin = new User({
      name: adminName,
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
      adminLevel : adminLevel,
      phone : adminPhone
    });

    await admin.save();

    // ✅ Log the Admin Creation Attempt
    // if (user.role === 'admin') {
      await Log.create({
        action: 'register',
        admin: admin,
        message: `Admin ${adminName} With Email ${adminEmail} , Administration Level ("${adminLevel}") & Phone ("${adminPhone}) Was Registered`,
      });
    // } else {
    //   await Log.create({
    //     action: 'resetPassword',
    //     user: user._id,
    //     message: `User ${user.name} Is Attempting To Reset His/Her Password`,
    //   });
    // }

    console.log('✅ Admin user created successfully');
    process.exit();
  } catch (error) {
    console.error('❌ Admin seeding error:', error.message);
    process.exit(1);
  }
};

seedAdmin();




// // // scripts/seedAdmin.js

// // require('dotenv').config();
// // const mongoose = require('mongoose');
// // const bcrypt = require('bcryptjs');
// // const User = require('../models/user');

// // // 🔗 Connect to MongoDB
// // mongoose
// //   .connect(process.env.MONGODB_URI)
// //   .then(async () => {
// //     console.log('🔌 Connected to MongoDB');

// //     const existingAdmin = await User.findOne({ email: process.env.ADMIN_EMAIL });

// //     if (existingAdmin) {
// //       console.log('✅ Admin already exists:', existingAdmin.email);
// //     } else {
// //       const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);

// //       console.log('🧪 Seeding admin with:');
// //       console.log('Name:', process.env.ADMIN_NAME);
// //       console.log('Email:', process.env.ADMIN_EMAIL);
// //       console.log('Password:', process.env.ADMIN_PASSWORD);

// //       const admin = await User.create({
// //         name: process.env.ADMIN_NAME,
// //         email: process.env.ADMIN_EMAIL,
// //         password: hashedPassword,
// //         role: 'admin',
// //       });

// //       console.log('🎉 Admin created:', admin.email);
// //     }

// //     mongoose.disconnect();
// //   })
// //   .catch((err) => {
// //     console.error('❌ MongoDB connection error:', err);
// //     process.exit(1);
// //   });



// require('dotenv').config(); // ✅ VERY important at the top

// const mongoose = require('mongoose');
// const User = require('../models/user');

// const connectDB = require('../config/db');
// const Log = require('../models/log'); // make sure this is at the top

// const seedAdmin = async () => {
//   try {
//     await connectDB();

//     const adminEmail = process.env.ADMIN_EMAIL;
//     const adminPassword = process.env.ADMIN_PASSWORD;
//     const adminName = process.env.ADMIN_NAME;
//     const adminPhone = process.env.ADMIN_PHONE;

//     if (!adminEmail || !adminPassword || !adminName) {
//       throw new Error('Missing admin environment variables');
//     }

//     const existingAdmin = await User.findOne({ email: adminEmail });

//     if (existingAdmin) {
//       console.log('👤 Admin already exists:', adminEmail);
//       return process.exit();
//     }

//     console.log('🧪 Creating admin with:');
//     console.log('Name:', adminName);
//     console.log('Email:', adminEmail);
//     console.log('Password:', adminPassword);

//     const admin = new User({
//       name: adminName,
//       email: adminEmail,
//       password: adminPassword,
//       role: 'admin',
//       isVerified : true,
//       phone : adminPhone,
//     });

//     await admin.save();

//     // ✅ Log the Admin Creation Attempt
//     // if (user.role === 'admin') {
//       await Log.create({
//         action: 'register',
//         admin: admin._id,
//         message: `Admin ${adminName} With Email ${adminEmail} Was Registered`,
//       });
//     // } else {
//     //   await Log.create({
//     //     action: 'resetPassword',
//     //     user: user._id,
//     //     message: `User ${user.name} Is Attempting To Reset His/Her Password`,
//     //   });
//     // }

//     console.log('✅ Admin user created successfully');
//     process.exit();
//   } catch (error) {
//     console.error('❌ Admin seeding error:', error.message);
//     process.exit(1);
//   }
// };

// seedAdmin();
