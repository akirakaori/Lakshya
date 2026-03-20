import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout, EmptyState, LoadingSpinner, PageSizeSelect, PaginationControls } from '../components';
import { useAuth } from '../context/auth-context';
import {
  useMarkAllNotificationsAsRead,
  useMarkNotificationAsRead,
  useNotifications,
  useUnreadNotificationCount,
} from '../hooks/use-notifications';
import type { NotificationItem, NotificationType } from '../services/notification-service';

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

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const page = useMemo(() => {
    const p = Number(searchParams.get('page'));
    return Number.isFinite(p) && p > 0 ? Math.floor(p) : 1;
  }, [searchParams]);

  const limit = useMemo(() => {
    const l = Number(searchParams.get('limit'));
    return Number.isFinite(l) && l > 0 ? Math.floor(l) : 10;
  }, [searchParams]);

  const { data: notificationsResponse, isLoading, isFetching } = useNotifications(page, limit);
  const { data: unreadCountResponse } = useUnreadNotificationCount();
  const markOneAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();

  const notifications = notificationsResponse?.data || [];
  const pagination = notificationsResponse?.pagination;
  const unreadCount = unreadCountResponse?.data?.unreadCount || 0;

  const updateParams = (nextPage: number, nextLimit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(nextPage));
    params.set('limit', String(nextLimit));
    setSearchParams(params, { replace: true });
  };

  const role = user?.role;
  const layoutVariant = role === 'recruiter' ? 'recruiter' : 'job-seeker';

  return (
    <DashboardLayout variant={layoutVariant} title="Notifications">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Notifications</h1>
            <p className="text-sm text-gray-600 mt-1">Stay updated on your application and hiring activity.</p>
          </div>
          <div className="flex items-center gap-3">
            <PageSizeSelect
              value={limit}
              onChange={(nextLimit) => updateParams(1, nextLimit)}
              options={[5, 10, 20]}
              disabled={isLoading}
            />
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="New updates will appear here when actions happen in your applications and jobs."
          />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <ul>
              {notifications.map((notification) => {
                const targetPath = getNotificationTargetPath(notification, role);

                return (
                  <li
                    key={notification._id}
                    className={`border-b border-gray-100 last:border-b-0 ${notification.isRead ? 'bg-white' : 'bg-indigo-50/40'}`}
                  >
                    <div className="p-4 sm:p-5 flex items-start gap-4">
                      <div className="mt-1">{getNotificationIcon(notification.type)}</div>

                      <button
                        onClick={async () => {
                          if (!notification.isRead) {
                            await markOneAsRead.mutateAsync(notification._id);
                          }
                          navigate(targetPath);
                        }}
                        className="flex-1 text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm sm:text-base font-semibold text-gray-900">{notification.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-2">{formatRelativeTime(notification.createdAt)}</p>
                          </div>
                          {!notification.isRead && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                              New
                            </span>
                          )}
                        </div>
                      </button>

                      {!notification.isRead && (
                        <button
                          onClick={() => markOneAsRead.mutate(notification._id)}
                          className="text-xs text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {pagination && (
              <PaginationControls
                pagination={pagination}
                onPageChange={(nextPage) => {
                  updateParams(nextPage, limit);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isLoading={isLoading}
                isFetching={isFetching}
              />
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;