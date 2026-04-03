import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { handleError, handleSuccess } from '../Utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/api-client';
import { toast } from 'react-toastify';
import { useAuth } from '../context/auth-context';
import { Footer } from '../components';
import ThemeToggle from '../components/ui/theme-toggle';
import { useForm } from 'react-hook-form';
import lakshyaLogo from '../assets/lakhsya-logo.svg';

type LoginFormData = {
  email: string;
  password: string;
};

interface LoginResponse {
  success: boolean;
  message: string;
  jwtToken?: string;
  name?: string;
  email?: string;
  role?: 'job_seeker' | 'recruiter' | 'admin';
  _id?: string;
  error?: {
    details: Array<{ message: string }>;
  };
}

interface LoginError {
  message?: string;
}

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login: authLogin } = useAuth();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation<LoginResponse, LoginError, LoginFormData>({
    mutationFn: (data) => authApi.login(data) as Promise<LoginResponse>,
    onSuccess: async (result) => {
      const { success, message, jwtToken, name, email, role, _id, error } = result;
      if (success && jwtToken && name && email && role && _id) {
        await queryClient.cancelQueries();
        queryClient.clear();

        handleSuccess(message);
        authLogin(jwtToken, { _id, email, name, role });

        localStorage.setItem('loggedInUser', name);
        localStorage.setItem('role', role);

        setTimeout(() => {
          toast.dismiss();
          const redirect = searchParams.get('redirect');
          if (redirect) {
            navigate(decodeURIComponent(redirect), { replace: true });
            return;
          }

          if (role === 'admin') {
            navigate('/AdminDashboard', { replace: true });
          } else if (role === 'recruiter') {
            navigate('/recruiter/dashboard', { replace: true });
          } else {
            navigate('/job-seeker/dashboard', { replace: true });
          }
        }, 1500);
      } else if (error) {
        handleError(error?.details[0].message);
      } else if (!success) {
        handleError(message);
      }
    },
    onError: (error: LoginError) => {
      handleError(error.message || 'Login failed');
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="app-auth-shell overflow-hidden">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-6">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-indigo-500/20">
            <img src={lakshyaLogo} alt="Lakshya Logo" className="h-8 w-auto" />
          </div>
          <div>
            <p className="app-heading text-lg font-semibold">Lakshya</p>
            <p className="app-soft-text text-xs">Career intelligence platform</p>
          </div>
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="app-auth-card space-y-6">
            <div className="space-y-2 text-center">
              <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-indigo-500/20">
                <img src={lakshyaLogo} alt="Lakshya Logo" className="h-9 w-auto" />
              </div>
              <h2 className="app-heading text-2xl font-bold">Lakshya</h2>
              <Link to="/" className="app-auth-link inline-block text-sm">
                Back to Home
              </Link>
            </div>

            <div className="text-center">
              <h1 className="app-heading text-3xl font-bold">Welcome Back</h1>
              <p className="app-body-text mt-2 text-sm">Sign in to continue to your dashboard.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="app-label block text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  {...register('email', {
                    required: 'Email is required',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Please enter a valid email address',
                    },
                  })}
                  className={`app-auth-input ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="app-label block text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: {
                        value: 6,
                        message: 'Password must be at least 6 characters',
                      },
                    })}
                    className={`app-auth-input pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 hover:text-slate-600 focus:outline-none dark:text-slate-500 dark:hover:text-slate-200"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password.message}</p>}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Logging in...
                    </span>
                  ) : 'Login'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 text-sm">
                <Link to="/forgot-password" className="app-auth-link">
                  Forgot Password?
                </Link>
                <div className="app-body-text">
                  <span>Don't have an account? </span>
                  <Link to="/signup-choice" className="app-auth-link">
                    Sign Up
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Footer variant="public" />
    </div>
  );
}

export default Login;
