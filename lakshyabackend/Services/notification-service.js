const NotificationModel = require('../models/notification-model');

const createNotification = async ({
  recipientId,
  type,
  title,
  message,
  relatedJobId = null,
  relatedApplicationId = null,
}) => {
  try {
    const notification = await NotificationModel.create({
      recipientId,
      type,
      title,
      message,
      relatedJobId,
      relatedApplicationId,
    });

    return {
      success: true,
      message: 'Notification created successfully',
      data: notification,
    };
  } catch (error) {
    throw error;
  }
};

const getNotificationsForUser = async (userId, query = {}) => {
  try {
    const pageNum = Number(query.page);
    const limitNum = Number(query.limit);

    const page = Number.isFinite(pageNum) && pageNum > 0 ? Math.floor(pageNum) : 1;
    const limit = Number.isFinite(limitNum) && limitNum > 0 ? Math.floor(limitNum) : 10;

    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      NotificationModel.find({ recipientId: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      NotificationModel.countDocuments({ recipientId: userId }),
    ]);

    const pages = total > 0 ? Math.ceil(total / limit) : 0;

    return {
      success: true,
      message: 'Notifications fetched successfully',
      data: notifications,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
    };
  } catch (error) {
    throw error;
  }
};

const getUnreadNotificationCount = async (userId) => {
  try {
    const unreadCount = await NotificationModel.countDocuments({
      recipientId: userId,
      isRead: false,
    });

    return {
      success: true,
      message: 'Unread notification count fetched successfully',
      data: {
        unreadCount,
      },
    };
  } catch (error) {
    throw error;
  }
};

const markNotificationAsRead = async (notificationId, userId) => {
  try {
    const notification = await NotificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        recipientId: userId,
      },
      {
        $set: { isRead: true },
      },
      {
        new: true,
      }
    );

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      success: true,
      message: 'Notification marked as read',
      data: notification,
    };
  } catch (error) {
    throw error;
  }
};

const markAllNotificationsAsRead = async (userId) => {
  try {
    const result = await NotificationModel.updateMany(
      {
        recipientId: userId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    return {
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount,
      },
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createNotification,
  getNotificationsForUser,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};