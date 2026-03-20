const express = require('express');
const router = express.Router();
const notificationController = require('../Controller/notification-controller');
const authorizeRoles = require('../Middleware/authorize-roles');
const { ROLES } = require('../Library/roles');

router.get(
  '/',
  authorizeRoles(ROLES.JOB_SEEKER, ROLES.RECRUITER, ROLES.ADMIN),
  notificationController.getNotifications
);

router.get(
  '/unread-count',
  authorizeRoles(ROLES.JOB_SEEKER, ROLES.RECRUITER, ROLES.ADMIN),
  notificationController.getUnreadCount
);

router.patch(
  '/read-all',
  authorizeRoles(ROLES.JOB_SEEKER, ROLES.RECRUITER, ROLES.ADMIN),
  notificationController.markAllNotificationsAsRead
);

router.patch(
  '/:id/read',
  authorizeRoles(ROLES.JOB_SEEKER, ROLES.RECRUITER, ROLES.ADMIN),
  notificationController.markNotificationAsRead
);

module.exports = router;