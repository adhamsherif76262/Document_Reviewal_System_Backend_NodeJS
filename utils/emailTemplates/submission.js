// utils/emailTemplates/submission.js
function submissionEmailTemplate(user, document) {

       // Optional: Save for debugging locally
      // fs.writeFileSync('submission-debug.pdf', pdfBuffer);
  
      // 4️⃣ Compose and send email
      const subject = `⏳ Document Submission Received – Pending Review`;
  
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #ddd;">
          <h2 style="color: #f0ad4e; text-align: center;">⏳ Document Submitted – Pending Review</h2>
  
          <p>Dear <strong>${user.name}</strong>,</p>
          <p>Thank you for submitting your document <strong>"${document.docType}"</strong>.</p>
          <p>Your file is currently <strong style="color:#f0ad4e;">pending review</strong>.</p>
  
          <hr style="margin: 20px 0;" />
  
          <ul style="list-style: none; padding: 0;">
            <li><strong>📄 Document Title:</strong> ${document.docType}</li>
            <li><strong>📁 Document Number:</strong> ${document.docNumber}</li>
            <li><strong>⏱️ Status:</strong> Pending Review</li>
            <li><strong>📅 Submitted:</strong> ${new Date().toLocaleString()}</li>
          </ul>
  
          <hr style="margin: 20px 0;" />
  
          <p><strong>⏭️ What Happens Next:</strong></p>
          <ul>
            <li>You'll get another email after admin review.</li>
            <li>If approved, you're done. If rejected, you'll get helpful feedback.</li>
          </ul>
  
          <p>Thanks for using the <strong>Document Review System</strong>.</p>
  
          <p style="margin-top: 30px;">Warm regards,<br/><strong>The Document Review System Team</strong><br/><a href=${process.env.DOMAIN_URL}>CLOADocumentReviewSystem.com</a></p>
          <p style="font-size: 0.9em; color: #888;">Need help? Contact <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a></p>
        </div>
      `;

  return { subject, htmlBody };
}

module.exports = submissionEmailTemplate;
