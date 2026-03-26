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
      'Understand the technical and soft skills that recruiters prioritize in today’s job market.',
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

const BlogPage: React.FC = () => {
  console.debug('[Routing] BlogPage rendered');
  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-slate-950 dark:text-white">
      <section className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-indigo-100 mb-4">Lakshya Blog</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Career Tips, Insights & Growth Strategies
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-indigo-50">
            Explore resume tips, interview preparation advice, hiring insights,
            and AI-driven career guidance from Lakshya.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-wrap gap-3 mb-10">
          {[
            'All',
            'Resume Tips',
            'Interview Tips',
            'Career Growth',
            'Job Search Advice',
            'Hiring Insights',
            'AI & Career Intelligence',
          ].map((category) => (
            <button
              key={category}
              className="px-4 py-2 rounded-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-gray-300 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              {category}
            </button>
          ))}
        </div>

        <div className="mb-10 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-8">
          <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mb-3">Featured Article</p>
          <h2 className="text-3xl font-bold mb-4">How AI is Transforming Career Intelligence Platforms</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-8 max-w-3xl">
            From smarter resume analysis to structured interview workflows and better hiring decisions,
            AI is shaping the future of recruitment and career growth.
          </p>
          <button className="mt-6 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition">
            Read Featured Article
          </button>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
            >
              <div className="h-44 bg-gradient-to-br from-indigo-500 via-blue-500 to-purple-500" />
              <div className="p-6">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-medium">
                    {post.category}
                  </span>
                  <span>{post.readTime}</span>
                </div>

                <h3 className="text-xl font-bold mb-3 leading-8">{post.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 mb-5">
                  {post.excerpt}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{post.date}</span>
                  <button className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                    Read More
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BlogPage;