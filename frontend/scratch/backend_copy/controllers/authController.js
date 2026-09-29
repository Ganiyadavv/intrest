const User = require("../models/User");
const bcrypt = require("bcrypt");
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

module.exports = {
  register,
  login
};

