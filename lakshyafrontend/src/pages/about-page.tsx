import React from 'react';
import { Link } from 'react-router-dom';
import lakshyaLogo from '../assets/lakhsya-logo.svg';
import { useAuth } from '../context/auth-context';
import Footer from '../components/layout/footer';

const features = [
  {
    title: 'AI Resume Analysis',
    description:
      'Analyze resumes with structured insights that help improve readiness for better opportunities.',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M9.75 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V14.25M16.5 3h4.5m0 0v4.5m0-4.5L9.75 14.25"
        />
      </svg>
    ),
  },
  {
    title: 'Smart Job Discovery',
    description:
      'Find relevant roles through a more structured, focused, and user-friendly search experience.',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"
        />
      </svg>
    ),
  },
  {
    title: 'Application Tracking',
    description:
      'Keep applications organized and follow progress across every stage in one clear workflow.',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
    ),
  },
  {
    title: 'Hiring Workflow',
    description:
      'Support hiring teams with a cleaner and more consistent process for screening and selection.',
    icon: (
      <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

const AboutPage: React.FC = () => {
  console.debug('[Routing] AboutPage rendered');
  const { user } = useAuth();

  const dashboardPath =
    user?.role === 'admin'
      ? '/AdminDashboard'
      : user?.role === 'recruiter'
      ? '/recruiter/dashboard'
      : '/job-seeker/dashboard';

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-4">
          <Link to={user ? dashboardPath : '/'} className="flex items-center gap-2">
            <img src={lakshyaLogo} alt="Lakshya Logo" className="h-7 w-auto" />
            <div>
              <p className="text-sm font-semibold tracking-tight text-slate-900">Lakshya</p>
            </div>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pb-16 pt-16 md:pb-20 md:pt-20">
          <div className="max-w-3xl">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f78d8]">
              About Lakshya
            </p>

            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Building the Future of Career Intelligence
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
              Lakshya is more than a job board. It is a technical ecosystem designed to align
              ambition, skill, and opportunity through data-driven systems for job seekers,
              recruiters, and organizations.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center rounded-md bg-[#4f5bd5] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#4450c4]"
              >
                Get Started
              </Link>
              <Link
                to="/jobs"
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                View Opportunities
              </Link>
            </div>
          </div>
        </section>

        {/* Who we are + what Lakshya means */}
        <section className="mx-auto max-w-7xl px-6 pb-14">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="overflow-hidden border border-slate-200 bg-white">
              <div className="aspect-[16/10] w-full bg-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80"
                  alt="Team collaboration"
                  className="h-full w-full object-cover grayscale"
                />
              </div>
              <div className="p-5">
                <h2 className="text-base font-semibold text-slate-900">Who We Are</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Lakshya is a platform of engineers and career-minded innovators focused on
                  building more transparent and intelligent employment workflows. We believe the
                  future of work is shaped by systems that are practical, intuitive, and designed
                  to support better career decisions.
                </p>
              </div>
            </div>

            <div className="overflow-hidden border border-slate-200 bg-white">
              <div className="aspect-[16/10] w-full bg-slate-100">
                <img
                  src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80"
                  alt="What Lakshya means"
                  className="h-full w-full object-cover grayscale"
                />
              </div>
              <div className="p-5">
                <h2 className="text-base font-semibold text-slate-900">What Lakshya Means</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  Derived from the Sanskrit word for target or goal, Lakshya reflects our mission
                  to help people stay aligned with meaningful outcomes. We provide tools that help
                  users move with more clarity, confidence, and structure in a changing job market.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission + Vision */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#4f5bd5]" />
                <p className="text-sm font-medium text-[#4f5bd5]">Our Mission</p>
              </div>
              <p className="text-sm leading-7 text-slate-600">
                To enable a world where every professional can navigate their career journey with
                confidence, clarity, and structured support, using the power of intelligent
                technologies and thoughtful workflows.
              </p>
            </div>

            <div className="border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#c98a3d]" />
                <p className="text-sm font-medium text-[#c98a3d]">Our Vision</p>
              </div>
              <p className="text-sm leading-7 text-slate-600">
                To become the digital standard for career intelligence, enabling individuals to
                grow with purpose and organizations to discover, assess, and support talent more
                efficiently.
              </p>
            </div>
          </div>
        </section>

        {/* What we do */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="mb-8">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              The Platform
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">What We Do</h2>
          </div>

          <div className="grid gap-px overflow-hidden border border-slate-200 bg-slate-200 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="bg-white p-6">
                <div className="mb-4 text-[#4f5bd5]">{feature.icon}</div>
                <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="border border-slate-200 bg-[#eef1f7]">
            <div className="grid gap-8 px-6 py-10 md:grid-cols-[4px_1fr] md:px-8">
              <div className="hidden bg-[#4f5bd5] md:block" />
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Ready to forge your career path?
                </h2>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  Join thousands of professionals who use Lakshya to turn ambition into actionable
                  career momentum through structured workflows, better visibility, and smarter
                  hiring tools.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link
                    to="/signup"
                    className="inline-flex items-center rounded-md bg-[#4f5bd5] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#4450c4]"
                  >
                    Get Started Now
                  </Link>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Explore Opportunities
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer variant="public" />
    </div>
  );
};

export default AboutPage;