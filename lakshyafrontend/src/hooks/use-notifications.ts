import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth-context';
import { notificationService } from '../services/notification-service';

export const notificationKeys = {
  notifications: (page: number, limit: number) => ['notifications', page, limit] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export const useNotifications = (page = 1, limit = 10) => {
  const { isAuthenticated, isReady, user } = useAuth();

  return useQuery({
    queryKey: notificationKeys.notifications(page, limit),
    queryFn: () => notificationService.getNotifications(page, limit),
    enabled: isReady && isAuthenticated && !!user,
  });
};

export const useUnreadNotificationCount = () => {
  const { isAuthenticated, isReady, user } = useAuth();

  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: () => notificationService.getUnreadNotificationCount(),
    enabled: isReady && isAuthenticated && !!user,
    refetchOnWindowFocus: true,
  });
};

export const useMarkNotificationAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) => notificationService.markNotificationAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
    },
  });
};