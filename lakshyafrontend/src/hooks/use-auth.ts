import { useMutation } from '@tanstack/react-query';
import { authService } from '../services';
import type { LoginCredentials, RegisterData } from '../services';
import { useNavigate } from 'react-router-dom';

// Login mutation
export const useLogin = () => {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      if (data.success && data.jwtToken) {
        authService.saveAuthData(data.jwtToken, {
          email: data.email!,
          name: data.name!,
          role: data.role!,
        });
        
        // Redirect based on role
        switch (data.role) {
          case 'job_seeker':
            navigate('/job-seeker/dashboard');
            break;
          case 'recruiter':
            navigate('/recruiter/dashboard');
            break;
          case 'admin':
            navigate('/admin/dashboard');
            break;
          default:
            navigate('/');
        }
      }
    },
  });
};

// Register mutation
export const useRegister = () => {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (data: RegisterData) => authService.register(data),
    onSuccess: () => {
      navigate('/login');
    },
  });
};

// Forgot password mutation
export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (email: string) => authService.forgotPassword(email),
  });
};

// Reset password mutation
export const useResetPassword = () => {
  const navigate = useNavigate();
  
  return useMutation({
    mutationFn: (data: { email: string; otp: string; newPassword: string }) =>
      authService.resetPassword(data),
    onSuccess: () => {
      navigate('/login');
    },
  });
};

// Logout hook
export const useLogout = () => {
  const navigate = useNavigate();
  
  const logout = () => {
    authService.logout();
    navigate('/login');
  };
  
  return logout;
};
