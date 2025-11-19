// const { deleteFromCloudinary } = require('./cloudinaryUtils');
// const { deleteFromSupabase } = require('./supabaseUtils');

// exports.rollbackUploads = async function (urls) {
//   for (const url of urls) {
//     try {
//       if (url.includes('cloudinary.com')) {
//         await deleteFromCloudinary(url);
//       } else if (url.includes('supabase.co')) {
//         await deleteFromSupabase(url);
//       }
//     } catch (err) {
//       console.warn(`⚠️ Rollback skip: could not delete ${url}:`, err.message);
//     }
//   }
// };


// utils/rollbackUploads.js
const { deleteSupabaseFolder } = require ('./supabase.js');
const { deleteCloudinaryFolder } = require ('./cloudinary.js');

/**
 * Rollback utility — cleans up uploaded files in case of transaction failure.
 * @param {Array} uploadedFiles - Array of uploaded file info objects
 * Each object example:
 * {
 *   provider: 'supabase' | 'cloudinary',
 *   folderPath: 'documents/12345/',
 *   filePath?: 'documents/12345/file.pdf'
 * }
 */
exports.rollbackUploads = async function (uploadedFiles = []) {
  if (!uploadedFiles.length) return;

  try {
    const supabaseFolders = new Set();
    const cloudinaryFolders = new Set();

    // Collect all unique folder paths by provider
    for (const file of uploadedFiles) {
      if (file.provider === 'supabase' && file.folderPath) {
        supabaseFolders.add(file.folderPath);
      } else if (file.provider === 'cloudinary' && file.folderPath) {
        cloudinaryFolders.add(file.folderPath);
      }
    }

    // Parallel cleanup
    await Promise.all([
      ...Array.from(supabaseFolders).map(async (folder) => {
        await deleteSupabaseFolder(folder);
      }),
      ...Array.from(cloudinaryFolders).map(async (folder) => {
        await deleteCloudinaryFolder(folder);
      }),
    ]);

    console.log('🧩 Rollback completed successfully.');
  } catch (err) {
    console.error('⚠️ Rollback failed:', err.message);
  }
}
