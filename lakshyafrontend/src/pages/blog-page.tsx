import React from 'react';
import { Link } from 'react-router-dom';
import lakshyaLogo from '../assets/lakhsya-logo.svg';
import Footer from '../components/layout/footer';

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
      "Understand the technical and soft skills that recruiters prioritize in today's job market.",
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

const categoryMeta: Record<string, { color: string; bg: string }> = {
  'Resume Tips': { color: '#4f5bd5', bg: '#eef1ff' },
  'Interview Tips': { color: '#6b63d9', bg: '#f0edff' },
  'Career Growth': { color: '#2563eb', bg: '#eff6ff' },
  'AI & Career Intelligence': { color: '#0f766e', bg: '#ecfeff' },
  'Job Search Advice': { color: '#b45309', bg: '#fff7ed' },
  'Hiring Insights': { color: '#b91c1c', bg: '#fef2f2' },
};

const categories = [
  'All',
  'Resume Tips',
  'Interview Tips',
  'Career Growth',
  'Job Search Advice',
  'Hiring Insights',
  'AI & Career Intelligence',
];

const blogCardImages = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80',
];

const BlogPage: React.FC = () => {
  console.debug('[Routing] BlogPage rendered');

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={lakshyaLogo} alt="Lakshya Logo" className="h-7 w-auto" />
            <span className="text-sm font-semibold text-slate-900">Lakshya</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/" className="text-sm text-slate-500 transition hover:text-slate-900">
              Home
            </Link>
            <Link to="/jobs" className="text-sm text-slate-500 transition hover:text-slate-900">
              Jobs
            </Link>
            <Link to="/resume-analyzer" className="text-sm text-slate-500 transition hover:text-slate-900">
              Resume Analyzer
            </Link>
            <Link to="/blog" className="text-sm font-medium text-[#4f5bd5]">
              Blog
            </Link>
          </nav>

          <Link
            to="/signup"
            className="inline-flex items-center rounded-md bg-[#4f5bd5] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4450c4]"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pb-10 pt-14 md:pb-12 md:pt-16">
          <div className="max-w-3xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f78d8]">
              Lakshya Blog
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Career intelligence, hiring insights, and resume strategy
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
              Explore articles on AI hiring, resume optimization, interview preparation, and
              practical job search strategies built for modern candidates and recruiters.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mx-auto max-w-7xl px-6 pb-8">
          <div className="flex flex-wrap gap-2">
            {categories.map((category, i) => (
              <button
                key={category}
                className={
                  i === 0
                    ? 'rounded-md border border-[#4f5bd5] bg-[#4f5bd5] px-3 py-2 text-xs font-medium text-white transition hover:bg-[#4450c4]'
                    : 'rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900'
                }
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        {/* Featured article */}
        <section className="mx-auto max-w-7xl px-6 pb-10">
          <div className="grid overflow-hidden rounded-none border border-slate-200 bg-white lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 md:p-8">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f78d8]">
                Featured
              </p>

              <h2 className="max-w-xl text-2xl font-semibold leading-tight tracking-tight text-slate-900 md:text-3xl">
                How AI is reshaping resume analysis and job matching
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                AI is changing how candidates present themselves and how recruiters evaluate fit.
                From resume scoring to smarter opportunity discovery, these tools are becoming a
                core part of the modern hiring workflow.
              </p>

              <div className="mt-5 flex items-center gap-4 text-xs text-slate-500">
                <span>AI &amp; Career Intelligence</span>
                <span>•</span>
                <span>8 min read</span>
              </div>

              <button className="mt-7 inline-flex items-center rounded-md bg-[#4f5bd5] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#4450c4]">
                Read Article
              </button>
            </div>

            <div className="min-h-[240px] bg-slate-100 lg:min-h-full">
              <img
                src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80"
                alt="AI hiring and resume analysis"
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </section>

        {/* Blog grid */}
        <section className="mx-auto max-w-7xl px-6 pb-14">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {blogPosts.map((post, index) => {
              const meta = categoryMeta[post.category] ?? {
                color: '#4f5bd5',
                bg: '#eef1ff',
              };

              return (
                <article
                  key={post.id}
                  className="overflow-hidden border border-slate-200 bg-white transition hover:border-slate-300"
                >
                  <div className="aspect-[16/10] w-full bg-slate-100">
                    <img
                      src={blogCardImages[index % blogCardImages.length]}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="p-5">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span
                        className="inline-flex rounded-md px-2.5 py-1 text-[11px] font-medium"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        {post.category}
                      </span>
                      <span className="text-[11px] text-slate-500">{post.readTime}</span>
                    </div>

                    <h3 className="text-[17px] font-semibold leading-7 text-slate-900">
                      {post.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">{post.excerpt}</p>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-xs text-slate-500">{post.date}</span>
                      <button className="text-sm font-medium text-[#4f5bd5] transition hover:text-[#4450c4]">
                        Read More →
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Newsletter / CTA */}
        <section className="mx-auto max-w-7xl px-6 pb-20">
          <div className="border border-slate-200 bg-[#ece9ff] px-6 py-10 text-center md:px-10">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Stay ahead of the curve
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              Get weekly career intelligence, resume insights, and practical job search guidance
              delivered to your inbox.
            </p>

            <div className="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-11 flex-1 border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-[#4f5bd5]"
              />
              <button className="h-11 rounded-md bg-[#4f5bd5] px-5 text-sm font-medium text-white transition hover:bg-[#4450c4]">
                Subscribe
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer variant="public" />
    </div>
  );
};

export default BlogPage;