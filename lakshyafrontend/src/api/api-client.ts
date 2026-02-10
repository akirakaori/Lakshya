const API_BASE_URL = 'http://localhost:3000';

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

  if (!response.ok && !data.success) {
    throw new Error(data.message || 'API request failed');
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
    apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),

  forgotPassword: (email: string) =>
    apiRequest('/auth/forgot-password', {
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
  getUsers: (): Promise<{ success: boolean; users: any[] }> => 
    apiRequest('/admin/users', { method: 'GET' }),

  getPosts: (): Promise<{ success: boolean; posts: any[] }> => 
    apiRequest('/admin/posts', { method: 'GET' }),

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

  deleteUser: (userId: string, reason: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/admin/users/${userId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),

  deletePost: (postId: string, reason: string): Promise<{ success: boolean; message: string }> =>
    apiRequest(`/admin/posts/${postId}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason }),
    }),
};
