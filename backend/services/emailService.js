const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
});

const sendPasswordResetEmail = async (to, otp) => {
  const mailOptions = {
    from: process.env.MAIL_FROM || 'noreply@interestmanagement.com',
    to,
    subject: 'Password Reset OTP',
    text: `Hello,\n\nWe received a request to reset your Interest Management account password.\n\nYour OTP is:\n${otp}\n\nThis OTP is valid for 5 minutes.\n\nIf you did not request a password reset, you can ignore this email.\n\nRegards,\nInterest Management Team`
  };

  try {
    if (process.env.MAIL_HOST) {
        await transporter.sendMail(mailOptions);
    } else {
        console.log("Mocking email send since MAIL_HOST is not set. OTP:", otp);
    }
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = {
  sendPasswordResetEmail
};
