import { Link, useNavigate } from 'react-router-dom';
import { Footer } from '../components';
import ThemeToggle from '../components/ui/theme-toggle';

function SignupChoice() {
  const navigate = useNavigate();

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
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Lakshya</span>
            </div>

            <h1 className="app-heading mb-3 text-4xl font-bold">Join Lakshya Today</h1>
            <p className="app-body-text">Choose your role to get started.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="app-auth-card cursor-pointer border border-slate-200/80 p-8 transition-all duration-300 hover:scale-[1.02] hover:border-indigo-300 hover:shadow-2xl dark:border-slate-800 dark:hover:border-indigo-500/60">
              <div className="space-y-6 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 transition-colors duration-300 dark:bg-indigo-500/15">
                  <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="app-heading text-xl font-semibold">I am a Job Seeker</h2>
                <p className="app-body-text text-sm leading-relaxed">
                  Find your perfect job with AI matching and elevate your career.
                </p>
                <button
                  onClick={() => navigate('/signup/jobseeker')}
                  className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
            </div>

            <div className="app-auth-card cursor-pointer border border-slate-200/80 p-8 transition-all duration-300 hover:scale-[1.02] hover:border-indigo-300 hover:shadow-2xl dark:border-slate-800 dark:hover:border-indigo-500/60">
              <div className="space-y-6 text-center">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 transition-colors duration-300 dark:bg-indigo-500/15">
                  <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h2 className="app-heading text-xl font-semibold">I am an Employer</h2>
                <p className="app-body-text text-sm leading-relaxed">
                  Hire top talent efficiently with AI-powered ranking and candidate screening.
                </p>
                <button
                  onClick={() => navigate('/signup/recruiter')}
                  className="w-full rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98]"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer variant="public" />
    </div>
  );
}

export default SignupChoice;
