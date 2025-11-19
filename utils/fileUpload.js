// const streamifier = require('streamifier');
// const { uploadImage } = require('./cloudinary');
// const { uploadPDF } = require('./supabase');

// export const uploadFile = async (file, userId, docId, fieldKey) => {
//   const folder = `documents/${userId}/${docId}`;
//   const filename = fieldKey;

//   if (file.mimetype.startsWith('image/')) {
//     // Cloudinary upload via stream
//     const url = await new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         { folder, public_id: filename, resource_type: 'image', overwrite: true },
//         (err, result) => {
//           if (err) reject(err);
//           else resolve(result.secure_url);
//         }
//       );
//       streamifier.createReadStream(file.buffer).pipe(stream);
//     });
//     return { type: 'image', url };
//   }

//   if (file.mimetype === 'application/pdf') {
//     const path = `${folder}/${filename}.pdf`;
//     const url = await uploadPDF(file.buffer, path, file.mimetype);
//     return { type: 'pdf', url };
//   }

//   throw new Error('Unsupported file type');
// };

// export const deleteFile = async (fileUrl, type) => {
//   if (type === 'image') return deleteImage(fileUrl);
//   if (type === 'pdf') return deletePDF(fileUrl);
// };
