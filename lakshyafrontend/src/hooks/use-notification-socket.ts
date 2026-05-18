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

const invalidateRealtimeApplicationQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  payload?: { applicationId?: string; jobId?: string }
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['applications'] }),
    queryClient.invalidateQueries({ queryKey: ['recruiter-job-applications'] }),
  ]);

  if (payload?.applicationId) {
    await queryClient.invalidateQueries({ queryKey: ['recruiterApplication', payload.applicationId] });
    await queryClient.invalidateQueries({ queryKey: ['applications', 'detail', payload.applicationId] });
  }

  if (payload?.jobId) {
    await queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', payload.jobId] });
    await queryClient.invalidateQueries({ queryKey: ['jobs', 'my-jobs'] });
  }
};

const invalidateRecruiterProfileQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  payload?: { recruiterId?: string }
) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['jobs'] }),
    queryClient.invalidateQueries({ queryKey: ['applications'] }),
  ]);

  if (payload?.recruiterId) {
    await queryClient.invalidateQueries({ queryKey: ['profile', 'candidate', payload.recruiterId] });
  }
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

    const handleInterviewUpdated = (payload?: { applicationId?: string; jobId?: string }) => {
      void invalidateRealtimeApplicationQueries(queryClient, payload);
    };

    const handleApplicationStatusUpdated = (payload?: { applicationId?: string; jobId?: string }) => {
      void invalidateRealtimeApplicationQueries(queryClient, payload);
    };

    const handleRecruiterProfileUpdated = (payload?: { recruiterId?: string }) => {
      void invalidateRecruiterProfileQueries(queryClient, payload);
    };

    const handleJobUpdated = (payload?: { jobId?: string }) => {
      void queryClient.invalidateQueries({ queryKey: ['jobs'] });
      if (payload?.jobId) {
        void queryClient.invalidateQueries({ queryKey: ['jobs', 'detail', payload.jobId] });
      }
    };

    socket.on('notification:new', handleNewNotificationEvent);
    socket.on('notification:count-updated', handleNotificationEvent);
    socket.on('notification:read', handleNotificationEvent);
    socket.on('notification:read-all', handleNotificationEvent);
    socket.on('interview:updated', handleInterviewUpdated);
    socket.on('application:statusUpdated', handleApplicationStatusUpdated);
    socket.on('recruiter:profileUpdated', handleRecruiterProfileUpdated);
    socket.on('job:updated', handleJobUpdated);

    return () => {
      socket.off('notification:new', handleNewNotificationEvent);
      socket.off('notification:count-updated', handleNotificationEvent);
      socket.off('notification:read', handleNotificationEvent);
      socket.off('notification:read-all', handleNotificationEvent);
      socket.off('interview:updated', handleInterviewUpdated);
      socket.off('application:statusUpdated', handleApplicationStatusUpdated);
      socket.off('recruiter:profileUpdated', handleRecruiterProfileUpdated);
      socket.off('job:updated', handleJobUpdated);
    };
  }, [isReady, isAuthenticated, user?._id, queryClient]);
};
