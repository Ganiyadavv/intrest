const nodemailer = require('nodemailer');

/**
 * Send email using Brevo REST API v3
 * Uses standard HTTPS (port 443) with the Brevo API key (xkeysib-...)
 */
const sendViaBrevoApi = async ({ to, subject, html, text, from, fromName }) => {
  const apiKey = (process.env.BREVO_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('BREVO_API_KEY is not defined in environment variables');
  }

  const senderEmail = from || process.env.MAIL_FROM || 'ganeshbobbali4@gmail.com';
  const senderName = fromName || process.env.MAIL_FROM_NAME || 'DhanaMitra';

  const payload = {
    sender: {
      name: senderName,
      email: senderEmail
    },
    to: [
      {
        email: to
      }
    ],
    subject: subject,
    htmlContent: html,
    textContent: text || html.replace(/<[^>]*>/g, '')
  };

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Brevo API returned HTTP status ${response.status}`;
    console.error(`[Brevo API Error ${response.status}]:`, errorMsg);

    if (errorMsg.includes('unrecognised IP address') || errorMsg.includes('authorised_ips')) {
      console.warn('--------------------------------------------------------------------------------');
      console.warn('Brevo IP Security Restriction:');
      console.warn('Your current IP address must be added to Brevo Authorized IPs.');
      console.warn('Visit: https://app.brevo.com/security/authorised_ips to authorize it.');
      console.warn('--------------------------------------------------------------------------------');
    }

    throw new Error(errorMsg);
  }

  console.log(`Email successfully sent via Brevo API to ${to}. MessageId: ${data?.messageId}`);
  return data;
};

/**
 * Send email using Nodemailer SMTP (fallback)
 */
const sendViaSmtp = async ({ to, subject, html, text, from, fromName }) => {
  const fromEmail = from || process.env.MAIL_FROM || process.env.MAIL_USERNAME || 'noreply@dhanamitra.com';
  const senderName = fromName || process.env.MAIL_FROM_NAME || 'DhanaMitra';

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp-relay.brevo.com',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: Number(process.env.MAIL_PORT) === 465,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const mailOptions = {
    from: `"${senderName}" <${fromEmail}>`,
    to,
    subject,
    text: text || html.replace(/<[^>]*>/g, ''),
    html
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email successfully sent via SMTP to ${to}. MessageId: ${info.messageId}`);
  return info;
};

/**
 * Universal sendEmail function
 * Prioritizes Brevo API (BREVO_API_KEY), falls back to SMTP if configured,
 * or logs in mock mode if neither is configured.
 */
const sendEmail = async ({ to, subject, html, text, from, fromName }) => {
  if (process.env.BREVO_API_KEY) {
    return await sendViaBrevoApi({ to, subject, html, text, from, fromName });
  }

  if (process.env.MAIL_HOST && process.env.MAIL_USERNAME && process.env.MAIL_PASSWORD) {
    return await sendViaSmtp({ to, subject, html, text, from, fromName });
  }

  console.log(`[Mock Email] No email credentials provided. Simulating email send to ${to}:`);
  console.log(`Subject: ${subject}`);
  return { mock: true, to, subject };
};

/**
 * Send Password Reset OTP Email
 */
const sendPasswordResetEmail = async (to, otp) => {
  const subject = 'Password Reset OTP - DhanaMitra';
  const text = `Hello,\n\nWe received a request to reset your DhanaMitra account password.\n\nYour OTP is:\n${otp}\n\nThis OTP is valid for 5 minutes.\n\nIf you did not request a password reset, you can ignore this email.\n\nRegards,\nDhanaMitra Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #FFFFFF;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #056B38; margin: 0; font-size: 24px;">₹ DhanaMitra</h2>
        <p style="color: #64748B; font-size: 13px; margin-top: 4px;">Smart Interest Management</p>
      </div>
      <p style="color: #1E293B; font-size: 15px;">Hello,</p>
      <p style="color: #1E293B; font-size: 15px;">We received a request to reset your DhanaMitra account password. Use the verification OTP below to proceed:</p>
      <div style="background-color: #F0FDF4; border: 1.5px dashed #056B38; padding: 16px; text-align: center; margin: 24px 0; border-radius: 8px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #056B38;">${otp}</span>
      </div>
      <p style="color: #64748B; font-size: 13px;">This OTP is valid for <strong>5 minutes</strong>. For your security, never share this OTP with anyone.</p>
      <p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
      <p style="color: #64748B; font-size: 13px; margin: 0;">Warm regards,<br/><strong style="color: #056B38;">DhanaMitra Team</strong></p>
    </div>
  `;

  return await sendEmail({ to, subject, html, text });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendViaBrevoApi,
  sendViaSmtp
};
