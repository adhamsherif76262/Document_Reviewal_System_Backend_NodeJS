// utils/sms.js
const twilio = require('twilio');

const client = new twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

exports.sendPhoneOTP = async (phone, otp) => {
  return await client.messages.create({
    body: `Your OTP for Document Review System is: ${otp}`,
    from: process.env.TWILIO_PHONE,
    to: phone,
  });
};
