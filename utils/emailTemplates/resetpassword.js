// utils/emailTemplates/resetpassword.js

function resetpasswordEmailTemplate(user) {

    const subject = '✅ Password Reset Confirmation';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #ddd;">
        <h2 style="color: #28a745; text-align: center;">✅ Password Successfully Reset</h2>

        <p>Dear <strong>${user.name}</strong>,</p>

        <p>We're writing to confirm that the password for your account <strong>${user.email}</strong> has been successfully reset.</p>

        <p>If you made this change, no further action is needed. You can now log in with your new password.</p>

        <p style="color: #e74c3c;"><strong>If you did NOT request this change</strong>, please contact us immediately to secure your account.</p>

        <hr style="margin: 20px 0;" />

        <p>Need help? Contact our support team:</p>
        <p><a href="mailto:adhamsherif7261@gmail.com">adhamsherif7261@gmail.com</a></p>

        <p style="margin-top: 30px;">
          Warm regards,<br/>
          <strong>The Document Review System Team</strong><br/>
          <a href="https://yourdomain.com" style="color: #4A90E2;">yourdomain.com</a>
        </p>

        <p style="font-size: 0.8em; color: #999; margin-top: 20px;">This is an automated email. Please do not reply directly.</p>
      </div>
    `;

  return { subject, htmlBody };
}

module.exports = resetpasswordEmailTemplate;
