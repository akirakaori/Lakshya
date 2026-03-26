import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'AI Resume Analysis',
    description: 'Get smarter resume insights and improve your chances with AI-powered evaluation.',
    icon: '🧠',
  },
  {
    title: 'Smart Job Discovery',
    description: 'Explore relevant job opportunities with a more structured and intelligent search experience.',
    icon: '💼',
  },
  {
    title: 'Application Tracking',
    description: 'Track every stage of your job applications in one organized platform.',
    icon: '📊',
  },
  {
    title: 'Structured Hiring Workflow',
    description: 'Support interview scheduling, candidate progression, and hiring decisions in a streamlined way.',
    icon: '🎯',
  },
];

const AboutPage: React.FC = () => {
  console.debug('[Routing] AboutPage rendered');
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-slate-950 dark:text-white">
      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-100 mb-4">About Lakshya</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Your Career. Your Lakshya.
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-indigo-50 leading-8">
            Lakshya is an AI-powered career intelligence platform built to help job seekers
            and recruiters make smarter, faster, and more informed decisions.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-10">
        <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">Who We Are</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-8">
            Lakshya is a modern job platform designed to bridge the gap between talent and opportunity.
            We combine intelligent technology with practical hiring workflows to create a smoother
            experience for both job seekers and recruiters.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-4">What Lakshya Means</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-8">
            “Lakshya” means target, focus, or goal. Our platform is built around this idea:
            helping users move toward the right career opportunities with confidence, structure,
            and intelligent support.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-16 grid md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
          <p className="text-gray-600 dark:text-gray-300 leading-8">
            Our mission is to empower individuals and organizations through AI-driven tools,
            transparent hiring workflows, and career-focused digital experiences.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
          <p className="text-gray-600 dark:text-gray-300 leading-8">
            Our vision is to build a smarter future for hiring and career growth, where technology
            helps people find the right opportunities and organizations discover the right talent.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-3">What We Do</h2>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Lakshya combines AI, hiring workflow management, and career support into one platform.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold mb-3">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-7">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-600 to-purple-600 p-10 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Start your journey with Lakshya</h2>
          <p className="text-indigo-100 max-w-2xl mx-auto mb-8">
            Whether you are a job seeker aiming for the next opportunity or a recruiter looking
            for the right talent, Lakshya is built to support your goals.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/jobs"
              className="px-6 py-3 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-indigo-50 transition"
            >
              Browse Jobs
            </Link>
            <Link
              to="/signup"
              className="px-6 py-3 border border-white/30 rounded-xl font-semibold hover:bg-white/10 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;