import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth-context';
import { notificationKeys } from './use-notifications';
import { socketService } from '../services/socket-service';

const invalidateNotificationQueries = async (queryClient: ReturnType<typeof useQueryClient>) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['notifications'] }),
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount }),
  ]);
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

    socket.on('notification:new', handleNotificationEvent);
    socket.on('notification:count-updated', handleNotificationEvent);
    socket.on('notification:read', handleNotificationEvent);
    socket.on('notification:read-all', handleNotificationEvent);

    return () => {
      socket.off('notification:new', handleNotificationEvent);
      socket.off('notification:count-updated', handleNotificationEvent);
      socket.off('notification:read', handleNotificationEvent);
      socket.off('notification:read-all', handleNotificationEvent);
    };
  }, [isReady, isAuthenticated, user?._id, queryClient]);
};