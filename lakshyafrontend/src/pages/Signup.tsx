import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { handleError, handleSuccess } from '../Utils';
import { authApi } from '../api/api-client';
import { Footer } from '../components';
import { AlertModal } from '../components/ui';
import ThemeToggle from '../components/ui/theme-toggle';

type SignupFormData = {
  name: string;
  email: string;
  number: string;
  password: string;
  companyName?: string;
  location?: string;
};

function Signup() {
  const { role } = useParams();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    variant: 'error' as 'error' | 'warning' | 'success' | 'info',
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    defaultValues: {
      name: '',
      email: '',
      number: '',
      password: '',
      companyName: '',
      location: '',
    },
  });

  const signupMutation = useMutation({
    mutationFn: authApi.signup,
    onSuccess: (result: any) => {
      const { success, message, error } = result;
      if (success) {
        handleSuccess(message);
        setTimeout(() => {
          navigate('/login');
        }, 1000);
      } else if (error) {
        if (error.toLowerCase().includes('phone') || error.toLowerCase().includes('already registered')) {
          setAlertModal({
            isOpen: true,
            title: 'Phone Number Already Registered',
            message: error,
            variant: 'error',
          });
        } else {
          handleError(error);
        }
      } else if (!success) {
        handleError(message);
      }
    },
    onError: (error: any) => {
      handleError(error.message || 'Signup failed');
    },
  });

  if (!role) {
    return null;
  }

  if (role !== 'recruiter' && role !== 'jobseeker') {
    return <h2 className="app-heading p-8 text-center text-xl font-semibold">Invalid signup type</h2>;
  }

  const onSubmit = (data: SignupFormData) => {
    const signupData: any = {
      name: data.name,
      email: data.email,
      number: data.number,
      password: data.password,
      role: role === 'recruiter' ? 'recruiter' : 'job_seeker',
    };

    if (role === 'recruiter') {
      signupData.companyName = data.companyName;
      signupData.location = data.location;
    }

    signupMutation.mutate(signupData);
  };

  return (
    <div className="app-auth-shell">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 pt-6">
        <Link to="/" className="inline-flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-lg shadow-indigo-500/20">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
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
              <div className="mb-2 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
                <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h2 className="app-heading text-2xl font-bold">Lakshya</h2>
              <Link to="/" className="app-auth-link inline-block text-sm">
                Back to Home
              </Link>
            </div>

            <div className="text-center">
              <h1 className="app-heading text-3xl font-bold">
                {role === 'recruiter' ? 'Recruiter Sign Up' : 'Job Seeker Sign Up'}
              </h1>
              <p className="app-body-text mt-2 text-sm">
                {role === 'recruiter'
                  ? 'Create your hiring workspace with a dark-safe, readable flow.'
                  : 'Create your account and start matching with better-fit roles.'}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="app-label block text-sm font-medium">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  autoFocus
                  {...register('name', {
                    required: 'Full name is required',
                    minLength: {
                      value: 2,
                      message: 'Name must be at least 2 characters',
                    },
                  })}
                  className={`app-auth-input ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
              </div>

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
                <label htmlFor="number" className="app-label block text-sm font-medium">
                  Phone Number
                </label>
                <input
                  id="number"
                  type="tel"
                  placeholder="9876543210"
                  {...register('number', {
                    required: 'Phone number is required',
                    pattern: {
                      value: /^[0-9]{10}$/,
                      message: 'Phone number must be exactly 10 digits',
                    },
                  })}
                  className={`app-auth-input ${errors.number ? 'border-red-500 focus:ring-red-500' : ''}`}
                />
                {errors.number && <p className="text-sm text-red-600">{errors.number.message}</p>}
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
                        value: 8,
                        message: 'Password must be at least 8 characters',
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

              {role === 'recruiter' && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="app-label block text-sm font-medium">
                      Company Name
                    </label>
                    <input
                      id="companyName"
                      type="text"
                      placeholder="Acme Corp"
                      {...register('companyName', {
                        required: role === 'recruiter' ? 'Company name is required for recruiters' : false,
                      })}
                      className={`app-auth-input ${errors.companyName ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.companyName && <p className="text-sm text-red-600">{errors.companyName.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="location" className="app-label block text-sm font-medium">
                      Location
                    </label>
                    <input
                      id="location"
                      type="text"
                      placeholder="Mumbai, India"
                      {...register('location', {
                        required: role === 'recruiter' ? 'Location is required for recruiters' : false,
                      })}
                      className={`app-auth-input ${errors.location ? 'border-red-500 focus:ring-red-500' : ''}`}
                    />
                    {errors.location && <p className="text-sm text-red-600">{errors.location.message}</p>}
                  </div>
                </>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={signupMutation.isPending}
                  className="w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3 font-medium text-white shadow-md transition-all duration-300 ease-in-out hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {signupMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <svg className="-ml-1 mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : 'Sign Up'}
                </button>
              </div>

              <div className="app-body-text pt-2 text-center text-sm">
                <span>Already have an account? </span>
                <Link to="/login" className="app-auth-link">
                  Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>

      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        variant={alertModal.variant}
        closeText="OK"
      />
      <Footer variant="public" />
    </div>
  );
}

export default Signup;
