const fs = require('fs');
const path = require('path');

const templatesDir = path.join(__dirname);

function loadTemplates() {
  const templates = {};

  fs.readdirSync(templatesDir).forEach((docFolder) => {
    const docPath = path.join(templatesDir, docFolder);
    if (fs.lstatSync(docPath).isDirectory()) {
      templates[docFolder] = {};

      fs.readdirSync(docPath).forEach((file) => {
        const [state] = file.split('.');
        const jsonPath = path.join(docPath, file);
        templates[docFolder][state] = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      });
    }
  });

  return templates;
}

module.exports = loadTemplates();
