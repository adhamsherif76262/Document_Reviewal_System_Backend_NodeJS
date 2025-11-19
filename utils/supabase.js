const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Uploads a single file to Supabase Storage
 */
async function uploadToSupabase(file, folderPath, customName = null, index = 0) {
  const extension = file.originalname.split('.').pop();
  const fileName = customName
    ? `${customName}`
    : file.originalname;
  const filePath = `${folderPath}/${fileName}`;

  const { error } = await supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .upload(filePath, file.buffer, {
      upsert: true,
      contentType: file.mimetype,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}
// ✅ Delete all files from a Supabase folder
  async function deleteSupabaseFolder (folderPath) {
  try {
    const { data, error } = await supabase.storage.from(process.env.SUPABASE_BUCKET)
      .list(folderPath);
    if (error) throw error;
    if (!data.length) return;

    const paths = data.map((f) => `${folderPath}/${f.name}`);
    const { error: delError } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove(paths);
    if (delError) throw delError;

    console.log(`🧹 Deleted ${paths.length} file(s) from Supabase folder: ${folderPath}`);
  } catch (err) {
    console.error(`⚠️ Supabase folder cleanup failed: ${folderPath}`, err.message);
  }
};

// async function deleteSupabaseFolder(folderPath) {
//   try {
//     console.log(`🧹 Starting recursive delete for Supabase folder: ${folderPath}`);

//     const bucket = process.env.SUPABASE_BUCKET;
//     const allPaths = [];

//     // 1️⃣ Recursively collect all files and subfolders
//     async function collectPaths(prefix = folderPath) {
//       const { data, error } = await supabase.storage
//         .from(bucket)
//         .list(prefix, { limit: 1000 }); // Supabase API max
//       if (error) throw error;

//       for (const item of data) {
//         const itemPath = `${prefix}/${item.name}`;
//         if (item.id || item.metadata) {
//           // It's a file
//           allPaths.push(itemPath);
//         } else {
//           // It's a subfolder — recurse
//           await collectPaths(itemPath);
//         }
//       }
//     }

//     await collectPaths(folderPath);

//     // 2️⃣ Delete everything found
//     if (allPaths.length > 0) {
//       const { error: delError } = await supabase.storage
//         .from(bucket)
//         .remove(allPaths);
//       if (delError) throw delError;
//       console.log(`🧹 Deleted ${allPaths.length} file(s) from Supabase folder: ${folderPath}`);
//     } else {
//       console.log(`⚠️ No files found under ${folderPath}`);
//     }

//     // 3️⃣ Try deleting the root folder itself (optional — purely cosmetic)
//     const { error: rootDelError } = await supabase.storage
//       .from(bucket)
//       .remove([folderPath]);
//     if (rootDelError && !rootDelError.message.includes('not found')) {
//       console.warn(`⚠️ Root folder delete warning: ${rootDelError.message}`);
//     }

//     console.log(`✅ Finished Supabase cleanup for: ${folderPath}`);
//   } catch (err) {
//     console.error(`⚠️ Supabase folder cleanup failed for ${folderPath}:`, err.message);
//   }
// }


module.exports = { uploadToSupabase , deleteSupabaseFolder };



// const { createClient } = require('@supabase/supabase-js');

// const supabase = createClient(
//   process.env.SUPABASE_URL,
//   process.env.SUPABASE_SERVICE_ROLE_KEY
// );

// async function uploadToSupabase(file, folderPath) {
//   const filePath = `${folderPath}/${file.originalname}`;

//   const { error } = await supabase.storage
//     .from(process.env.SUPABASE_BUCKET)
//     .upload(filePath, file.buffer, {
//       upsert: true,
//       contentType: 'application/pdf',
//     });

//   if (error) throw error;

//   const { data: publicUrlData } = supabase.storage
//     .from(process.env.SUPABASE_BUCKET)
//     .getPublicUrl(filePath);

//   return publicUrlData.publicUrl;
// }

// module.exports = { uploadToSupabase };