const { Notification, PersonRecord, LenderRecord, User } = require("../models");

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
      include: [
        { model: User, as: 'sender', attributes: ['id', 'userId', 'fullName', 'email'] }
      ],
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

    if (!notification.personRecordId && !notification.lenderRecordId) {
      return sendResponse(res, 404, "ERROR", "No record associated with this notification");
    }

    let record = null;
    let recordType = null;

    if (notification.personRecordId) {
      record = await PersonRecord.findByPk(notification.personRecordId, {
        include: [{ model: User, as: 'owner', attributes: ['id', 'userId', 'fullName'] }]
      });
      recordType = 'PERSON_RECORD';
    } else if (notification.lenderRecordId) {
      record = await LenderRecord.findByPk(notification.lenderRecordId, {
        include: [{ model: User, as: 'owner', attributes: ['id', 'userId', 'fullName'] }]
      });
      recordType = 'LENDER_RECORD';
    }

    if (!record) {
      return sendResponse(res, 404, "ERROR", "Associated record not found");
    }

    const sender = await User.findByPk(notification.senderId, {
      attributes: ['id', 'userId', 'fullName', 'email']
    });

    const resolvedSender = sender ? {
      id: sender.id,
      name: sender.fullName,
      userId: sender.userId,
      email: sender.email
    } : (record.owner ? {
      id: record.owner.id,
      name: record.owner.fullName,
      userId: record.owner.userId
    } : null);

    const responseData = {
      ...record.toJSON(),
      recordType,
      notificationId: notification.id,
      title: notification.title,
      message: notification.message,
      senderId: notification.senderId,
      requestDate: notification.createdAt,
      sender: resolvedSender
    };

    return sendResponse(res, 200, "SUCCESS", "Record details fetched successfully", responseData);
  } catch (error) {
    console.error("Error fetching notification person details:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.notificationId;

    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return sendResponse(res, 404, "ERROR", "Notification not found");
    }

    if (notification.recipientId !== userId) {
      return sendResponse(res, 403, "ERROR", "You are not authorized to update this notification");
    }

    await notification.update({ isRead: true });

    return sendResponse(res, 200, "SUCCESS", "Notification marked as read");
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId;
    const notificationId = req.params.notificationId;

    const notification = await Notification.findByPk(notificationId);
    if (!notification) {
      return sendResponse(res, 404, "ERROR", "Notification not found");
    }

    if (notification.recipientId !== userId) {
      return sendResponse(res, 403, "ERROR", "You are not authorized to delete this notification");
    }

    await notification.destroy();

    return sendResponse(res, 200, "SUCCESS", "Notification deleted successfully");
  } catch (error) {
    console.error("Error deleting notification:", error);
    return sendResponse(res, 500, "ERROR", "Internal server error");
  }
};
