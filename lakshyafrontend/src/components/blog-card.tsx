import React from "react";
import { Link } from "react-router-dom";

type BlogCardProps = {
  title: string;
  excerpt: string;
  category: string;
  href?: string;
};

const BlogCard: React.FC<BlogCardProps> = ({ title, excerpt, category, href = "/blog" }) => {
  return (
    <Link to={href} className="block">
      <article className="rounded-lg border border-gray-200 bg-white p-4 transition-transform duration-200 ease-in-out hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-2">
          <span className="text-xs font-medium rounded-full bg-indigo-50 px-2.5 py-0.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
            {category}
          </span>
        </div>

        <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-slate-100 line-clamp-2">{title}</h3>
        <p className="text-xs text-gray-600 dark:text-slate-400 leading-relaxed line-clamp-3">{excerpt}</p>
      </article>
    </Link>
  );
};

export default BlogCard;
