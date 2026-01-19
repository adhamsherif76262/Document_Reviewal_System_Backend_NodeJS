// const fs = require('fs');
// const path = require('path');

// const templatesDir = path.join(__dirname);

// function loadTemplates() {
//   const templates = {};

//   fs.readdirSync(templatesDir).forEach((docFolder) => {
//     const docPath = path.join(templatesDir, docFolder);
//     if (fs.lstatSync(docPath).isDirectory()) {
//       templates[docFolder] = {};

//       fs.readdirSync(docPath).forEach((file) => {
//         const [state] = file.split('.');
//         const jsonPath = path.join(docPath, file);
//         templates[docFolder][state] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
//       });
//     }
//   });

//   return templates;
// }

// module.exports = loadTemplates();


const fs = require("fs");
const path = require("path");

const TEMPLATE_DIR = path.join(__dirname);

// function loadTemplate(templateKey) {
//   const filePath = path.join(TEMPLATE_DIR, `${templateKey}.json`);
//   if (!fs.existsSync(filePath)) {
  //     throw new Error(`Template '${templateKey}' not found`);
  //   }
//   return JSON.parse(fs.readFileSync(filePath, "utf8"));
// }

function loadTemplate(templateKey, state) {
    const filePath = path.join(TEMPLATE_DIR, `${templateKey}.json`);
  
    if (!fs.existsSync(filePath)) {
        throw new Error(`Template '${templateKey}' not found`);
      }

      const template = JSON.parse(fs.readFileSync(filePath, "utf8"));
    
  // If no state requested → return full template
  if (!state) return template;

  // Validate state
  if (!template.states || !template.states[state]) {
      throw new Error(`State '${state}' not defined in template '${templateKey}'`);
    }
  
    // Return ONLY the requested state (this is critical)
    return {
    templateKey: template.templateKey,
    appliesTo: template.appliesTo,
    globals:template.globals,
    state,
    tabs: template.states[state].tabs
  };
}

// function loadTemplate(templateKey, state = null) {
//   // const filePath = path.join(process.cwd(), "templates", `${templateKey}.json`);
//   // const filePath = path.join(process.cwd(), "templates", `${templateKey}.json`);
//     const filePath = path.join(TEMPLATE_DIR, `${templateKey}.json`);
  
//   if (!fs.existsSync(filePath)) {
//     throw new Error(`Template '${templateKey}' not found`);
//   }

//   const template = JSON.parse(fs.readFileSync(filePath, "utf8"));

//   if (!state) return template;

//   if (!template.states || !template.states[state]) {
//     throw new Error(`State '${state}' not defined in template '${templateKey}'`);
//   }

//   return {
//     templateKey: template.templateKey,
//     appliesTo: template.appliesTo,
//     state,
//     tabs: template.states[state].tabs
//   };
// }



function listTemplates() {
  return fs.readdirSync(TEMPLATE_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => {
      const tpl = JSON.parse(
        fs.readFileSync(path.join(TEMPLATE_DIR, f), "utf8")
      );

      return {
        templateKey: tpl.templateKey,
        templateKeyAr: tpl.templateKeyAr,
        appliesTo: tpl.appliesTo,
        states: Object.keys(tpl.states),
      };
    });
}

module.exports = { loadTemplate, listTemplates };
