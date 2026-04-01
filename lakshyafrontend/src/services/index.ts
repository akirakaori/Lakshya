export { default as axiosInstance } from './axios-instance';
export { authService } from './auth-service';
export { jobService } from './job-service';
export { applicationService } from './application-service';
export { profileService } from './profile-service';
export { getLandingData } from './landing-service';
export { notificationService } from './notification-service';

export type { LoginCredentials, RegisterData, AuthResponse } from './auth-service';
export type {
  Job,
  JobFilters,
  JobsResponse,
  CreateJobData,
  JobMatchAnalysis,
  JobMatchScore,
  BatchMatchScoresResponse,
  RecommendedJob,
  SavedJobsFilters,
  SavedJobsResponse
} from './job-service';
export type { 
  Application, 
  ApplyJobData, 
  ApplicationFilters, 
  ApplicationsResponse,
  RecruiterApplicationFilters,
  RecruiterApplicationsResponse,
  RecruiterApplication,
  RecruiterRecentActivityType,
  RecruiterRecentActivityItem,
  RecruiterRecentActivityResponse,
  Interview,
  ScheduleInterviewData
} from './application-service';
export type { UserProfile, UpdateProfileData } from './profile-service';
export type { LandingStats, LandingJob, LandingData, LandingResponse } from './landing-service';
export type {
  NotificationType,
  NotificationItem,
  NotificationPagination,
  NotificationsResponse,
  UnreadCountResponse,
  MarkNotificationResponse,
  MarkAllNotificationsResponse,
} from './notification-service';
