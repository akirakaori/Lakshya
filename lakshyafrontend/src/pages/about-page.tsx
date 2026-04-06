import React from 'react';
import { Link } from 'react-router-dom';
import lakshyaLogo from '../assets/lakhsya-logo.svg';

const features = [
  {
    title: 'AI Resume Analysis',
    description: 'Get smarter resume insights and improve your chances with AI-powered evaluation.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3H5.25A2.25 2.25 0 003 5.25v13.5A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V14.25M16.5 3h4.5m0 0v4.5m0-4.5L9.75 14.25" />
      </svg>
    ),
    accent: '#6366f1',
    lightBg: '#eef2ff',
    darkBg: 'rgba(99,102,241,0.12)',
  },
  {
    title: 'Smart Job Discovery',
    description: 'Explore relevant job opportunities with a more structured and intelligent search experience.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z" />
      </svg>
    ),
    accent: '#8b5cf6',
    lightBg: '#f5f3ff',
    darkBg: 'rgba(139,92,246,0.12)',
  },
  {
    title: 'Application Tracking',
    description: 'Track every stage of your job applications in one organized platform.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    accent: '#0ea5e9',
    lightBg: '#f0f9ff',
    darkBg: 'rgba(14,165,233,0.12)',
  },
  {
    title: 'Structured Hiring Workflow',
    description: 'Support interview scheduling, candidate progression, and hiring decisions in a streamlined way.',
    icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    accent: '#10b981',
    lightBg: '#ecfdf5',
    darkBg: 'rgba(16,185,129,0.12)',
  },
];

const AboutPage: React.FC = () => {
  console.debug('[Routing] AboutPage rendered');

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-slate-950 dark:text-white">

      {/* ════════════════════════ HERO ════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white">
        <Link to="/" className="absolute left-6 top-6 z-20 inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm transition hover:bg-white/20">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 shadow-lg shadow-indigo-500/20">
            <img src={lakshyaLogo} alt="Lakshya Logo" className="h-8 w-auto" />
          </div>
          <div>
            <p className="text-lg font-semibold text-white">Lakshya</p>
            <p className="text-xs text-indigo-100">Career intelligence platform</p>
          </div>
        </Link>
        {/* Layered geometric shapes */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06) 0%, transparent 50%),
                              radial-gradient(circle at 10% 80%, rgba(167,139,250,0.15) 0%, transparent 40%)`,
          }}
        />
        {/* Grid dot pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
        {/* Floating circle accents */}
        <div className="absolute top-8 right-16 w-72 h-72 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute top-16 right-24 w-48 h-48 rounded-full border border-white/10 pointer-events-none" />
        <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-8">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-white/90">About Lakshya</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight">
            Your Career.{' '}
            <span className="relative whitespace-nowrap">
              Your Lakshya.
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 300 10"
                preserveAspectRatio="none"
                height="8"
              >
                <path d="M0 7 Q75 1 150 6 Q225 11 300 4" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-indigo-100 leading-relaxed">
            Lakshya is an AI-powered career intelligence platform built to help job seekers
            and recruiters make smarter, faster, and more informed decisions.
          </p>
        </div>
      </section>

      {/* ════════════════════════ WHO WE ARE + WHAT LAKSHYA MEANS ════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-8">
        {/* Who We Are */}
        <div className="group relative bg-gray-50 dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl p-9 overflow-hidden hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xl hover:shadow-indigo-50 dark:hover:shadow-indigo-950 transition-all duration-500">
          <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 mb-6">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-8">
              Lakshya is a modern job platform designed to bridge the gap between talent and opportunity.
              We combine intelligent technology with practical hiring workflows to create a smoother
              experience for both job seekers and recruiters.
            </p>
          </div>
        </div>

        {/* What Lakshya Means */}
        <div className="group relative bg-gray-50 dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl p-9 overflow-hidden hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-xl hover:shadow-purple-50 dark:hover:shadow-purple-950 transition-all duration-500">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-500" />
          <div className="relative">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 mb-6">
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-4">What Lakshya Means</h2>
            <p className="text-gray-600 dark:text-gray-300 leading-8">
              "Lakshya" means target, focus, or goal. Our platform is built around this idea:
              helping users move toward the right career opportunities with confidence, structure,
              and intelligent support.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════ MISSION + VISION ════════════════════════ */}
      <section className="bg-gray-50 dark:bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-8">

          {/* Mission */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl p-9 shadow-sm">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-b-3xl" />
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
                <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-indigo-500 uppercase mb-2">Our Mission</p>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Our Mission</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-8">
                  Our mission is to empower individuals and organizations through AI-driven tools,
                  transparent hiring workflows, and career-focused digital experiences.
                </p>
              </div>
            </div>
          </div>

          {/* Vision */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl p-9 shadow-sm">
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-b-3xl" />
            <div className="flex items-start gap-5">
              <div className="flex-shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-200 dark:shadow-purple-900">
                <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold tracking-[0.15em] text-purple-500 uppercase mb-2">Our Vision</p>
                <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">Our Vision</h3>
                <p className="text-gray-600 dark:text-gray-300 leading-8">
                  Our vision is to build a smarter future for hiring and career growth, where technology
                  helps people find the right opportunities and organizations discover the right talent.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════ WHAT WE DO ════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.18em] text-indigo-500 uppercase mb-4">What We Do</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-gray-900 dark:text-white">
            Built for every step of the journey
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto leading-relaxed">
            Lakshya combines AI, hiring workflow management, and career support into one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group relative bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl p-7 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-400 overflow-hidden"
              style={{
                ['--hover-border' as string]: feature.accent,
              }}
            >
              {/* Top accent line on hover */}
              <div
                className="absolute top-0 left-6 right-6 h-0.5 rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: feature.accent }}
              />

              {/* Icon */}
              <div
                className="inline-flex items-center justify-center w-11 h-11 rounded-2xl mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{
                  backgroundColor: feature.lightBg,
                  color: feature.accent,
                }}
              >
                {feature.icon}
              </div>

              <h3 className="text-base font-bold mb-3 text-gray-900 dark:text-white leading-snug">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-7">
                {feature.description}
              </p>

              {/* Subtle corner glow */}
              <div
                className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
                style={{ background: feature.accent }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════ CTA ════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 text-white p-12 md:p-16 text-center">
          {/* Dot grid overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />
          {/* Blurred blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-300/10 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
          {/* Concentric ring */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/5 pointer-events-none" />

          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-5 leading-tight">
              Start your journey with Lakshya
            </h2>
            <p className="text-indigo-100 max-w-xl mx-auto mb-10 leading-relaxed text-lg">
              Whether you are a job seeker aiming for the next opportunity or a recruiter looking
              for the right talent, Lakshya is built to support your goals.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 rounded-2xl font-bold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 active:scale-95 transition-all duration-200 shadow-xl shadow-indigo-900/30"
              >
                Browse Jobs
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 border border-white/25 rounded-2xl font-bold hover:bg-white/20 active:scale-95 transition-all duration-200 backdrop-blur-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

export default AboutPage;
