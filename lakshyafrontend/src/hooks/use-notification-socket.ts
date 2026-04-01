import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth-context';
import { notificationKeys } from './use-notifications';
import { applicationKeys } from './use-applications';
import { socketService } from '../services/socket-service';
import type { NotificationItem } from '../services/notification-service';

const invalidateNotificationQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
  ]);
};

const applicationRelatedNotificationTypes = new Set<NotificationItem['type']>([
  'application_submitted',
  'shortlisted',
  'interview_scheduled',
  'rejected',
  'hired',
  'application_withdrawn',
  'application_withdraw',
]);

const invalidateApplicationQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await queryClient.invalidateQueries({ queryKey: applicationKeys.all });
};

export const useNotificationSocket = () => {
  const queryClient = useQueryClient();
  const { isReady, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isReady) return;

    const userId = user?._id;
    const token = localStorage.getItem('token');

    if (!isAuthenticated || !userId || !token) {
      socketService.disconnect();
      return;
    }

    const socket = socketService.connect(token, userId);

    const handleNotificationEvent = () => {
      void invalidateNotificationQueries(queryClient);
    };

    const handleNewNotificationEvent = (payload?: { notification?: NotificationItem }) => {
      void invalidateNotificationQueries(queryClient);

      if (payload?.notification?.type && applicationRelatedNotificationTypes.has(payload.notification.type)) {
        void invalidateApplicationQueries(queryClient);
      }
    };

    socket.on('notification:new', handleNewNotificationEvent);
    socket.on('notification:count-updated', handleNotificationEvent);
    socket.on('notification:read', handleNotificationEvent);
    socket.on('notification:read-all', handleNotificationEvent);

    return () => {
      socket.off('notification:new', handleNewNotificationEvent);
      socket.off('notification:count-updated', handleNotificationEvent);
      socket.off('notification:read', handleNotificationEvent);
      socket.off('notification:read-all', handleNotificationEvent);
    };
  }, [isReady, isAuthenticated, user?._id, queryClient]);
};