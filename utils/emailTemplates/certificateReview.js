// utils/emailTemplates/review.js
function finalcertificatereviewsubmissionEmailTemplate(user, document, status, admin, comment) {
    
 // 6️⃣ Send beautiful HTML email
const subjectPrefix = status === 'approved' ? '✅ Document Final Certificate Review Update – Approved' : '❌ Document Final Certificate Review Update – Action Required';

const htmlBody = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #ddd;">
    <h2 style="color: ${status === 'approved' ? '#28a745' : '#e74c3c'}; text-align: center;">
      ${status === 'approved' ? '✅ Document Final Certificate Approved' : '❌ Document Final Certificate Rejected'}
    </h2>

    <p>Dear <strong>${document.user.name}</strong>,</p>

    <p>We hope you're doing well.</p>

    <p>
      We wanted to inform you that your recent document submission with number <strong>${document.docNumber}</strong> has been reviewed by one of our administrators.
      ${status === 'approved' 
        ? `We’re happy to inform you that it <strong>meets all our criteria</strong> and has been marked as <strong style="color:#28a745;">APPROVED</strong>.`
        : `Unfortunately, the document <strong>did not meet the required criteria</strong> and has been marked as <strong style="color:#e74c3c;">REJECTED</strong>.`}
    </p>

    <hr style="margin: 20px 0;" />

    <p><strong>📄 Document Status:</strong> ${status === 'approved' ? '✅ Approved' : status === 'partiallyApproved' ? '❌ partiallyApproved' : '❌ Rejected'}</p>
    <p><strong>👤 Reviewed By:</strong> ${admin.name} (${admin.email})</p>
    ${comment ? `
      <p><strong>📝 Comment from Reviewer:</strong></p>
      <blockquote style="margin: 10px 0; padding: 10px; background-color: #fffbe6; border-left: 4px solid ${status === 'approved' ? '#28a745' : '#e74c3c'};">
        <em>${comment}</em>
      </blockquote>
    ` : 
      ` 
        <blockquote style="margin: 10px 0; padding: 10px; background-color: #fffbe6; border-left: 4px solid ${status === 'approved' ? '#28a745' : '#e74c3c'};">
          <em>The Reviewer Comments Can Be Found On Each Individual Field Uploaded</em>
        </blockquote>
      `}

    <hr style="margin: 20px 0;" />

    ${status === 'approved' 
      ? `
        <p>🎉 Your document has been successfully reviewed and approved. You may now proceed with the next steps in your process.</p>
      `
      : `
        <p>But don’t worry — you're welcome to revise and <strong>resubmit your document</strong> at any time. If you need guidance or clarification, we’re here to help.</p>
        
        <p><strong>🔄 Next Steps:</strong></p>
        <ul style="padding-left: 20px;">
          <li>Review the admin comment above.</li>
          <li>Make the necessary changes to your document.</li>
          <li>Log in and upload the updated version for a new review.</li>
        </ul>
      `
    }

    <hr style="margin: 20px 0;" />

    <p>Thank you for using the <strong>Document Review System</strong>. We’re committed to helping you get your work approved efficiently and professionally.</p>

    <p style="margin-top: 30px;">
      Warm regards,<br/>
      <strong>The Document Review System Team</strong><br/>
      <a href=${process.env.DOMAIN_URL} style="color: #4A90E2;">CLOADocumentReviewSystem.com</a>
    </p>
    
    <p style="margin-top: 10px; font-size: 0.9em; color: #888;">Need help? Contact us at <a href="mailto:${process.env.EMAIL_USER}">${process.env.EMAIL_USER}</a></p>
  </div>
`;

  return { subjectPrefix, htmlBody };
}

module.exports = finalcertificatereviewsubmissionEmailTemplate;
