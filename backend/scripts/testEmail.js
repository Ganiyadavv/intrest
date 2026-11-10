require('dotenv').config();
const { sendPasswordResetEmail } = require('../services/emailService');

async function main() {
  const targetEmail = process.argv[2] || process.env.MAIL_FROM || 'ganeshbobbali4@gmail.com';
  console.log(`Testing Brevo Email implementation to: ${targetEmail}...`);

  try {
    const result = await sendPasswordResetEmail(targetEmail, '654321');
    console.log('✅ Success! Test email sent successfully.');
    console.log('Result details:', result);
  } catch (error) {
    console.error('❌ Failed to send email:');
    console.error(error.message || error);
    process.exit(1);
  }
}

main();

