// utils/templateResolver.js

const path = require('path');
const fs = require('fs');

function loadTemplateFile(templateKey) {
  const filePath = path.join(
    __dirname,
    '..',
    'templates',
    `${templateKey}.json`
  );

  if (!fs.existsSync(filePath)) {
    throw new Error(`Template file '${templateKey}.json' not found`);
  }

  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

/**
 * Resolves all allowed fields for a docType + state
 */
function resolveAllowedFields(docType, state) {
  const templateKey = mapDocTypeToTemplateKey(docType);
  const template = loadTemplateFile(templateKey);

  if (!template.states[state]) {
    throw new Error(`State '${state}' not defined in template '${templateKey}'`);
  }

  const allowedFields = new Map();

  for (const tab of template.states[state].tabs) {
    for (const field of tab.fields) {
      allowedFields.set(field.name, {
        type: field.type,
        required: !!field.required,
        tab: tab.key,
      });
    }
  }

  return { template, allowedFields };
}

/**
 * Central mapping layer
 * (CRITICAL to avoid mismatch)
 */
function mapDocTypeToTemplateKey(docType) {
  const mapping = {
    'Domestic Organic Nutrition': 'organic_nutrition',
    'Imported Organic Nutrition': 'organic_nutrition',

    // future
    'Domestic Organic Pesticide': 'organic_pesticide',
    'Imported Organic Pesticide': 'organic_pesticide',
    'Organic Farm' : 'organic_farm',
    'Exporters Organic Production' : 'exporters_organic_production',
    'Importers Organic Production' : 'importers_organic_production',
    'Warehouse' : 'warehouse',
    'Factory Or Production Unit' : 'factory_or_production_unit',
    'Conformity Office Or Entity' : 'conformity_office_or_entity',
    'Consultancy Firms Or Scientific Offices' : 'consultancy_firms_or_scientific_offices',
    'Organic Feed Logo' : 'organic_feed_logo',
  };

  const key = mapping[docType];
  if (!key) {
    throw new Error(`No template mapped for docType '${docType}'`);
  }

  return key;
}

module.exports = {
  resolveAllowedFields,
};


// const fs = require('fs');
// const path = require('path');

// const TEMPLATE_DIR = path.resolve(__dirname, '../templates');

// function loadTemplate(templateKey) {
//   const filePath = path.join(TEMPLATE_DIR, `${templateKey}.json`);

//   if (!fs.existsSync(filePath)) {
//     throw new Error(`Template file '${filePath}' not found`);
//   }

//   return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
// }

// function resolveAllowedFields(docType, state) {
//   const template = loadTemplate(docType);

//   if (!template.states || !template.states[state]) {
//     throw new Error(`State '${state}' not defined in template '${docType}'`);
//   }

//   const allowedFields = new Map();
//   const tabs = template.states[state].tabs;

//   for (const tab of tabs) {
//     for (const field of tab.fields) {
//       allowedFields.set(field.name, {
//         type: field.type,
//         required: field.required || false,
//         tab: tab.key,
//       });
//     }
//   }

//   return { allowedFields };
// }

// module.exports = {
//   loadTemplate,
//   resolveAllowedFields,
// };
