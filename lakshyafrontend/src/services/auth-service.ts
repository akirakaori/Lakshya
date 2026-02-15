import axiosInstance from './axios-instance';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  number: string;
  role: 'job_seeker' | 'recruiter';
  companyName?: string;
  location?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  jwtToken?: string;
  email?: string;
  name?: string;
  role?: string;
}

export const authService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  // Register new user
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await axiosInstance.post('/auth/register', data);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (email: string) => {
    const response = await axiosInstance.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Reset password
  resetPassword: async (data: { email: string; otp: string; newPassword: string }) => {
    const response = await axiosInstance.post('/auth/reset-password', data);
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if authenticated
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Save auth data to localStorage
  saveAuthData: (token: string, user: { email: string; name: string; role: string }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
};

export default authService;
