// utils/emailTemplates/resendverification.js

function resendverificationEmailTemplate(user, otp) {

      const subject = '🔁 Resend: Your Email Verification OTP';
      const htmlBody = `
  <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px; max-width: 600px; margin: auto; border-radius: 10px; border: 1px solid #ddd;">
    <h2 style="color: #4A90E2; text-align: center;">🔄 Resend Email Verification</h2>
    <p>Dear <strong>${user.name}</strong>,</p>
    <p>You recently requested a new One-Time Password (OTP) to verify your email address on the <strong>Document Review System</strong>.</p>
    <p>Please use the code below to complete your verification:</p>
    <div style="background-color: #fff; padding: 20px; text-align: center; border: 2px dashed #4A90E2; border-radius: 6px; margin: 20px 0;">
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 3px; color: #4A90E2;">${otp}</p>
      <p style="font-size: 13px; color: #999;">This code expires in 15 minutes.</p>
    </div>
    <p>If you did not initiate this request, please ignore this email.</p>
    <p style="margin-top: 30px;">
      Warm regards,<br/>
      <strong>The Document Review System Team</strong><br/>
      <a href="https://yourdomain.com" style="color: #4A90E2;">yourdomain.com</a>
    </p>
    <p style="font-size: 0.8em; color: #999; margin-top: 20px;">
      Need help? Contact <a href="mailto:adhamsherif7261@gmail.com">adhamsherif7261@gmail.com</a>
    </p>
  </div>
      `;


  return { subject, htmlBody };
}

module.exports = resendverificationEmailTemplate;
