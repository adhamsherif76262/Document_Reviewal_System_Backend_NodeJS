const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a single file to Cloudinary.
 * Supports explicit folder and custom name.
 */
async function uploadToCloudinary(file, folderPath, customName = null, index = 0) {
  return new Promise((resolve, reject) => {
    const publicId = customName
      ? `${customName}` // e.g., building_image_1
      : file.originalname.split('.')[0];

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folderPath,
        public_id: publicId, // use readable name
        resource_type: 'auto', // handles image, pdf, etc.
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload failed:', error.message);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
}

// ✅ Delete all files from a Cloudinary folder
async function deleteCloudinaryFolder (folderPath) {
  try {
    const { resources } = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderPath,
      max_results: 100,
    });

    if (!resources.length) return;

    const publicIds = resources.map((r) => r.public_id);
    await cloudinary.api.delete_resources(publicIds);
    console.log(`🧹 Deleted ${publicIds.length} file(s) from Cloudinary folder: ${folderPath}`);
  } catch (err) {
    console.error(`⚠️ Cloudinary folder cleanup failed: ${folderPath}`, err.message);
  }
};

// ✅ utils/cloudinary.js

/**
 * Deletes an entire document folder (recursively), no matter the depth.
 * Example folderPath:
 *   CLOA_Document_Reviewal_System/OrganicPesticide_00123_JohnDoe/FieldA
 * Will clean up the entire "OrganicPesticide_00123_JohnDoe" folder.
 */
// async function deleteCloudinaryFolder(folderPath) {
//   try {
//     // 🧠 Extract the doc-level folder (e.g., "OrganicPesticide_00123_JohnDoe")
//     const match = folderPath.match(/(CLOA_Document_Reviewal_System\/[^/]+)/);
//     const docRoot = match ? match[1] : folderPath;

//     console.log(`🧹 Starting recursive delete for Cloudinary folder: ${docRoot}`);

//     // 1️⃣ Delete all files under this root
//     const { resources } = await cloudinary.api.resources({
//       type: 'upload',
//       prefix: docRoot,
//       max_results: 500,
//     });

//     if (resources.length) {
//       const publicIds = resources.map(r => r.public_id);
//       await cloudinary.api.delete_resources(publicIds);
//       console.log(`🗑️ Deleted ${publicIds.length} files from Cloudinary under: ${docRoot}`);
//     }

//     // 2️⃣ Recursively delete subfolders (if any)
//     const { folders } = await cloudinary.api.sub_folders(docRoot);
//     if (folders && folders.length) {
//       for (const sub of folders) {
//         await deleteCloudinaryFolder(sub.path);
//       }
//     }

//     // 3️⃣ Try deleting the virtual folder itself
//     await cloudinary.api.delete_folder(docRoot).catch(() => {});
//     console.log(`✅ Cloudinary root folder deleted: ${docRoot}`);
//   } catch (err) {
//     console.error(`⚠️ Cloudinary cleanup failed for ${folderPath}:`, err.message);
//   }
// }


// ✅ utils/cloudinary.js

/**
 * Fully deletes a document root folder and everything inside it.
 * Handles both files and virtual subfolders safely.
 */
// async function deleteCloudinaryFolder(folderPath) {
//   try {
//     // 🧠 Get the doc root (everything up to 2nd slash after CLOA_ prefix)
//     const match = folderPath.match(/(CLOA_Document_Reviewal_System\/[^/]+)/);
//     const docRoot = match ? match[1] : folderPath;

//     console.log(`🧹 Starting recursive delete for Cloudinary folder: ${docRoot}`);

//     // 🧾 1️⃣ Delete all files under this prefix (recursively)
//     let nextCursor = null;
//     let totalDeleted = 0;

//     do {
//       const { resources, next_cursor } = await cloudinary.api.resources({
//         type: 'upload',
//         prefix: docRoot,
//         max_results: 500,
//         next_cursor: nextCursor,
//       });

//       if (resources?.length) {
//         const publicIds = resources.map(r => r.public_id);
//         await cloudinary.api.delete_resources(publicIds);
//         totalDeleted += publicIds.length;
//       }

//       nextCursor = next_cursor;
//     } while (nextCursor);

//     console.log(`🗑️ Deleted ${totalDeleted} files from Cloudinary under: ${docRoot}`);

//     // 📂 2️⃣ Try listing subfolders (if any)
//     let subFolders = [];
//     try {
//       const { folders } = await cloudinary.api.sub_folders(docRoot);
//       subFolders = folders || [];
//     } catch {
//       subFolders = [];
//     }

//     // 📁 3️⃣ Recursively delete any nested subfolders
//     for (const sub of subFolders) {
//       if (sub?.path) {
//         await deleteCloudinaryFolder(sub.path);
//       }
//     }

//     // 🧹 4️⃣ Finally, try deleting the folder itself
//     try {
//       await cloudinary.api.delete_folder(docRoot);
//       console.log(`✅ Cloudinary folder deleted: ${docRoot}`);
//     } catch (innerErr) {
//       console.warn(`⚠️ Cloudinary could not delete folder ${docRoot}: ${innerErr.message}`);
//     }
//   } catch (err) {
//     console.error(`⚠️ Cloudinary cleanup failed for ${folderPath}:`, err.message);
//   }
// }


// ✅ utils/cloudinary.js

// async function deleteCloudinaryFolder(folderPath) {
//   try {
//     // 1️⃣ Delete all resources under that prefix recursively
//     const { resources } = await cloudinary.api.resources({
//       type: 'upload',
//       prefix: folderPath,
//       max_results: 500,
//     });

//     if (resources.length) {
//       const publicIds = resources.map(r => r.public_id);
//       await cloudinary.api.delete_resources(publicIds);
//       console.log(`🧹 Deleted ${publicIds.length} file(s) from Cloudinary folder: ${folderPath}`);
//     }

//     // 2️⃣ Delete any subfolders that may exist
//     const { folders } = await cloudinary.api.sub_folders(folderPath);
//     if (folders && folders.length) {
//       for (const f of folders) {
//         await deleteCloudinaryFolder(f.path);
//       }
//     }

//     // 3️⃣ Finally, delete the virtual folder itself
//     await cloudinary.api.delete_folder(folderPath).catch(() => {});
//     console.log(`🗑️ Cloudinary virtual folder deleted: ${folderPath}`);
//   } catch (err) {
//     console.error(`⚠️ Cloudinary folder cleanup failed: ${folderPath}`, err.message);
//   }
// }


// ✅ Delete entire Cloudinary folder recursively, including subfolders


/// revert to this one
// async function deleteCloudinaryFolder(folderPath) {
//   try {
//     console.log(`🧹 Starting recursive delete for Cloudinary folder: ${folderPath}`);

//     // 1️⃣ List up to 500 resources under this folder
//     const { resources } = await cloudinary.api.resources({
//       type: 'upload',
//       prefix: folderPath,
//       max_results: 500,
//     });

//     // 2️⃣ Delete all resources (files)
//     if (resources.length > 0) {
//       const publicIds = resources.map(r => r.public_id);
//       await cloudinary.api.delete_resources(publicIds);
//       console.log(`🧹 Deleted ${publicIds.length} file(s) from Cloudinary folder: ${folderPath}`);
//     }

//     // 3️⃣ Attempt to delete the folder itself (even if empty)
//     try {
//       await cloudinary.api.delete_folder(folderPath);
//       console.log(`🗑️ Deleted Cloudinary folder: ${folderPath}`);
//     } catch (err) {
//       if (err?.error?.message?.includes('Folder not empty')) {
//         console.warn(`⚠️ Cloudinary folder still has subfolders: ${folderPath}`);
//       } else {
//         console.warn(`⚠️ Cloudinary folder cleanup failed: ${folderPath}`, err?.error?.message || err);
//       }
//     }

//   } catch (err) {
//     console.error(`⚠️ Cloudinary cleanup failed for ${folderPath}:`, err?.error?.message || err);
//   }
// }



// ✅ Minimal Cloudinary cleanup (1 API call per folder)
// async function deleteCloudinaryFolder(folderPath) {
//   try {
//     console.log(`🧹 Deleting Cloudinary folder recursively: ${folderPath}`);

//     // 1️⃣ Delete all resources under the prefix (recursive)
//     await cloudinary.api.delete_resources_by_prefix(folderPath);

//     // 2️⃣ Then remove the folder itself (optional)
//     try {
//       await cloudinary.api.delete_folder(folderPath);
//       console.log(`🗑️ Deleted Cloudinary folder: ${folderPath}`);
//     } catch (err) {
//       const msg = err?.error?.message || err.message || String(err);
//       if (!msg.includes('not found')) console.warn(`⚠️ delete_folder warning: ${msg}`);
//     }
//   } catch (err) {
//     console.error(`⚠️ Cloudinary cleanup failed for ${folderPath}:`, err?.error?.message || err.message || err);
//   }
// }

// ✅ Delete an entire document folder (root + all nested files) in 2 API calls
// async function deleteCloudinaryFolder(rootFolder) {
//   try {
//     console.log(`🧹 Deleting entire Cloudinary folder tree: ${rootFolder}`);

//     // 1️⃣ Delete every resource that starts with this prefix (includes all subfolders)
//     await cloudinary.api.delete_resources_by_prefix(rootFolder);

//     // 2️⃣ Attempt to remove the root folder itself
//     try {
//       await cloudinary.api.delete_folder(rootFolder);
//       console.log(`🗑️ Deleted Cloudinary root folder: ${rootFolder}`);
//     } catch (err) {
//       const msg = err?.error?.message || err.message || String(err);
//       if (!msg.includes('not found'))
//         console.warn(`⚠️ delete_folder warning for ${rootFolder}: ${msg}`);
//     }

//     console.log(`✅ Finished Cloudinary cleanup for ${rootFolder}`);
//   } catch (err) {
//     console.error(`⚠️ Cloudinary cleanup failed for ${rootFolder}:`,
//       err?.error?.message || err.message || err);
//   }
// }


module.exports = { uploadToCloudinary , deleteCloudinaryFolder};




// const cloudinary = require('cloudinary').v2;
// const streamifier = require('streamifier');

// // 🔐 Configure Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
//   api_key: process.env.CLOUDINARY_API_KEY,
//   api_secret: process.env.CLOUDINARY_API_SECRET,
// });

// // 🚀 Upload from memory (no need for file.path)
// async function uploadToCloudinary(file, folderPath) {
//   return new Promise((resolve, reject) => {
//     const stream = cloudinary.uploader.upload_stream(
//       {
//         folder: folderPath,
//         resource_type: 'image',
//       },
//       (error, result) => {
//         if (error) {
//           console.error('Cloudinary upload failed:', error.message);
//           return reject(error);
//         }
//         resolve(result.secure_url);
//       }
//     );

//     // Pipe the file buffer to the Cloudinary stream
//     streamifier.createReadStream(file.buffer).pipe(stream);
//   });
// }

// module.exports = { uploadToCloudinary };