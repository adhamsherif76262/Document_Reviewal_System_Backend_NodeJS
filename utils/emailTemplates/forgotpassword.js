// utils/emailTemplates/forgotpassword.js

function forgotpasswordEmailTemplate(user, otp) {


    // 5️⃣ Compose styled HTML email (for email verification users)
    const subject = '🔐 Password Reset Request – OTP Inside';

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #ddd;">
        <h2 style="color: #4A90E2; text-align: center;">🔐 Password Reset Request</h2>

        <p>Dear <strong>${user.name}</strong>,</p>

        <p>We received a request to reset the password for your account associated with <strong>${user.email}</strong>.</p>

        <p>Please use the following One-Time Password (OTP) to reset your password:</p>

        <div style="background-color: #fff; padding: 20px; text-align: center; border: 2px dashed #4A90E2; border-radius: 6px; margin: 20px 0;">
          <p style="font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #4A90E2;">${otp}</p>
          <p style="font-size: 13px; color: #999;">This code will expire in 15 minutes.</p>
        </div>

        <p>If you did not request a password reset, please ignore this email. Your account remains secure.</p>

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

module.exports = forgotpasswordEmailTemplate;
