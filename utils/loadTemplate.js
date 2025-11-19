// // utils/loadTemplate.js
// import fs from "fs";
// import path from "path";

// export const loadTemplate = (docType) => {
//   const filename = docType
//     .toLowerCase()
//     .replace(/ /g, "_")
//     .replace(/[^a-z0-9_]/g, ""); // sanitize
//   const filepath = path.join(process.cwd(), "templates", `${filename}.json`);

//   if (!fs.existsSync(filepath)) {
//     throw new Error(`Template not found for docType: ${docType}`);
//   }

//   return JSON.parse(fs.readFileSync(filepath, "utf-8"));
// };


// import fs from 'fs';
// import path from 'path';


const fs = require ('fs');
const path = require ('path');

/**
 * Loads a JSON template for a given document type.
 * @param {string} docType - Full document type (e.g. "Domestic Organic Pesticide")
 * @returns {object} Parsed template object
 */
exports.loadTemplate = (docType) => {
  // Normalize name to match file naming convention
  const normalized = docType
    .toLowerCase()
    .replace(/domestic|imported|general/g, '') // remove state keyword
    .trim()
    .replace(/\s+/g, '_'); // convert spaces to underscores

  const templatePath = path.join(process.cwd(), 'templates', `${normalized}.json`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template file not found for docType: ${docType}`);
  }

  try {
    const fileContent = fs.readFileSync(templatePath, 'utf-8');
    const template = JSON.parse(fileContent);
    return template;
  } catch (err) {
    throw new Error(`Failed to parse template for ${docType}: ${err.message}`);
  }
};
