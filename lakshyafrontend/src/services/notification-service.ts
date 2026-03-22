import axiosInstance from './axios-instance';

export type NotificationType =
  | 'application_submitted'
  | 'shortlisted'
  | 'hired'
  | 'interview_scheduled'
  | 'rejected'
  | 'new_applicant'
  | 'application_withdrawn' | 'application_withdraw';

export interface NotificationItem {
  _id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  relatedJobId?: string | null;
  relatedApplicationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface NotificationsResponse {
  success: boolean;
  message: string;
  data: NotificationItem[];
  pagination: NotificationPagination;
}

export interface UnreadCountResponse {
  success: boolean;
  message: string;
  data: {
    unreadCount: number;
  };
}

export interface MarkNotificationResponse {
  success: boolean;
  message: string;
  data: NotificationItem;
}

export interface MarkAllNotificationsResponse {
  success: boolean;
  message: string;
  data: {
    modifiedCount: number;
  };
}

export const notificationService = {
  getNotifications: async (page = 1, limit = 10): Promise<NotificationsResponse> => {
    const response = await axiosInstance.get(`/notifications?page=${page}&limit=${limit}`);
    return response.data;
  },

  getUnreadNotificationCount: async (): Promise<UnreadCountResponse> => {
    const response = await axiosInstance.get('/notifications/unread-count');
    return response.data;
  },

  markNotificationAsRead: async (notificationId: string): Promise<MarkNotificationResponse> => {
    const response = await axiosInstance.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllNotificationsAsRead: async (): Promise<MarkAllNotificationsResponse> => {
    const response = await axiosInstance.patch('/notifications/read-all');
    return response.data;
  },
};
