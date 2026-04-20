import { Link, useNavigate } from "react-router-dom";
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/api-client';
import { Footer } from '../components';
import ThemeToggle from '../components/ui/theme-toggle';
import { useForm } from 'react-hook-form';
import lakshyaLogo from '../assets/lakhsya-logo.svg';

type ForgotPasswordFormData = {
  email: string;
};

type ForgotPasswordResponse = {
  success: boolean;
  message?: string;
};

function ForgotPassword() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation<ForgotPasswordResponse, Error, string>({
    mutationFn: authApi.forgotPassword,
    onSuccess: (data, variables) => {
      if (data.success) {
        // Navigate to reset password page with email
        navigate("/reset-password", {
          state: { email: variables }
        });
      } else {
        setError('email', {
          type: 'manual',
          message: data.message || "Failed to send OTP"
        });
      }
    },
    onError: () => {
      setError('email', {
        type: 'manual',
        message: "Something went wrong. Please try again."
      });
    }
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data.email);
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
                <h1 className="app-heading text-3xl font-bold">Forgot Password</h1>
                <p className="app-body-text mt-2 text-sm">
                  Enter your email to receive an OTP for password reset.
                </p>
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
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={forgotPasswordMutation.isPending}
                    className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {forgotPasswordMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending OTP...
                      </span>
                    ) : 'Send OTP'}
                  </button>
                </div>

                <div className="pt-2 text-center">
                  <Link to="/login" className="app-auth-link text-sm">
                    Back to login
                  </Link>
                </div>
              </form>
            </div>
          </div>
      </div>
      <Footer variant="public" />
    </div>
  );
}

export default ForgotPassword;

