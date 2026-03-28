const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'application_submitted',
        'shortlisted',
        'hired',
        'interview_scheduled',
        'rejected',
        'new_applicant',
        'application_withdrawn',
        'application_withdraw',
      ],
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Notification title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Notification message cannot exceed 500 characters'],
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    relatedJobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    relatedApplicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

const NotificationModel = mongoose.model('Notification', notificationSchema);

module.exports = NotificationModel;