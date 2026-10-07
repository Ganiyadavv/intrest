const User = require('../models/User');
const { Op } = require('sequelize');

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        status: 'ERROR',
        message: 'User not found'
      });
    }

    return res.status(200).json({
      statusCode: 200,
      status: 'SUCCESS',
      message: 'Profile retrieved successfully',
      data: user
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      status: 'ERROR',
      message: 'Internal server error'
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Only extract allowed fields
    const {
      fullName,
      email,
      phoneNumber,
      profileImage,
      address,
      city,
      state,
      pincode
    } = req.body;

    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        statusCode: 404,
        status: 'ERROR',
        message: 'User not found'
      });
    }

    // Check if email or phone is being updated and already exists
    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ where: { email } });
      if (existingEmail) {
        return res.status(400).json({
          statusCode: 400,
          status: 'ERROR',
          message: 'Email already exists'
        });
      }
      user.email = email;
    }

    if (phoneNumber && phoneNumber !== user.phoneNumber) {
      const existingPhone = await User.findOne({ where: { phoneNumber } });
      if (existingPhone) {
        return res.status(400).json({
          statusCode: 400,
          status: 'ERROR',
          message: 'Phone number already exists'
        });
      }
      user.phoneNumber = phoneNumber;
    }

    if (fullName) user.fullName = fullName;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (address !== undefined) user.address = address;
    if (city !== undefined) user.city = city;
    if (state !== undefined) user.state = state;
    if (pincode !== undefined) user.pincode = pincode;

    await user.save();

    const updatedUser = user.toJSON();
    delete updatedUser.password;

    return res.status(200).json({
      statusCode: 200,
      status: 'SUCCESS',
      message: 'Profile updated successfully',
      data: updatedUser
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      status: 'ERROR',
      message: 'Internal server error'
    });
  }
};

const searchUser = async (req, res) => {
  try {
    let { userId, name, query } = req.query;

    if (!userId && !name && !query) {
      return res.status(400).json({
        statusCode: 400,
        status: 'ERROR',
        message: 'Search query is required'
      });
    }

    let users;

    if (userId) {
      userId = userId.trim().toUpperCase();
      const userIdRegex = /^USR-[A-Z0-9]{8}$/;
      if (!userIdRegex.test(userId)) {
        return res.status(400).json({
          statusCode: 400,
          status: 'ERROR',
          message: 'Invalid user ID format'
        });
      }

      const user = await User.findOne({
        where: { userId },
        attributes: { exclude: ['password', 'id', 'createdAt', 'updatedAt'] }
      });

      if (!user) {
        return res.status(404).json({
          statusCode: 404,
          status: 'ERROR',
          message: 'User not found'
        });
      }

      return res.status(200).json({
        statusCode: 200,
        status: 'SUCCESS',
        message: 'User found',
        data: user
      });
    } else {
      // Name or general query search
      let searchTerm = name || query;
      searchTerm = searchTerm.trim();
      
      users = await User.findAll({
        where: {
          [Op.or]: [
            { fullName: { [Op.like]: `%${searchTerm}%` } },
            // If they provided a generic query, it might be a partial userId
            { userId: { [Op.like]: `%${searchTerm}%` } }
          ]
        },
        attributes: { exclude: ['password', 'id', 'createdAt', 'updatedAt'] }
      });

      return res.status(200).json({
        statusCode: 200,
        status: 'SUCCESS',
        message: 'Users found',
        data: users
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      statusCode: 500,
      status: 'ERROR',
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  searchUser
};
