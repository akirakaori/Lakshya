import React from 'react';

type BlogPost = {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
};

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: '5 Resume Mistakes That Are Costing You Interviews',
    excerpt:
      'Discover common resume mistakes and learn how AI-driven review can improve your chances.',
    category: 'Resume Tips',
    date: 'Mar 25, 2026',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'How to Prepare for Technical Interviews in 2026',
    excerpt:
      'A practical guide to preparing for coding, system design, and problem-solving interviews.',
    category: 'Interview Tips',
    date: 'Mar 20, 2026',
    readTime: '7 min read',
  },
  {
    id: 3,
    title: 'Top Skills Recruiters Look for in Modern Candidates',
    excerpt:
      'Understand the technical and soft skills that recruiters prioritize in today\'s job market.',
    category: 'Career Growth',
    date: 'Mar 18, 2026',
    readTime: '6 min read',
  },
  {
    id: 4,
    title: 'How AI is Changing the Hiring Process',
    excerpt:
      'Explore how AI tools are transforming job discovery, resume screening, and hiring workflows.',
    category: 'AI & Career Intelligence',
    date: 'Mar 15, 2026',
    readTime: '8 min read',
  },
  {
    id: 5,
    title: 'Smart Job Search Strategies for Fresh Graduates',
    excerpt:
      'A simple strategy guide to finding relevant jobs, building confidence, and applying effectively.',
    category: 'Job Search Advice',
    date: 'Mar 10, 2026',
    readTime: '4 min read',
  },
  {
    id: 6,
    title: 'What Recruiters Expect During Multi-Round Interviews',
    excerpt:
      'Learn how structured hiring rounds work and how candidates can prepare for each stage.',
    category: 'Hiring Insights',
    date: 'Mar 8, 2026',
    readTime: '6 min read',
  },
];

const categoryMeta: Record<string, { color: string; bg: string; darkBg: string }> = {
  'Resume Tips':             { color: '#6366f1', bg: '#eef2ff',   darkBg: 'rgba(99,102,241,0.15)'  },
  'Interview Tips':          { color: '#8b5cf6', bg: '#f5f3ff',   darkBg: 'rgba(139,92,246,0.15)'  },
  'Career Growth':           { color: '#0ea5e9', bg: '#f0f9ff',   darkBg: 'rgba(14,165,233,0.15)'  },
  'AI & Career Intelligence':{ color: '#10b981', bg: '#ecfdf5',   darkBg: 'rgba(16,185,129,0.15)'  },
  'Job Search Advice':       { color: '#f59e0b', bg: '#fffbeb',   darkBg: 'rgba(245,158,11,0.15)'  },
  'Hiring Insights':         { color: '#ef4444', bg: '#fef2f2',   darkBg: 'rgba(239,68,68,0.15)'   },
};

const cardGradients = [
  'from-indigo-500 via-blue-500 to-violet-500',
  'from-violet-500 via-purple-500 to-indigo-500',
  'from-sky-500 via-blue-500 to-indigo-500',
  'from-emerald-500 via-teal-500 to-cyan-500',
  'from-amber-500 via-orange-500 to-rose-500',
  'from-rose-500 via-pink-500 to-purple-500',
];

const categories = [
  'All',
  'Resume Tips',
  'Interview Tips',
  'Career Growth',
  'Job Search Advice',
  'Hiring Insights',
  'AI & Career Intelligence',
];

const BlogPage: React.FC = () => {
  console.debug('[Routing] BlogPage rendered');

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-slate-950 dark:text-white">

      {/* ══════════════════════════════ HERO ══════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
        {/* Decorative rings */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full border border-white/10 -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full border border-white/10 -translate-y-1/3 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 py-28 text-center">
          <div className="inline-flex items-center gap-2.5 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-5 py-2 mb-7">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold tracking-[0.15em] uppercase text-white/90">Lakshya Blog</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 leading-[1.1] tracking-tight">
            Career Tips, Insights
            <br className="hidden md:block" />
            <span className="relative inline-block mt-1">
              &amp; Growth Strategies
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 400 10" preserveAspectRatio="none" height="8">
                <path d="M0 7 Q100 1 200 6 Q300 11 400 4" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-indigo-100 leading-relaxed">
            Explore resume tips, interview preparation advice, hiring insights,
            and AI-driven career guidance from Lakshya.
          </p>
        </div>

        {/* Curved bottom edge */}
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" className="block w-full" style={{ marginBottom: '-1px', fill: 'white' }}>
          <path d="M0 60 L0 35 Q360 5 720 25 Q1080 45 1440 15 L1440 60 Z" />
        </svg>
      </section>

      {/* ══════════════════════════════ FILTERS + CONTENT ══════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-6 py-12">

        {/* Category filters */}
        <div className="flex flex-wrap gap-2.5 mb-12">
          {categories.map((category, i) => (
            <button
              key={category}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all duration-200
                ${i === 0
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40'
                }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* ── Featured Article ── */}
        <div className="group relative overflow-hidden bg-gray-50 dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl p-10 mb-12 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-2xl hover:shadow-indigo-50 dark:hover:shadow-indigo-950 transition-all duration-500">
          {/* Corner accent */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/8 to-transparent rounded-bl-full pointer-events-none group-hover:from-indigo-500/14 transition-all duration-500" />
          {/* Bottom line */}
          <div className="absolute bottom-0 left-10 right-10 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

          <div className="relative flex flex-col lg:flex-row lg:items-center gap-8">
            {/* Text */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  Featured Article
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">8 min read</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight tracking-tight text-gray-900 dark:text-white">
                How AI is Transforming Career
                <br className="hidden md:block" /> Intelligence Platforms
              </h2>
              <p className="text-gray-500 dark:text-gray-400 leading-8 max-w-2xl text-[15px]">
                From smarter resume analysis to structured interview workflows and better hiring decisions,
                AI is shaping the future of recruitment and career growth.
              </p>
              <button className="mt-7 inline-flex items-center gap-2.5 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold text-sm hover:bg-indigo-700 active:scale-95 transition-all duration-200 shadow-lg shadow-indigo-200 dark:shadow-indigo-900">
                Read Featured Article
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>

            {/* Visual accent block */}
            <div className="flex-shrink-0 w-full lg:w-64 xl:w-80 h-48 lg:h-52 rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-600 flex items-center justify-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)`,
                  backgroundSize: '18px 18px',
                }}
              />
              <svg className="relative w-16 h-16 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Blog Grid ── */}
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {blogPosts.map((post, index) => {
            const meta = categoryMeta[post.category] ?? { color: '#6366f1', bg: '#eef2ff', darkBg: 'rgba(99,102,241,0.15)' };
            return (
              <article
                key={post.id}
                className="group bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:-translate-y-1.5 hover:border-gray-300 dark:hover:border-slate-700 transition-all duration-400"
              >
                {/* Card image area */}
                <div className={`relative h-44 bg-gradient-to-br ${cardGradients[index % cardGradients.length]} overflow-hidden`}>
                  {/* Dot texture */}
                  <div
                    className="absolute inset-0 opacity-10"
                    style={{
                      backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.9) 1px, transparent 1px)`,
                      backgroundSize: '20px 20px',
                    }}
                  />
                  {/* Read time badge */}
                  <div className="absolute top-4 right-4 bg-black/25 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                    {post.readTime}
                  </div>
                  {/* Bottom fade */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Card body */}
                <div className="p-6">
                  {/* Category pill */}
                  <span
                    className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-4"
                    style={{ backgroundColor: meta.bg, color: meta.color }}
                  >
                    {post.category}
                  </span>

                  <h3 className="text-[17px] font-bold mb-3 leading-7 text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200">
                    {post.title}
                  </h3>

                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-7 mb-5">
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-800">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{post.date}</span>
                    <button className="inline-flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 font-bold hover:gap-2.5 transition-all duration-200">
                      Read More
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

      </section>
    </div>
  );
};

export default BlogPage;