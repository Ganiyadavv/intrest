const { Notification, PersonRecord, User } = require("../models");

const sendResponse = (res, statusCode, status, message, data = null) => {
  const response = { statusCode, status, message };
  if (data) response.data = data;
  return res.status(statusCode).json(response);
};

exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notifications = await Notification.findAll({
      where: { recipientId: userId },
      order: [['createdAt', 'DESC']]
    });

    return sendResponse(res, 200, "SUCCESS", "Notifications fetched successfully", notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.getNotificationPersonDetails = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.notificationId;

    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return sendResponse(res, 404, "ERROR", "Notification not found");
    }

    if (notification.recipientId !== userId) {
      return sendResponse(res, 403, "ERROR", "You are not authorized to view this notification");
    }

    if (!notification.personRecordId) {
      return sendResponse(res, 404, "ERROR", "No person record associated with this notification");
    }

    const record = await PersonRecord.findByPk(notification.personRecordId, {
      attributes: { exclude: ['ownerId', 'targetUserId', 'createdAt', 'updatedAt'] }
    });

    if (!record) {
      return sendResponse(res, 404, "ERROR", "Associated person record not found");
    }

    return sendResponse(res, 200, "SUCCESS", "Person details fetched successfully", record);
  } catch (error) {
    console.error("Error fetching notification person details:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};
