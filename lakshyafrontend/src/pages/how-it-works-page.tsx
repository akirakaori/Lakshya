import React from 'react';
import { Link } from 'react-router-dom';
import lakshyaLogo from '../assets/lakhsya-logo.svg';
import Footer from '../components/layout/footer';

const steps = [
  {
    step: '01',
    title: 'Create Your Account',
    description:
      'Sign up as a job seeker and set up your profile to start exploring opportunities tailored to your career goals.',
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
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
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
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
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
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
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
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
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
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
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.9}
          d="M15 10l4.553-2.276A1 1 0 0020 6.382V4a1 1 0 00-1.447-.894L14 5.382m1 4.618v10m0-10l-6-3m6 3l6-3M9 7l-6 3m6-3v10m0-10l6-3m-6 13l-6-3m0 0V8m0 6l6 3m6-3l6 3"
        />
      </svg>
    ),
  },
];

const highlights = [
  {
    title: 'Precision Guidance',
    description:
      'Lakshya gives users clear, profile-aware recommendations that connect ambition with relevant opportunities.',
  },
  {
    title: 'Adaptive Tracking',
    description:
      'The platform evolves with users, from resume analysis and application support to visibility across the hiring process.',
  },
  {
    title: 'Privacy First',
    description:
      'Your data stays protected while allowing intelligent experiences built around transparency and user trust.',
  },
];

export const HowItWorksPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={lakshyaLogo} alt="Lakshya Logo" className="h-7 w-auto" />
            <span className="text-sm font-semibold text-slate-900">Lakshya</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/platform" className="text-sm text-slate-500 transition hover:text-slate-900">
              Platform
            </Link>
            <Link to="/solutions" className="text-sm text-slate-500 transition hover:text-slate-900">
              Solutions
            </Link>
            <Link to="/how-it-works" className="text-sm font-medium text-[#4f5bd5]">
              How It Works
            </Link>
            <Link to="/resources" className="text-sm text-slate-500 transition hover:text-slate-900">
              Resources
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden text-sm text-slate-500 transition hover:text-slate-900 sm:inline-flex">
              Login
            </Link>
            <Link
              to="/signup-choice"
              className="inline-flex items-center rounded-md bg-[#4f5bd5] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4450c4]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 md:px-8 md:pb-20 md:pt-16">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="max-w-2xl">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f78d8]">
                How It Works
              </p>

              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Navigate your career path with precision
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-600 md:text-[15px]">
                Lakshya uses advanced cognitive modeling to help you pursue professional goals
                aligned with your background, interests, and market opportunities.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/browse-jobs"
                  className="inline-flex items-center rounded-md bg-[#4f5bd5] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#4450c4]"
                >
                  Start Your Alignment
                </Link>
                <Link
                  to="/signup-choice"
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  View Career Modules
                </Link>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-200 bg-white">
              <div className="relative h-[320px] w-full bg-slate-950">
                <img
                  src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80"
                  alt="AI career intelligence visualization"
                  className="h-full w-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(84,120,255,0.35),transparent_45%)]" />
                <div className="absolute inset-0 bg-gradient-to-br from-[#0b1630]/20 via-transparent to-[#122c5f]/40" />
              </div>
            </div>
          </div>
        </section>

        {/* Framework / steps */}
        <section className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-20">
            <div className="mb-10">
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                The Cognitive Framework
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                A clear action model for users exploring roles, improving resume quality, and using
                AI-supported career intelligence in a structured way.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {steps.map((item) => (
                <div
                  key={item.step}
                  className="border border-slate-200 bg-white p-5 transition hover:border-slate-300"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#eef1ff] text-[#4f5bd5]">
                      {item.icon}
                    </div>
                    <span className="text-xs font-semibold tracking-[0.14em] text-slate-400">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="border-t border-slate-200 bg-[#f6f7fb]">
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-16">
            <div className="grid gap-8 md:grid-cols-3">
              {highlights.map((item) => (
                <div key={item.title}>
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16 md:px-8 md:py-20">
          <div className="mx-auto max-w-4xl border border-slate-200 bg-white px-6 py-12 text-center md:px-10">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Ready to transform your career?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-600">
              Join thousands of professionals using career intelligence to build more focused
              journeys and discover stronger opportunities.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to="/browse-jobs"
                className="inline-flex items-center rounded-md bg-[#4f5bd5] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#4450c4]"
              >
                Get Started Now
              </Link>
              <Link
                to="/signup-choice"
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Talk to an Advisor
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer variant="public" />
    </div>
  );
};

export default HowItWorksPage;