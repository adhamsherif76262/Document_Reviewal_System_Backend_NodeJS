// utils/pdfTemplates/review.js

const PDFDocument = require('pdfkit');
const axios = require('axios');
const imageSize = require('image-size');
// const sizeOf = require('image-size'); // ⬅️ need to install: npm i image-size

/**
 * Helper: Append certificate images to the PDF
 */

// Constants for A4 size in points (1 point = 1/72 inch)
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

async function appendCertificateImagesToPDF(doc, certificateImages = []) {
    const TOP_MARGIN = 40; // 🧍 add a comfortable upper margin for the title

  for (let i = 0; i < certificateImages.length; i++) {
    const imgUrl = certificateImages[i];

    try {
      const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
      const imgBuffer = Buffer.from(response.data);
      const { width, height } = imageSize.imageSize(imgBuffer);

      // 🧭 Detect orientation
      const isLandscape = width > height;

      // Use landscape or portrait A4 page accordingly
      const pageWidth = isLandscape ? A4_HEIGHT : A4_WIDTH;
      const pageHeight = isLandscape ? A4_WIDTH : A4_HEIGHT;

      // Add new page (auto landscape if needed)
      doc.addPage({ size: [pageWidth, pageHeight], margin: 0 });
      doc.fontSize(22)
        .font('Helvetica-Bold')
        .fillColor('#333')
        .text('Final Certificate',0,TOP_MARGIN, { align: 'center' , underline:true});
      doc.moveDown(1.5);

      // 🧮 Calculate scaling ratio
      const maxWidth = pageWidth - 60;
      const maxHeight = pageHeight - 60;
      const scale = Math.min(maxWidth / width, maxHeight / height);

      const scaledWidth = width * scale;
      const scaledHeight = height * scale;

      // Center the image
      const x = (pageWidth - scaledWidth) / 2;
      const y = (pageHeight - scaledHeight) / 2;

      // 🖼 Draw the image
      doc.image(imgBuffer, x, y, { width: scaledWidth, height: scaledHeight });

    } catch (err) {
      console.error(`⚠️ Failed to include certificate image (${imgUrl}):`, err.message);
      // Optional: add placeholder page
      doc.addPage({ size: 'A4' });
      doc.fontSize(16).fillColor('#e74c3c')
        .text(`⚠️ Failed to load certificate image:\n${imgUrl}`, 50, 100);
    }
  }
}


const generateReviewPDFBuffer = async (document, status, admin, comment, certificateImages = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const reviewedDate = new Date().toLocaleString();
      const isApproved = status === 'approved';
      const isPartiallyApproved = status === 'partiallyApproved';

      // 🧾 Header
      doc.fontSize(25)
        .font('Helvetica-Bold')
        .fillColor('#333')
        .text('Document Review Summary', {
          align: 'center',
          underline: true,
        });

      doc.moveDown(2);

      const rows = [
        ['User', document.user.name],
        ['Email', document.user.email],
        ['Document Title', document.docType],
        ['Document Number', document.docNumber],
        ['Reviewed By', `${admin.name}`],
        ['Review Date', reviewedDate],
        [
          'Status',
          isApproved
            ? 'Approved'
            : isPartiallyApproved
            ? 'Partially Approved'
            : 'Rejected',
        ],
        ...(comment ? [['Admin Comment', comment]] : []),
      ];

      doc.fontSize(16);
      const startX = doc.x;
      let y = doc.y;
      const labelWidth = 200;
      const valueWidth = 330;
      const rowHeight = 50;

      for (const [label, value] of rows) {
        const isStatusRow = label === 'Status';
        const isApprovedValue = value === 'Approved';
        const isPartiallyApprovedValue = value === 'Partially Approved';
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

        // Value (color-coded for status)
        doc.font('Helvetica')
          .fillColor(
            isStatusRow
              ? isApprovedValue
                ? '#28a745'
                : isPartiallyApprovedValue
                ? '#e67e22'
                : isRejectedValue
                ? '#e74c3c'
                : '#000'
              : '#000'
          )
          .text(value, startX + 10 + labelWidth, y + 7, {
            width: valueWidth - 20,
            align: 'left',
          });

        y += rowHeight;
      }

      doc.x = 50;
      doc.y = y + 20;

      
      // 🧾 Document Fields Table
      doc.addPage();
      doc.font('Helvetica-Bold')
        .fontSize(23)
        .fillColor('#333')
        .text('Field Review Details', { align: 'center' , underline: true });
      doc.moveDown(1);

      const fieldTableStartX = doc.x;
      let fieldY = doc.y;
      const fieldLabelWidth = 350;
      const fieldStatusWidth = 180;
      const fieldRowHeight = 50;
      const bottomMargin = 50;

      const drawFieldTableHeader = () => {
        doc.rect(fieldTableStartX, fieldY, fieldLabelWidth + fieldStatusWidth, fieldRowHeight)
          .fillAndStroke('#ddd', '#aaa');
        doc.fillColor('#000')
          .font('Helvetica-Bold').fontSize(20)
          .text('Field Name', fieldTableStartX + 10, fieldY + 7, {
            width: fieldLabelWidth,
            align: 'left',
          })
          .text('Status', fieldTableStartX + 10 + fieldLabelWidth, fieldY + 7, {
            width: fieldStatusWidth - 20,
            align: 'left',
          });
        fieldY += fieldRowHeight;
      };

      drawFieldTableHeader();

      // ✅ Convert Mongoose Map to iterable array
      const fieldsArray = Array.from(document.fields?.entries?.() || Object.entries(document.fields || {}));

      for (const [key, field] of fieldsArray) {
        const reviewStatus = field?.review?.status || 'pending';
        const color =
          reviewStatus === 'approved'
            ? '#28a745'
            : reviewStatus === 'rejected'
            ? '#e74c3c'
            : '#e67e22';

        if (fieldY + fieldRowHeight > doc.page.height - bottomMargin) {
          doc.addPage();
          fieldY = doc.y;
          drawFieldTableHeader();
        }

        doc.rect(fieldTableStartX, fieldY, fieldLabelWidth + fieldStatusWidth, fieldRowHeight)
          .fillAndStroke('#f9f9f9', '#ccc');

        doc.fillColor('#000')
          .font('Helvetica').fontSize(18)
          .text(key, fieldTableStartX + 10, fieldY + 7, {
            width: fieldLabelWidth - 20,
            align: 'left',
          });

        doc.fillColor(color)
          .font('Helvetica-Bold').fontSize(18)
          .text(reviewStatus.charAt(0).toUpperCase() + reviewStatus.slice(1), fieldTableStartX + 10 + fieldLabelWidth, fieldY + 7, {
            width: fieldStatusWidth - 20,
            align: 'left',
          });

        fieldY += fieldRowHeight;
      }
      doc.x = 50;
      doc.y = fieldY + 40;
      doc.moveDown(2);
      doc.font('Helvetica-Bold').fontSize(22).fillColor(
        isApproved
          ? '#28a745'
          : isPartiallyApproved
          ? '#e67e22'
          : '#e74c3c'
      )
        .text(
          isApproved
            ? 'Your document has been reviewed and approved successfully.':
            isPartiallyApproved
            ? 'Your document was reviewed and Partially Approved. Please Read The Reviewer’s Comment & Consider Re-submitting Your Document.'
            : 'Your document was reviewed and rejected. Please Read The Reviewer’s Comment & Consider Re-submitting Your Document.',
            { align: 'left' }
          );
          // ? '✔  Your document has been reviewed and approved successfully.'
          // : '✖ Your document was reviewed and rejected. Please read the reviewer’s comment and consider re-submitting.',
          // ? '✅ Your document has been reviewed and approved successfully.'
          // : '❌ Your document was reviewed and rejected. Please read the reviewer’s comment and consider re-submitting.',

      doc.moveDown();
      doc.fillColor('#000').text('Warm regards,', { align: 'left' });
      doc.font('Helvetica-Bold').fillColor('#000').text('The Document Review System Team', {
        align: 'left',
      });

      // 🖼️ Add certificate images (if any)
      // if (certificateImages.length > 0) {
      //   doc.addPage(); // start a new page for certificates
      //   doc.fontSize(20)
      //     .font('Helvetica-Bold')
      //     .fillColor('#333')
      //     .text('Attached Certificates', { align: 'center' });
      //   doc.moveDown(1.5);

      //   for (let i = 0; i < certificateImages.length; i++) {
      //     const imgUrl = certificateImages[i];
      //     try {
      //       // Fetch the image from URL as buffer
      //       const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
      //       const imgBuffer = Buffer.from(response.data, 'base64');

      //       const pageWidth = doc.page.width - 80; // padding
      //       const pageHeight = doc.page.height - 120;

      //       // Add image, resize if needed
      //       doc.image(imgBuffer, 40, doc.y, {
      //         fit: [pageWidth, pageHeight],
      //         align: 'center',
      //         valign: 'top',
      //       });

      //       // If more than one certificate, add a page for the next one
      //       if (i < certificateImages.length - 1) doc.addPage();
      //     } catch (err) {
      //       console.error('Error loading certificate image:', imgUrl, err.message);
      //     }
      //   }
      // }
// Constants for A4 size in points (1 point = 1/72 inch)
// const A4_WIDTH = 595.28;
// const A4_HEIGHT = 841.89;

for (let i = 0; i < certificateImages.length; i++) {
  const imgUrl = certificateImages[i];

  try {
    const response = await axios.get(imgUrl, { responseType: 'arraybuffer' });
    const imgBuffer = Buffer.from(response.data);

    const { width, height } = imageSize.imageSize(imgBuffer);

    // ✅ Calculate scaling ratio to fit inside A4 with small margins
    const maxWidth = A4_WIDTH - 60;
    const maxHeight = A4_HEIGHT - 60;
    const scale = Math.min(maxWidth / width, maxHeight / height);

    const scaledWidth = width * scale;
    const scaledHeight = height * scale;

    const x = (A4_WIDTH - scaledWidth) / 2;
    const y = (A4_HEIGHT - scaledHeight) / 2;

    // Create a new A4 page and insert the scaled image centered
    // doc.addPage({ size: 'A4', margin: 0 });
    // doc.fontSize(20)
    //   .font('Helvetica-Bold')
    //   .fillColor('#333')
    //   .text('Final Certificate', { align: 'center' });
    // doc.moveDown(1.5);
    // doc.image(imgBuffer, x, y, { width: scaledWidth, height: scaledHeight });

  } catch (err) {
    console.error(`⚠️ Failed to include certificate image (${imgUrl}):`, err.message);
  }
}

  await appendCertificateImagesToPDF(doc, document.certificate.images);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = generateReviewPDFBuffer;
