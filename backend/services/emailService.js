const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.MAIL_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT || '587', 10),
    secure: process.env.MAIL_PORT === '465',
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    },
    // Strict connection timeouts to prevent hanging when cloud hosts (e.g. Render Free) block SMTP ports
    connectionTimeout: 4000,
    greetingTimeout: 4000,
    socketTimeout: 4000
  });
}

const sendPasswordResetEmail = async (to, otp) => {
  const mailSubject = 'DhanaMitra - Password Reset OTP';
  const mailBody = `Hello,\n\nWe received a request to reset your DhanaMitra account password.\n\nYour OTP is:\n${otp}\n\nThis OTP is valid for 5 minutes.\n\nIf you did not request a password reset, you can ignore this email.\n\nRegards,\nDhanaMitra Team`;

  console.log('====================================================');
  console.log(`[DhanaMitra OTP] Password reset OTP for ${to}: ${otp}`);
  console.log('====================================================');

  // 1. Try Resend API (HTTP REST over port 443 - works 100% on Render Free)
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.MAIL_FROM || 'DhanaMitra <onboarding@resend.dev>',
          to: [to],
          subject: mailSubject,
          text: mailBody
        })
      });

      if (response.ok) {
        console.log(`Email sent successfully via Resend API to ${to}`);
        return { success: true };
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.warn('Resend API responded with error:', errorData);
      }
    } catch (apiErr) {
      console.warn('Resend API request failed:', apiErr.message);
    }
  }

  // 2. Try Brevo API (HTTP REST over port 443)
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sender: { email: process.env.MAIL_FROM || process.env.MAIL_USERNAME || 'noreply@interestmanagement.com' },
          to: [{ email: to }],
          subject: mailSubject,
          textContent: mailBody
        })
      });

      if (response.ok) {
        console.log(`Email sent successfully via Brevo API to ${to}`);
        return { success: true };
      }
    } catch (brevoErr) {
      console.warn('Brevo API request failed:', brevoErr.message);
    }
  }

  // 3. Try Nodemailer SMTP with 4.5 second hard timeout
  if (transporter) {
    try {
      const mailOptions = {
        from: process.env.MAIL_FROM || 'noreply@interestmanagement.com',
        to,
        subject: mailSubject,
        text: mailBody
      };

      const sendPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout: Port blocked or unreachable')), 4500)
      );

      await Promise.race([sendPromise, timeoutPromise]);
      console.log(`Email sent successfully via SMTP to ${to}`);
      return { success: true };
    } catch (smtpErr) {
      console.warn(`SMTP send failed or timed out: ${smtpErr.message}`);
      return { success: false, error: smtpErr.message, otp };
    }
  }

  return { success: false, error: 'No mail service configured', otp };
};

module.exports = {
  sendPasswordResetEmail
};

