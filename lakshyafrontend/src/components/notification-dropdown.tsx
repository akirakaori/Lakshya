import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from '../hooks/use-notifications';
import type { NotificationItem, NotificationType } from '../services/notification-service';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatRelativeTime = (dateString: string) => {
  const timestamp = new Date(dateString).getTime();
  if (Number.isNaN(timestamp)) return 'Just now';

  const diffMs = Date.now() - timestamp;
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'Just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hr ago`;
  return `${Math.floor(diffMs / day)} day ago`;
};

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'application_submitted':
      return (
        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case 'shortlisted':
      return (
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.96a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.447a1 1 0 00-.364 1.118l1.286 3.96c.3.921-.755 1.688-1.54 1.118l-3.367-2.447a1 1 0 00-1.176 0l-3.367 2.447c-.784.57-1.838-.197-1.539-1.118l1.285-3.96a1 1 0 00-.364-1.118L2.98 9.387c-.783-.57-.38-1.81.588-1.81H7.73a1 1 0 00.95-.69l1.286-3.96z" />
        </svg>
      );
    case 'interview_scheduled':
      return (
        <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'rejected':
      return (
        <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    case 'new_applicant':
      return (
        <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v6m3-3h-6m-2 5a4 4 0 11-8 0 4 4 0 018 0zm6 0a8 8 0 10-16 0" />
        </svg>
      );
    case 'application_withdrawn':
      return (
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
      );
    default:
      return null;
  }
};

const getNotificationTargetPath = (notification: NotificationItem, role?: string) => {
  if (role === 'recruiter') {
    if (notification.relatedJobId) {
      return `/recruiter/jobs/${notification.relatedJobId}/applications`;
    }
    return '/recruiter/manage-jobs';
  }

  if (notification.relatedApplicationId) {
    return '/job-seeker/my-applications';
  }

  if (notification.relatedJobId) {
    return `/job-seeker/jobs/${notification.relatedJobId}`;
  }

  return '/job-seeker/dashboard';
};

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: notificationsResponse, isLoading } = useNotifications(1, 5);
  const { data: unreadCountResponse } = useUnreadNotificationCount();
  const markOneAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = notificationsResponse?.data || [];
  const unreadCount = unreadCountResponse?.data?.unreadCount || 0;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="absolute right-0 mt-3 w-[360px] max-w-[90vw] bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-60"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-sm text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">No notifications yet</div>
        ) : (
          notifications.map((notification) => {
            const targetPath = getNotificationTargetPath(notification, user?.role);

            return (
              <button
                key={notification._id}
                onClick={async () => {
                  if (!notification.isRead) {
                    await markOneAsRead.mutateAsync(notification._id);
                  }
                  onClose();
                  navigate(targetPath);
                }}
                className={`w-full text-left p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${
                  notification.isRead ? 'bg-white' : 'bg-indigo-50/40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                      {!notification.isRead && <span className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notification.createdAt)}</p>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
        <Link
          to="/notifications"
          onClick={onClose}
          className="block text-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
};

export default NotificationDropdown;