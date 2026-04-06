/**
 * Job Categories - Controlled vocabulary for job postings
 * LinkedIn-style categorization with icons and color theming
 */

export const JOB_CATEGORIES = [
  'Software Development',
  'Data Science & Analytics',
  'Artificial Intelligence & Machine Learning',
  'Cloud & DevOps',
  'Cybersecurity',
  'Mobile Development',
  'Web Development',
  'Database Administration',
  'Quality Assurance & Testing',
  'Product Management',
  'Project Management',
  'UI/UX Design',
  'Graphic Design',
  'Digital Marketing',
  'Content Marketing',
  'Social Media Marketing',
  'SEO & SEM',
  'Sales & Business Development',
  'Customer Success',
  'Customer Support',
  'Human Resources',
  'Recruitment & Talent Acquisition',
  'Finance & Accounting',
  'Legal & Compliance',
  'Operations Management',
  'Supply Chain & Logistics',
  'Healthcare & Medical',
  'Education & Training',
  'Research & Development',
  'Consulting',
  'Architecture & Engineering',
  'Real Estate',
  'Retail & E-commerce',
  'Hospitality & Tourism',
  'Media & Communications',
  'Creative Arts',
  'Non-Profit & Social Impact',
  'Administrative & Office',
  'Charter Accountant',
  'Full Stack Developer',
  'Data Analyst',
  'Machine Learning Engineer',
  'Other',
] as const;

export type JobCategory = typeof JOB_CATEGORIES[number];

interface CategoryMeta {
  icon: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  description?: string;
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  'Software Development': {
    icon: '💻',
    colorClass: 'text-indigo-700 dark:text-indigo-300',
    bgClass: 'bg-indigo-50 dark:bg-indigo-500/15',
    borderClass: 'border-indigo-200 dark:border-indigo-500/30',
    description: 'Full-stack, backend, frontend development',
  },
  'Data Science & Analytics': {
    icon: '📊',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-500/15',
    borderClass: 'border-emerald-200 dark:border-emerald-500/30',
    description: 'Data analysis, BI, statistics',
  },
  'Artificial Intelligence & Machine Learning': {
    icon: '🤖',
    colorClass: 'text-violet-700 dark:text-violet-300',
    bgClass: 'bg-violet-50 dark:bg-violet-500/15',
    borderClass: 'border-violet-200 dark:border-violet-500/30',
    description: 'AI, ML, deep learning, NLP',
  },
  'Cloud & DevOps': {
    icon: '☁️',
    colorClass: 'text-sky-700 dark:text-sky-300',
    bgClass: 'bg-sky-50 dark:bg-sky-500/15',
    borderClass: 'border-sky-200 dark:border-sky-500/30',
    description: 'AWS, Azure, GCP, CI/CD',
  },
  'Cybersecurity': {
    icon: '🔐',
    colorClass: 'text-red-700 dark:text-red-300',
    bgClass: 'bg-red-50 dark:bg-red-500/15',
    borderClass: 'border-red-200 dark:border-red-500/30',
    description: 'Security, ethical hacking, compliance',
  },
  'Mobile Development': {
    icon: '📱',
    colorClass: 'text-blue-700 dark:text-blue-300',
    bgClass: 'bg-blue-50 dark:bg-blue-500/15',
    borderClass: 'border-blue-200 dark:border-blue-500/30',
    description: 'iOS, Android, React Native, Flutter',
  },
  'Web Development': {
    icon: '🌐',
    colorClass: 'text-cyan-700 dark:text-cyan-300',
    bgClass: 'bg-cyan-50 dark:bg-cyan-500/15',
    borderClass: 'border-cyan-200 dark:border-cyan-500/30',
    description: 'Frontend, full-stack web apps',
  },
  'Database Administration': {
    icon: '🗄️',
    colorClass: 'text-slate-700 dark:text-slate-300',
    bgClass: 'bg-slate-50 dark:bg-slate-500/15',
    borderClass: 'border-slate-200 dark:border-slate-500/30',
    description: 'SQL, NoSQL, data management',
  },
  'Quality Assurance & Testing': {
    icon: '✅',
    colorClass: 'text-teal-700 dark:text-teal-300',
    bgClass: 'bg-teal-50 dark:bg-teal-500/15',
    borderClass: 'border-teal-200 dark:border-teal-500/30',
    description: 'QA, automation, manual testing',
  },
  'Product Management': {
    icon: '📦',
    colorClass: 'text-purple-700 dark:text-purple-300',
    bgClass: 'bg-purple-50 dark:bg-purple-500/15',
    borderClass: 'border-purple-200 dark:border-purple-500/30',
    description: 'Product strategy, roadmap, vision',
  },
  'Project Management': {
    icon: '📋',
    colorClass: 'text-orange-700 dark:text-orange-300',
    bgClass: 'bg-orange-50 dark:bg-orange-500/15',
    borderClass: 'border-orange-200 dark:border-orange-500/30',
    description: 'Agile, Scrum, project coordination',
  },
  'UI/UX Design': {
    icon: '🎨',
    colorClass: 'text-pink-700 dark:text-pink-300',
    bgClass: 'bg-pink-50 dark:bg-pink-500/15',
    borderClass: 'border-pink-200 dark:border-pink-500/30',
    description: 'User experience, interface design',
  },
  'Graphic Design': {
    icon: '🖌️',
    colorClass: 'text-fuchsia-700 dark:text-fuchsia-300',
    bgClass: 'bg-fuchsia-50 dark:bg-fuchsia-500/15',
    borderClass: 'border-fuchsia-200 dark:border-fuchsia-500/30',
    description: 'Visual design, branding',
  },
  'Digital Marketing': {
    icon: '📈',
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-500/15',
    borderClass: 'border-amber-200 dark:border-amber-500/30',
    description: 'Online marketing, campaigns',
  },
  'Content Marketing': {
    icon: '✍️',
    colorClass: 'text-yellow-700 dark:text-yellow-300',
    bgClass: 'bg-yellow-50 dark:bg-yellow-500/15',
    borderClass: 'border-yellow-200 dark:border-yellow-500/30',
    description: 'Content strategy, copywriting',
  },
  'Social Media Marketing': {
    icon: '📱',
    colorClass: 'text-rose-700 dark:text-rose-300',
    bgClass: 'bg-rose-50 dark:bg-rose-500/15',
    borderClass: 'border-rose-200 dark:border-rose-500/30',
    description: 'Social platforms, community',
  },
  'SEO & SEM': {
    icon: '🔍',
    colorClass: 'text-lime-700 dark:text-lime-300',
    bgClass: 'bg-lime-50 dark:bg-lime-500/15',
    borderClass: 'border-lime-200 dark:border-lime-500/30',
    description: 'Search optimization, PPC',
  },
  'Sales & Business Development': {
    icon: '💼',
    colorClass: 'text-blue-700 dark:text-blue-300',
    bgClass: 'bg-blue-50 dark:bg-blue-500/15',
    borderClass: 'border-blue-200 dark:border-blue-500/30',
    description: 'B2B, B2C sales, partnerships',
  },
  'Customer Success': {
    icon: '🤝',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-500/15',
    borderClass: 'border-emerald-200 dark:border-emerald-500/30',
    description: 'Client relations, retention',
  },
  'Customer Support': {
    icon: '💬',
    colorClass: 'text-indigo-700 dark:text-indigo-300',
    bgClass: 'bg-indigo-50 dark:bg-indigo-500/15',
    borderClass: 'border-indigo-200 dark:border-indigo-500/30',
    description: 'Help desk, technical support',
  },
  'Human Resources': {
    icon: '👥',
    colorClass: 'text-violet-700 dark:text-violet-300',
    bgClass: 'bg-violet-50 dark:bg-violet-500/15',
    borderClass: 'border-violet-200 dark:border-violet-500/30',
    description: 'HR, people operations',
  },
  'Recruitment & Talent Acquisition': {
    icon: '🎯',
    colorClass: 'text-cyan-700 dark:text-cyan-300',
    bgClass: 'bg-cyan-50 dark:bg-cyan-500/15',
    borderClass: 'border-cyan-200 dark:border-cyan-500/30',
    description: 'Hiring, sourcing, talent',
  },
  'Finance & Accounting': {
    icon: '💰',
    colorClass: 'text-green-700 dark:text-green-300',
    bgClass: 'bg-green-50 dark:bg-green-500/15',
    borderClass: 'border-green-200 dark:border-green-500/30',
    description: 'Financial analysis, accounting',
  },
  'Legal & Compliance': {
    icon: '⚖️',
    colorClass: 'text-slate-700 dark:text-slate-300',
    bgClass: 'bg-slate-50 dark:bg-slate-500/15',
    borderClass: 'border-slate-200 dark:border-slate-500/30',
    description: 'Legal counsel, regulatory',
  },
  'Operations Management': {
    icon: '⚙️',
    colorClass: 'text-gray-700 dark:text-gray-300',
    bgClass: 'bg-gray-50 dark:bg-gray-500/15',
    borderClass: 'border-gray-200 dark:border-gray-500/30',
    description: 'Business operations, efficiency',
  },
  'Supply Chain & Logistics': {
    icon: '🚚',
    colorClass: 'text-orange-700 dark:text-orange-300',
    bgClass: 'bg-orange-50 dark:bg-orange-500/15',
    borderClass: 'border-orange-200 dark:border-orange-500/30',
    description: 'Logistics, procurement',
  },
  'Healthcare & Medical': {
    icon: '🏥',
    colorClass: 'text-red-700 dark:text-red-300',
    bgClass: 'bg-red-50 dark:bg-red-500/15',
    borderClass: 'border-red-200 dark:border-red-500/30',
    description: 'Medical, nursing, healthcare',
  },
  'Education & Training': {
    icon: '📚',
    colorClass: 'text-blue-700 dark:text-blue-300',
    bgClass: 'bg-blue-50 dark:bg-blue-500/15',
    borderClass: 'border-blue-200 dark:border-blue-500/30',
    description: 'Teaching, L&D, training',
  },
  'Research & Development': {
    icon: '🔬',
    colorClass: 'text-purple-700 dark:text-purple-300',
    bgClass: 'bg-purple-50 dark:bg-purple-500/15',
    borderClass: 'border-purple-200 dark:border-purple-500/30',
    description: 'R&D, innovation, labs',
  },
  'Consulting': {
    icon: '🎓',
    colorClass: 'text-indigo-700 dark:text-indigo-300',
    bgClass: 'bg-indigo-50 dark:bg-indigo-500/15',
    borderClass: 'border-indigo-200 dark:border-indigo-500/30',
    description: 'Strategy, advisory services',
  },
  'Architecture & Engineering': {
    icon: '🏗️',
    colorClass: 'text-stone-700 dark:text-stone-300',
    bgClass: 'bg-stone-50 dark:bg-stone-500/15',
    borderClass: 'border-stone-200 dark:border-stone-500/30',
    description: 'Civil, mechanical, electrical',
  },
  'Real Estate': {
    icon: '🏢',
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-500/15',
    borderClass: 'border-amber-200 dark:border-amber-500/30',
    description: 'Property, real estate',
  },
  'Retail & E-commerce': {
    icon: '🛒',
    colorClass: 'text-pink-700 dark:text-pink-300',
    bgClass: 'bg-pink-50 dark:bg-pink-500/15',
    borderClass: 'border-pink-200 dark:border-pink-500/30',
    description: 'Retail, online commerce',
  },
  'Hospitality & Tourism': {
    icon: '🏨',
    colorClass: 'text-sky-700 dark:text-sky-300',
    bgClass: 'bg-sky-50 dark:bg-sky-500/15',
    borderClass: 'border-sky-200 dark:border-sky-500/30',
    description: 'Hotels, travel, tourism',
  },
  'Media & Communications': {
    icon: '📺',
    colorClass: 'text-rose-700 dark:text-rose-300',
    bgClass: 'bg-rose-50 dark:bg-rose-500/15',
    borderClass: 'border-rose-200 dark:border-rose-500/30',
    description: 'Journalism, PR, media',
  },
  'Creative Arts': {
    icon: '🎭',
    colorClass: 'text-fuchsia-700 dark:text-fuchsia-300',
    bgClass: 'bg-fuchsia-50 dark:bg-fuchsia-500/15',
    borderClass: 'border-fuchsia-200 dark:border-fuchsia-500/30',
    description: 'Arts, entertainment, music',
  },
  'Non-Profit & Social Impact': {
    icon: '🌍',
    colorClass: 'text-green-700 dark:text-green-300',
    bgClass: 'bg-green-50 dark:bg-green-500/15',
    borderClass: 'border-green-200 dark:border-green-500/30',
    description: 'NGO, charity, social good',
  },
  'Administrative & Office': {
    icon: '📎',
    colorClass: 'text-gray-700 dark:text-gray-300',
    bgClass: 'bg-gray-50 dark:bg-gray-500/15',
    borderClass: 'border-gray-200 dark:border-gray-500/30',
    description: 'Admin, office management',
  },
  'Charter Accountant': {
    icon: '🧾',
    colorClass: 'text-amber-700 dark:text-amber-300',
    bgClass: 'bg-amber-50 dark:bg-amber-500/15',
    borderClass: 'border-amber-200 dark:border-amber-500/30',
    description: 'Accounting, auditing, taxation, financial reporting',
  },

  'Full Stack Developer': {
    icon: '💻',
    colorClass: 'text-indigo-700 dark:text-indigo-300',
    bgClass: 'bg-indigo-50 dark:bg-indigo-500/15',
    borderClass: 'border-indigo-200 dark:border-indigo-500/30',
    description: 'Frontend, backend, APIs, databases',
  },

  'Data Analyst': {
    icon: '📊',
    colorClass: 'text-emerald-700 dark:text-emerald-300',
    bgClass: 'bg-emerald-50 dark:bg-emerald-500/15',
    borderClass: 'border-emerald-200 dark:border-emerald-500/30',
    description: 'Data analysis, dashboards, reporting, BI',
  },

  'Machine Learning Engineer': {
    icon: '🤖',
    colorClass: 'text-violet-700 dark:text-violet-300',
    bgClass: 'bg-violet-50 dark:bg-violet-500/15',
    borderClass: 'border-violet-200 dark:border-violet-500/30',
    description: 'ML models, pipelines, AI systems',
  },
  
  'Other': {
    icon: '🏷️',
    colorClass: 'text-gray-700 dark:text-gray-300',
    bgClass: 'bg-gray-50 dark:bg-gray-500/15',
    borderClass: 'border-gray-200 dark:border-gray-500/30',
    description: 'Other categories',
  },
};

// Default meta for categories not in the mapping
export const DEFAULT_CATEGORY_META: CategoryMeta = {
  icon: '🏷️',
  colorClass: 'text-gray-700 dark:text-gray-300',
  bgClass: 'bg-gray-50 dark:bg-gray-500/15',
  borderClass: 'border-gray-200 dark:border-gray-500/30',
};

/**
 * Get metadata for a category
 */
export const getCategoryMeta = (category: string | undefined): CategoryMeta => {
  if (!category) return DEFAULT_CATEGORY_META;
  return CATEGORY_META[category] ?? DEFAULT_CATEGORY_META;
};

/**
 * Category badge component helper
 */
export const getCategoryBadgeClasses = (category: string | undefined): string => {
  const meta = getCategoryMeta(category);
  return `inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${meta.bgClass} ${meta.colorClass} ${meta.borderClass}`;
};
