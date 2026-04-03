import React from 'react';
import { Link } from 'react-router-dom';
import lakshyaLogo from '../assets/lakhsya-logo.svg';

const steps = [
  {
    step: '01',
    title: 'Create Your Account',
    description:
      'Sign up as a job seeker and set up your profile to start exploring opportunities tailored to your career goals.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5.121 17.804A9 9 0 1118.88 17.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    step: '02',
    title: 'Upload Resume & Build Profile',
    description:
      'Upload your resume, add your skills, education, and experience so Lakshya can understand your strengths better.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4a2 2 0 012-2h6l4 4v10a2 2 0 01-2 2h-1M9 22h6a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    step: '03',
    title: 'AI Analyzes Your Profile',
    description:
      'Our platform evaluates your resume and profile data to help match you with relevant roles and better opportunities.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9.75 3a3 3 0 00-3 3v.75H6a2.25 2.25 0 000 4.5h.75v1.5H6a2.25 2.25 0 100 4.5h.75V18a3 3 0 003 3h4.5a3 3 0 003-3v-.75H18a2.25 2.25 0 100-4.5h-.75v-1.5H18a2.25 2.25 0 100-4.5h-.75V6a3 3 0 00-3-3h-4.5z"
        />
      </svg>
    ),
  },
  {
    step: '04',
    title: 'Browse & Apply for Jobs',
    description:
      'Explore active openings, review details, and apply to jobs that align with your background and interests.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m-3 2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2v-8a2 2 0 012-2z"
        />
      </svg>
    ),
  },
  {
    step: '05',
    title: 'Track Applications & Interviews',
    description:
      'Monitor your application progress, receive updates, and stay informed about interviews, shortlisting, and hiring decisions.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10m-11 9h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    step: '06',
    title: 'Move Toward Your Lakshya',
    description:
      'Use intelligent guidance, structured workflows, and opportunity tracking to move closer to your career goal.',
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 10l4.553-2.276A1 1 0 0020 6.382V4a1 1 0 00-1.447-.894L14 5.382m1 4.618v10m0-10l-6-3m6 3l6-3M9 7l-6 3m6-3v10m0-10l6-3m-6 13l-6-3m0 0V8m0 6l6 3m6-3l6 3"
        />
      </svg>
    ),
  },
];

const highlights = [
  {
    title: 'AI-Powered Guidance',
    description: 'Get smarter support through profile-based matching and career-focused insights.',
  },
  {
    title: 'Structured Application Flow',
    description: 'Track every application stage from applied to shortlisted, interview, and hired.',
  },
  {
    title: 'Career-Focused Experience',
    description: 'Lakshya is designed to help users move toward meaningful opportunities with clarity.',
  },
];

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-gray-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-sm">
              <img src={lakshyaLogo} alt="Lakshya Logo" className="h-7 w-auto" />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-slate-100">Lakshya</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">Career intelligence platform</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/about"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              About
            </Link>
            <Link
              to="/blog"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              Blog
            </Link>
            <Link
              to="/contact"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
            >
              Contact
            </Link>
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 px-4 py-20 text-white md:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-indigo-100">
            How It Works
          </p>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">
            How Lakshya Helps You Move Toward Your Career Goal
          </h1>
          <p className="mx-auto max-w-3xl text-base leading-8 text-indigo-50 md:text-lg">
            Lakshya combines AI-powered guidance, job discovery, application tracking, and structured
            hiring workflows to create a smarter and more career-focused experience.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/browse-jobs"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Browse Jobs
            </Link>
            <Link
              to="/signup-choice"
              className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Step-by-Step Journey</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-slate-400">
              A simple and structured process designed for job seekers who want a smarter way to search,
              apply, and grow.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {steps.map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300">
                    {item.icon}
                  </div>
                  <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">
                    {item.step}
                  </span>
                </div>

                <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-gray-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50 px-4 py-16 md:px-8 md:py-20 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Why This Process Works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-gray-600 dark:text-slate-400">
              Lakshya is more than a simple job portal. It is built to help users make informed and
              confident career decisions.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {highlights.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950"
              >
                <h3 className="mb-3 text-xl font-semibold text-gray-900 dark:text-slate-100">
                  {item.title}
                </h3>
                <p className="text-sm leading-7 text-gray-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-10 text-center text-white shadow-lg">
          <h2 className="text-3xl font-bold">Ready to Start Your Journey?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-indigo-100">
            Explore opportunities, build your profile, and use Lakshya to move closer to the career
            path you want.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              to="/browse-jobs"
              className="rounded-xl bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50"
            >
              Explore Jobs
            </Link>
            <Link
              to="/signup-choice"
              className="rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;