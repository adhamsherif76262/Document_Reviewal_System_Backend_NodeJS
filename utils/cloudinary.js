// utils/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// 🔐 Configure Cloudinary with your env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📂 Setup Cloudinary storage for Multer
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: 'document_submissions', // 🔖 Folder name in your Cloudinary account
//     allowed_formats: ['pdf', 'doc', 'docx'],
//     public_id: (req, file) => `${Date.now()}-${file.originalname}`, // Unique filename
//   },
// });
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'document_submissions',
    resource_type: 'raw', // 👈 this is CRUCIAL for non-image files like PDFs
    allowed_formats: ['pdf', 'doc', 'docx'],
    public_id: (req, file) => `${Date.now()}-${file.originalname}`,
  },
});

// 🚀 Create the upload middleware
const upload = multer({ storage });

module.exports = upload;
