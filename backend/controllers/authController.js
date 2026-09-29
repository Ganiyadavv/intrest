const User = require("../models/User");
const { PasswordResetOtp } = require("../models");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../services/emailService");
const jwt = require("jsonwebtoken");
const generateUserId = require("../utils/generateUserId");

const register = async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, password } = req.body;

    if (!firstName || !lastName || !email || !phoneNumber || !password) {
      return res.status(400).json({
        statusCode: 400,
        status: "ERROR",
        message: "All fields are required"
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        statusCode: 400,
        status: "ERROR",
        message: "Invalid email format"
      });
    }

    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        statusCode: 400,
        status: "ERROR",
        message: "Email already exists"
      });
    }

    const existingPhone = await User.findOne({ where: { phoneNumber } });
    if (existingPhone) {
      return res.status(400).json({
        statusCode: 400,
        status: "ERROR",
        message: "Phone number already exists"
      });
    }

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

    const newUser = await User.create({
      userId,
      firstName,
      lastName,
      email,
      phoneNumber,
      password: hashedPassword,
      role: "MEMBER",
      status: "ACTIVE"
    });



    const userResponse = newUser.toJSON();
    delete userResponse.password;

    return res.status(201).json({
      statusCode: 201,
      status: "SUCCESS",
      message: "User registered successfully",
      data: userResponse
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      status: "ERROR",
      message: "Internal server error"
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        statusCode: 400,
        status: "ERROR",
        message: "Email and password are required"
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        statusCode: 401,
        status: "ERROR",
        message: "Invalid email or password"
      });
    }

    if (user.status !== "ACTIVE") {
      return res.status(401).json({
        statusCode: 401,
        status: "ERROR",
        message: "User is not active"
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        statusCode: 401,
        status: "ERROR",
        message: "Invalid email or password"
      });
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN
    });

    const userResponse = user.toJSON();
    delete userResponse.password;

    return res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      message: "Login successful",
      data: {
        token,
        user: userResponse
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      status: "ERROR",
      message: "Internal server error"
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ statusCode: 400, status: "ERROR", message: "Please provide a valid email", data: null });
    }

    const user = await User.findOne({ where: { email, role: 'MEMBER' } });
    if (!user) {
      return res.status(404).json({ statusCode: 404, status: "ERROR", message: "Email is not registered", data: null });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    // Invalidate previous OTPs
    await PasswordResetOtp.update({ used: true }, { where: { userId: user.id, used: false } });

    await PasswordResetOtp.create({
      userId: user.id,
      otp,
      expiresAt,
      attempts: 0,
      used: false
    });

    await sendPasswordResetEmail(email, otp);

    return res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      message: "OTP sent successfully to your email.",
      data: null
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ statusCode: 500, status: "ERROR", message: "Internal server error", data: null });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ statusCode: 400, status: "ERROR", message: "Missing required fields", data: null });
    }

    const user = await User.findOne({ where: { email, role: 'MEMBER' } });
    if (!user) {
      return res.status(400).json({ statusCode: 400, status: "ERROR", message: "Invalid OTP", data: null });
    }

    const resetRecord = await PasswordResetOtp.findOne({
      where: { userId: user.id, used: false },
      order: [['createdAt', 'DESC']]
    });

    if (!resetRecord) {
      return res.status(400).json({ statusCode: 400, status: "ERROR", message: "Invalid OTP", data: null });
    }

    if (resetRecord.attempts >= 5) {
      await resetRecord.update({ used: true });
      return res.status(400).json({ statusCode: 400, status: "ERROR", message: "Too many invalid OTP attempts. Please request a new OTP.", data: null });
    }

    if (new Date() > resetRecord.expiresAt) {
      return res.status(400).json({ statusCode: 400, status: "ERROR", message: "OTP has expired", data: null });
    }

    const isMatch = (otp === resetRecord.otp);
    if (!isMatch) {
      await resetRecord.update({ attempts: resetRecord.attempts + 1 });
      if (resetRecord.attempts + 1 >= 5) {
        await resetRecord.update({ used: true });
        return res.status(400).json({ statusCode: 400, status: "ERROR", message: "Too many invalid OTP attempts. Please request a new OTP.", data: null });
      }
      return res.status(400).json({ statusCode: 400, status: "ERROR", message: "Invalid OTP", data: null });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await user.update({ password: hashedPassword });
    await resetRecord.update({ used: true });
    await PasswordResetOtp.update({ used: true }, { where: { userId: user.id, used: false } });

    return res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      message: "Password reset successfully",
      data: null
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ statusCode: 500, status: "ERROR", message: "Internal server error", data: null });
  }
};

const resendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ statusCode: 400, status: "ERROR", message: "Please provide a valid email", data: null });
    }

    const user = await User.findOne({ where: { email, role: 'MEMBER' } });
    if (!user) {
      return res.status(404).json({ statusCode: 404, status: "ERROR", message: "Email is not registered", data: null });
    }

    const lastOtp = await PasswordResetOtp.findOne({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']]
    });

    if (lastOtp && (new Date() - new Date(lastOtp.createdAt)) < 60000) {
      return res.status(429).json({ statusCode: 429, status: "ERROR", message: "Please wait 60 seconds before requesting a new OTP.", data: null });
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await PasswordResetOtp.update({ used: true }, { where: { userId: user.id, used: false } });

    await PasswordResetOtp.create({
      userId: user.id,
      otp,
      expiresAt,
      attempts: 0,
      used: false
    });

    await sendPasswordResetEmail(email, otp);

    return res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      message: "A new OTP has been sent successfully to your email.",
      data: null
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({ statusCode: 500, status: "ERROR", message: "Internal server error", data: null });
  }
};

const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        statusCode: 400,
        status: "ERROR",
        message: "Old password and new password are required",
        data: null
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        status: "ERROR",
        message: "User not found",
        data: null
      });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        statusCode: 400,
        status: "ERROR",
        message: "Incorrect old password",
        data: null
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      message: "Password changed successfully",
      data: null
    });

  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({
      statusCode: 500,
      status: "ERROR",
      message: "Internal server error",
      data: null
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  resendResetOtp,
  changePassword
};

