const crypto = require("crypto");

function generateUserId() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let randomPart = "";

  while (randomPart.length < 8) {
    const bytes = crypto.randomBytes(8);
    for (const byte of bytes) {
      randomPart += characters[byte % characters.length];
      if (randomPart.length === 8) {
        break;
      }
    }
  }
  return `USR-${randomPart}`;
}

module.exports = generateUserId;

