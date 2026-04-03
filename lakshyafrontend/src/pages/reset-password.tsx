import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/api-client';
import { Footer } from '../components';
import ThemeToggle from '../components/ui/theme-toggle';
import { useForm } from 'react-hook-form';
import lakshyaLogo from '../assets/lakhsya-logo.svg';

type ResetPasswordFormData = {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
};

function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const emailFromState = location.state?.email || '';

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      email: emailFromState,
      otp: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const newPassword = watch('newPassword');

  const resetPasswordMutation = useMutation({
    mutationFn: authApi.resetPassword,
    onSuccess: (data: any) => {
      if (data.success) {
        setIsSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError('email', {
          type: 'manual',
          message: data.message || 'Failed to reset password',
        });
      }
    },
    onError: () => {
      setError('email', {
        type: 'manual',
        message: 'Something went wrong. Please try again.',
      });
    },
  });

  const onSubmit = (data: ResetPasswordFormData) => {
    resetPasswordMutation.mutate({
      email: data.email,
      otp: data.otp,
      newPassword: data.newPassword,
    });
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
              <h1 className="app-heading text-3xl font-bold">Reset Password</h1>
              <p className="app-body-text mt-2 text-sm">Create a new password for your account.</p>
            </div>

            {isSuccess ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-100">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 text-green-500 dark:text-green-300">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1 text-sm">
                      <p className="font-medium">Password reset successfully.</p>
                      <p className="mt-1 text-green-700 dark:text-green-200">Redirecting you to login...</p>
                    </div>
                  </div>
                </div>
                <Link
                  to="/login"
                  className="block w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 text-center font-medium text-white shadow-md transition-all duration-300 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg"
                >
                  Go to login
                </Link>
              </div>
            ) : (
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
                  <label htmlFor="otp" className="app-label block text-sm font-medium">
                    OTP
                  </label>
                  <input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP from email"
                    {...register('otp', { required: 'OTP is required' })}
                    className={`app-auth-input ${errors.otp ? 'border-red-500 focus:ring-red-500' : ''}`}
                  />
                  {errors.otp && <p className="text-sm text-red-600">{errors.otp.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="newPassword" className="app-label block text-sm font-medium">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('newPassword', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters',
                        },
                      })}
                      className={`app-auth-input pr-10 ${errors.newPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 hover:text-slate-600 focus:outline-none dark:text-slate-500 dark:hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showNewPassword ? (
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
                  {!errors.newPassword && <p className="app-soft-text text-xs">Password must be at least 8 characters</p>}
                  {errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword.message}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="app-label block text-sm font-medium">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...register('confirmPassword', {
                        required: 'Please confirm your password',
                        validate: (value) => value === newPassword || 'Passwords do not match',
                      })}
                      className={`app-auth-input pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 hover:text-slate-600 focus:outline-none dark:text-slate-500 dark:hover:text-slate-200"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? (
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
                  {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={resetPasswordMutation.isPending}
                    className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {resetPasswordMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting...
                      </span>
                    ) : 'Reset password'}
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <Link to="/login" className="app-auth-link text-sm">
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer variant="public" />
    </div>
  );
}

export default ResetPassword;
