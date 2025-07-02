// utils/pdfTemplates/review.js
const PDFDocument = require('pdfkit');
// 3️⃣ Manual table PDF generator
const generaterereviewPDFBuffer = (document, status, admin, comment) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const buffers = [];

    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));

    const reviewedDate = new Date().toLocaleString();
    const isApproved = status === 'approved';

    doc.fontSize(25).font('Helvetica-Bold').fillColor('#333').text('Document Review Summary', {
      align: 'center',
      underline: true,
    });

    doc.moveDown(2);

    const rows = [
      ['User', document.user.name],
      ['Email', document.user.email],
      ['Document Title', document.title],
      ['Reviewed By', `${admin.name} (${admin.email})`],
      ['Review Date', reviewedDate],
      ['Status', isApproved ? 'Approved' : 'Rejected'],
      ...(comment ? [['Admin Comment', comment]] : []),
    ];

    doc.fontSize(16);
    const startX = doc.x;
    let y = doc.y;
    const labelWidth = 130;
    const valueWidth = 400;
    const rowHeight = 50;

    for (const [label, value] of rows) {
  const isStatusRow = label === 'Status';
  const isApprovedValue = value === 'Approved';
  const isRejectedValue = value === 'Rejected';

  // Draw cell background
  doc.rect(startX, y, labelWidth + valueWidth, rowHeight)
    .fillAndStroke('#f0f0f0', '#ccc');

  // Label
  doc.fillColor('#000')
    .font('Helvetica-Bold')
    .text(`${label}:`, startX + 10, y + 7, {
      width: labelWidth,
      align: 'left',
    });

  // Value (with conditional color for "Status" row)
  doc.font('Helvetica')
    .fillColor(isStatusRow
      ? isApprovedValue ? '#28a745'
      : isRejectedValue ? '#e74c3c'
      : '#000'
      : '#000')
    .text(value, startX + 10 + labelWidth, y + 7, {
      width: valueWidth - 20,
      align: 'left',
    });

  y += rowHeight;
}


    doc.x = 50;
    doc.y = y + 20;

    doc.moveDown(5);
    doc.fontSize(18).fillColor('#000')
      .text(isApproved
        ? 'Your document has been reviewed and approved successfully.'
        : 'Your document was reviewed and rejected. Please read the reviewer’s comment and consider re-submitting.'
      , { align: 'left' });

    doc.moveDown();
    doc.text('Warm regards,', { align: 'left' });
    doc.font('Helvetica-Bold').text('The Document Review System Team', { align: 'left' });

    doc.end();
  });
};

module.exports = generaterereviewPDFBuffer;
