// utils/emailTemplates/resubmission.js
function resubmissionEmailTemplate(user, document) {
    
    // ✅ Send Re-submission Email
    const subject = `📤 Document Re-Submission Received – Pending Review`;

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #ddd;">
        <h2 style="color: #4A90E2; text-align: center;">📤 Document Re-Submitted – Pending Review</h2>

        <p>Dear <strong>${user.name}</strong>,</p>
        <p>We’ve received your updated document titled <strong>"${document.title}"</strong>.</p>

        <p>Our team will review your re-submission shortly. The document is currently <strong style="color:#f0ad4e;">pending review</strong>.</p>

        <hr style="margin: 20px 0;" />

        <ul style="list-style: none; padding: 0;">
          <li><strong>📄 Document Title:</strong> ${document.title}</li>
          <li><strong>📁 Category:</strong> ${document.category || 'N/A'}</li>
          <li><strong>📅 Re-Submitted:</strong> ${new Date().toLocaleString()}</li>
          <li><strong>📌 Status:</strong> Pending Review</li>
        </ul>

        <hr style="margin: 20px 0;" />

        <p><strong>⏭️ What Happens Next:</strong></p>
        <ul>
          <li>You'll get an email when the document is reviewed.</li>
          <li>If approved, you're done. If rejected again, you'll receive feedback.</li>
        </ul>

        <p>Thanks for re-engaging with the <strong>Document Review System</strong>.</p>

        <p style="margin-top: 30px;">Warm regards,<br/><strong>The Document Review System Team</strong><br/><a href="#">yourdomain.com</a></p>
        <p style="font-size: 0.9em; color: #888;">Need help? Contact <a href="mailto:adhamsherif7261@gmail.com">adhamsherif7261@gmail.com</a></p>
      </div>
    `;

  return { subject, htmlBody };
}

module.exports = resubmissionEmailTemplate;
