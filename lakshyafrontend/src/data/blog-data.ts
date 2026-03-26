export type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date?: string;
};

export const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "5 Resume Mistakes That Are Costing You Interviews",
    excerpt: "Discover common resume mistakes and simple fixes to improve your chances.",
    category: "Resume Tips",
    date: "Mar 25, 2026",
  },
  {
    id: "2",
    title: "How AI is Changing the Hiring Process",
    excerpt: "Explore how AI tools are transforming job discovery and resume screening.",
    category: "AI & Career Intelligence",
    date: "Mar 15, 2026",
  },
  {
    id: "3",
    title: "Smart Job Search Strategies for Fresh Graduates",
    excerpt: "A practical guide to finding relevant jobs and applying effectively.",
    category: "Job Search Advice",
    date: "Mar 10, 2026",
  },
];
