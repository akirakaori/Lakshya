const API_BASE_URL = 'http://localhost:3000/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options?.headers,
    },
  };

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'API request failed');
  }

  return data;
}

// Auth API functions
export const authApi = {
  login: (credentials: { email: string; password: string }) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  signup: (userData: {
    name: string;
    email: string;
    number: string;
    password: string;
    role: string;
    companyName?: string;
    location?: string;
  }) =>
    apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  forgotPassword: (email: string): Promise<{ success: boolean; message?: string }> =>
    apiRequest<{ success: boolean; message?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (data: { email: string; otp: string; newPassword: string }) =>
    apiRequest('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// Admin API functions
export const adminApi = {
  getAnalytics: (): Promise<{ 
    success: boolean; 
    data: {
      totals: {
        totalUsers: number;
        totalRecruiters: number;
        totalJobSeekers: number;
        totalJobs: number;
        openJobs: number;
        closedJobs: number;
        totalApplications: number;
        applicationsToday: number;
        userChange: string;
        jobSeekerChange: string;
        recruiterChange: string;
        jobChange: string;
      };
      trend14d: Array<{ date: string; count: number }>;
      topJobs: Array<{ jobId: string; title: string; companyName: string; count: number }>;
      topSkills: Array<{ skill: string; count: number }>;
      recruiterActivity: Array<{
        recruiterId: string;
        recruiterName: string;
        recruiterEmail: string;
        jobsPosted: number;
        applicationsReceived: number;
        status: string;
      }>;
    };
  }> => apiRequest('/admin/analytics', { method: 'GET' }),

  getUsers: (params?: { 
    search?: string; 
    role?: string; 
    isActive?: string | boolean; 
    page?: number; 
    limit?: number;
  }): Promise<{ 
    success: boolean; 
    users: any[]; 
    pagination?: { page: number; limit: number; total: number; pages: number };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin/users${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },

  getPosts: (params?: {
    search?: string;
    status?: string;
    isActive?: string | boolean;
    jobType?: string;
    company?: string;
    location?: string;
    page?: number;
    limit?: number;
  }): Promise<{ 
    success: boolean; 
    posts: any[]; 
    total?: number;
    pagination?: { page: number; limit: number; total: number; pages: number; totalPages?: number };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.jobType) queryParams.append('jobType', params.jobType);
    if (params?.company) queryParams.append('company', params.company);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    
    const queryString = queryParams.toString();
    return apiRequest(`/admin/posts${queryString ? `?${queryString}` : ''}`, { method: 'GET' });
  },

  updateUser: (userId: string, userData: { role?: string; isActive?: boolean; password?: string }): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    }),

  updatePost: (
    postId: string,
    postData: {
      title?: string;
      description?: string;
      company?: string;
      location?: string;
      salary?: string;
      jobType?: string;
    }
  ): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/admin/posts/${postId}`, {
      method: 'PATCH',
      body: JSON.stringify(postData),
    }),

  softDeleteUser: (userId: string, reason: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/admin/users/${userId}/soft-delete`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  restoreUser: (userId: string, reason?: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/admin/users/${userId}/restore`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  // Backward-compatible alias
  deleteUser: (userId: string, reason: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/admin/users/${userId}/soft-delete`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  deletePost: (postId: string, reason: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/admin/posts/${postId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),

  // Soft delete job (new method using job routes)
  deleteJob: (jobId: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/admin/jobs/${jobId}/soft-delete`, {
      method: 'PATCH',
    }),
};
