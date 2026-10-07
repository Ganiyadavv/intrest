const { User, PersonRecord } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    const totalMembers = await User.count({ where: { role: 'MEMBER' } });
    const totalRecords = await PersonRecord.count();
    
    const pendingRecords = await PersonRecord.count({ where: { status: 'PENDING' } });
    const acceptedRecords = await PersonRecord.count({ where: { status: 'ACCEPTED' } });
    const rejectedRecords = await PersonRecord.count({ where: { status: 'REJECTED' } });
    const completedRecords = await PersonRecord.count({ where: { status: 'COMPLETED' } });
    
    // Member Details preview
    const members = await User.findAll({
      where: { role: 'MEMBER' },
      attributes: { exclude: ['password'] },
      limit: 10,
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      message: "Admin dashboard fetched successfully",
      data: {
        statistics: {
          totalMembers,
          totalRecords,
          pendingRecords,
          acceptedRecords,
          rejectedRecords,
          completedRecords
        },
        members
      }
    });
  } catch (error) {
    console.error("Error fetching dashboard:", error);
    return res.status(500).json({
      statusCode: 500,
      status: "ERROR",
      message: "Internal server error"
    });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const { search } = req.query;
    const whereClause = { role: 'MEMBER' };
    
    if (search) {
      whereClause[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { userId: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phoneNumber: { [Op.like]: `%${search}%` } }
      ];
    }

    const members = await User.findAll({
      where: whereClause,
      attributes: { exclude: ['password'] }
    });

    return res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      message: "Members fetched successfully",
      data: members
    });
  } catch (error) {
    console.error("Error fetching members:", error);
    return res.status(500).json({
      statusCode: 500,
      status: "ERROR",
      message: "Internal server error"
    });
  }
};

exports.getMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await User.findOne({
      where: { id, role: 'MEMBER' },
      attributes: { exclude: ['password'] }
    });

    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        status: "ERROR",
        message: "Member not found"
      });
    }

    return res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      message: "Member details fetched successfully",
      data: member
    });
  } catch (error) {
    console.error("Error fetching member:", error);
    return res.status(500).json({
      statusCode: 500,
      status: "ERROR",
      message: "Internal server error"
    });
  }
};

exports.updateMemberStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({
        statusCode: 400,
        status: "ERROR",
        message: "Invalid status value. Must be ACTIVE or INACTIVE."
      });
    }

    const member = await User.findOne({ where: { id, role: 'MEMBER' } });

    if (!member) {
      return res.status(404).json({
        statusCode: 404,
        status: "ERROR",
        message: "Member not found"
      });
    }

    await member.update({ status });

    const updatedMember = member.toJSON();
    delete updatedMember.password;

    return res.status(200).json({
      statusCode: 200,
      status: "SUCCESS",
      message: "Member status updated successfully",
      data: updatedMember
    });
  } catch (error) {
    console.error("Error updating member status:", error);
    return res.status(500).json({
      statusCode: 500,
      status: "ERROR",
      message: "Internal server error"
    });
  }
};
