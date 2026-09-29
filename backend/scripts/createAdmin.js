require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcrypt');
const { User } = require('../models');
const sequelize = require('../config/database');
const generateUserId = require('../utils/generateUserId');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const hiddenInput = (query) => {
  return new Promise((resolve) => {
    const stdin = process.openStdin();
    process.stdin.on('data', char => {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.pause();
          break;
        default:
          process.stdout.clearLine();
          readline.cursorTo(process.stdout, 0);
          process.stdout.write(query + Array(rl.line.length + 1).join('*'));
          break;
      }
    });

    rl.question(query, (value) => {
      process.stdin.removeAllListeners('data');
      resolve(value);
    });
  });
};

const question = (query) => {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
};

const run = async () => {
  try {
    console.log("Checking existing Admin...");
    
    // Test connection
    await sequelize.authenticate();
    
    // Force MySQL to update the ENUM column to accept 'ADMIN'
    try {
      await sequelize.query("ALTER TABLE users MODIFY COLUMN role ENUM('MEMBER', 'ADMIN') NOT NULL DEFAULT 'MEMBER'");
    } catch (err) {
      console.log("Could not alter table natively, it may already be updated.");
    }
    
    const adminCount = await User.count({ where: { role: 'ADMIN' } });
    if (adminCount > 0) {
      console.log("Admin already exists.");
      console.log("Only one Admin is allowed.");
      process.exit(0);
    }

    console.log("No Admin found.\n");

    const firstName = await question("Enter Admin First Name: ");
    const lastName = await question("Enter Admin Last Name: ");
    const email = await question("Enter Admin Email: ");
    const phone = await question("Enter Admin Phone: ");
    const password = await hiddenInput("Enter Admin Password: ");

    if (!firstName || !lastName || !email || !phone || !password) {
      console.log("\nError: All fields are required.");
      process.exit(1);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("\nError: Invalid email format.");
      process.exit(1);
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      console.log("\nError: Email is already used by another user.");
      process.exit(1);
    }

    const existingPhone = await User.findOne({ where: { phoneNumber: phone } });
    if (existingPhone) {
      console.log("\nError: Phone number is already used by another user.");
      process.exit(1);
    }

    console.log("\nCreating Admin...");

    const hashedPassword = await bcrypt.hash(password, 10);

    let userId;
    let isUnique = false;
    while (!isUnique) {
      userId = generateUserId();
      const existingId = await User.findOne({ where: { userId } });
      if (!existingId) {
        isUnique = true;
      }
    }

    await User.create({
      userId,
      firstName,
      lastName,
      email,
      phoneNumber: phone,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    console.log("\nAdmin created successfully.\n");
    console.log(`User ID: ${userId}`);
    console.log(`Email: ${email}`);
    console.log(`Role: ADMIN\n`);

    process.exit(0);

  } catch (error) {
    console.error("\nError creating Admin:", error);
    process.exit(1);
  }
};

run();
