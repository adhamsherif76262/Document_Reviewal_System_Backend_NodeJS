// utils/pdfTemplates/submission.js
const PDFDocument = require('pdfkit');
// 3️⃣ Manual table PDF generator
const generateSubmissionPDFBuffer = (user, document) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];
  
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  
    const submissionDate = new Date().toLocaleString();
  
    doc.fontSize(25).fillColor('#333').text('Document Submission Summary', {
      align: 'center',
      underline: true,
    });
  
    doc.moveDown(2);
  
    const rows = [
      ['User', user.name],
      ['Email', user.email],
      ['Document Title', document.title],
      ['Category', document.category || 'N/A'],
      ['File Name', document.fileName],
      ['Submission Date', submissionDate],
      ['Status', 'Pending Review'],
    ];
  
    doc.fontSize(16);
    const startX = doc.x;
    let y = doc.y;
  
    const labelWidth = 130;
    const valueWidth = 400;
    const rowHeight = 50;
  
    for (const [label, value] of rows) {
      doc
        .rect(startX, y, labelWidth + valueWidth, rowHeight)
        .fillAndStroke('#f0f0f0', '#ccc');
    
      doc.fillColor('#000')
        .font('Helvetica-Bold')
        .text(`${label}:`, startX + 10, y + 7, {
          width: labelWidth,
          align: 'left',
        });
      
      doc.font('Helvetica')
        .text(value, startX + 10 + labelWidth, y + 7, {
          width: valueWidth - 20,
          align: 'left',
        });
      
      y += rowHeight;
    }
    doc.x = 50;  // reset to left margin
    doc.y = y + 20; // position below the last row
  doc.moveDown(5);
  doc.fontSize(20).fillColor('#000').text('Thank you for submitting your document.', {
    align: 'left',
  });
  doc.text('You will be notified once the review is complete.', {
    align: 'left',
  });
  doc.moveDown();
  doc.text('Warm regards,', {
    align: 'left',
  });
  doc.font('Helvetica-Bold').text('The Document Review System Team', {
    align: 'left',
  });
  
    doc.end();
  });
};

module.exports = generateSubmissionPDFBuffer;
