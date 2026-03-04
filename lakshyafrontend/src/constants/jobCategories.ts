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
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    description: 'Full-stack, backend, frontend development',
  },
  'Data Science & Analytics': {
    icon: '📊',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    description: 'Data analysis, BI, statistics',
  },
  'Artificial Intelligence & Machine Learning': {
    icon: '🤖',
    colorClass: 'text-violet-700',
    bgClass: 'bg-violet-50',
    borderClass: 'border-violet-200',
    description: 'AI, ML, deep learning, NLP',
  },
  'Cloud & DevOps': {
    icon: '☁️',
    colorClass: 'text-sky-700',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    description: 'AWS, Azure, GCP, CI/CD',
  },
  'Cybersecurity': {
    icon: '🔐',
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    description: 'Security, ethical hacking, compliance',
  },
  'Mobile Development': {
    icon: '📱',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    description: 'iOS, Android, React Native, Flutter',
  },
  'Web Development': {
    icon: '🌐',
    colorClass: 'text-cyan-700',
    bgClass: 'bg-cyan-50',
    borderClass: 'border-cyan-200',
    description: 'Frontend, full-stack web apps',
  },
  'Database Administration': {
    icon: '🗄️',
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    description: 'SQL, NoSQL, data management',
  },
  'Quality Assurance & Testing': {
    icon: '✅',
    colorClass: 'text-teal-700',
    bgClass: 'bg-teal-50',
    borderClass: 'border-teal-200',
    description: 'QA, automation, manual testing',
  },
  'Product Management': {
    icon: '📦',
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    description: 'Product strategy, roadmap, vision',
  },
  'Project Management': {
    icon: '📋',
    colorClass: 'text-orange-700',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    description: 'Agile, Scrum, project coordination',
  },
  'UI/UX Design': {
    icon: '🎨',
    colorClass: 'text-pink-700',
    bgClass: 'bg-pink-50',
    borderClass: 'border-pink-200',
    description: 'User experience, interface design',
  },
  'Graphic Design': {
    icon: '🖌️',
    colorClass: 'text-fuchsia-700',
    bgClass: 'bg-fuchsia-50',
    borderClass: 'border-fuchsia-200',
    description: 'Visual design, branding',
  },
  'Digital Marketing': {
    icon: '📈',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    description: 'Online marketing, campaigns',
  },
  'Content Marketing': {
    icon: '✍️',
    colorClass: 'text-yellow-700',
    bgClass: 'bg-yellow-50',
    borderClass: 'border-yellow-200',
    description: 'Content strategy, copywriting',
  },
  'Social Media Marketing': {
    icon: '📱',
    colorClass: 'text-rose-700',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    description: 'Social platforms, community',
  },
  'SEO & SEM': {
    icon: '🔍',
    colorClass: 'text-lime-700',
    bgClass: 'bg-lime-50',
    borderClass: 'border-lime-200',
    description: 'Search optimization, PPC',
  },
  'Sales & Business Development': {
    icon: '💼',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    description: 'B2B, B2C sales, partnerships',
  },
  'Customer Success': {
    icon: '🤝',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    description: 'Client relations, retention',
  },
  'Customer Support': {
    icon: '💬',
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    description: 'Help desk, technical support',
  },
  'Human Resources': {
    icon: '👥',
    colorClass: 'text-violet-700',
    bgClass: 'bg-violet-50',
    borderClass: 'border-violet-200',
    description: 'HR, people operations',
  },
  'Recruitment & Talent Acquisition': {
    icon: '🎯',
    colorClass: 'text-cyan-700',
    bgClass: 'bg-cyan-50',
    borderClass: 'border-cyan-200',
    description: 'Hiring, sourcing, talent',
  },
  'Finance & Accounting': {
    icon: '💰',
    colorClass: 'text-green-700',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    description: 'Financial analysis, accounting',
  },
  'Legal & Compliance': {
    icon: '⚖️',
    colorClass: 'text-slate-700',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
    description: 'Legal counsel, regulatory',
  },
  'Operations Management': {
    icon: '⚙️',
    colorClass: 'text-gray-700',
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    description: 'Business operations, efficiency',
  },
  'Supply Chain & Logistics': {
    icon: '🚚',
    colorClass: 'text-orange-700',
    bgClass: 'bg-orange-50',
    borderClass: 'border-orange-200',
    description: 'Logistics, procurement',
  },
  'Healthcare & Medical': {
    icon: '🏥',
    colorClass: 'text-red-700',
    bgClass: 'bg-red-50',
    borderClass: 'border-red-200',
    description: 'Medical, nursing, healthcare',
  },
  'Education & Training': {
    icon: '📚',
    colorClass: 'text-blue-700',
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    description: 'Teaching, L&D, training',
  },
  'Research & Development': {
    icon: '🔬',
    colorClass: 'text-purple-700',
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    description: 'R&D, innovation, labs',
  },
  'Consulting': {
    icon: '🎓',
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    description: 'Strategy, advisory services',
  },
  'Architecture & Engineering': {
    icon: '🏗️',
    colorClass: 'text-stone-700',
    bgClass: 'bg-stone-50',
    borderClass: 'border-stone-200',
    description: 'Civil, mechanical, electrical',
  },
  'Real Estate': {
    icon: '🏢',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    description: 'Property, real estate',
  },
  'Retail & E-commerce': {
    icon: '🛒',
    colorClass: 'text-pink-700',
    bgClass: 'bg-pink-50',
    borderClass: 'border-pink-200',
    description: 'Retail, online commerce',
  },
  'Hospitality & Tourism': {
    icon: '🏨',
    colorClass: 'text-sky-700',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    description: 'Hotels, travel, tourism',
  },
  'Media & Communications': {
    icon: '📺',
    colorClass: 'text-rose-700',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    description: 'Journalism, PR, media',
  },
  'Creative Arts': {
    icon: '🎭',
    colorClass: 'text-fuchsia-700',
    bgClass: 'bg-fuchsia-50',
    borderClass: 'border-fuchsia-200',
    description: 'Arts, entertainment, music',
  },
  'Non-Profit & Social Impact': {
    icon: '🌍',
    colorClass: 'text-green-700',
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    description: 'NGO, charity, social good',
  },
  'Administrative & Office': {
    icon: '📎',
    colorClass: 'text-gray-700',
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    description: 'Admin, office management',
  },
  'Charter Accountant': {
    icon: '🧾',
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    description: 'Accounting, auditing, taxation, financial reporting',
  },

  'Full Stack Developer': {
    icon: '💻',
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50',
    borderClass: 'border-indigo-200',
    description: 'Frontend, backend, APIs, databases',
  },

  'Data Analyst': {
    icon: '📊',
    colorClass: 'text-emerald-700',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    description: 'Data analysis, dashboards, reporting, BI',
  },

  'Machine Learning Engineer': {
    icon: '🤖',
    colorClass: 'text-violet-700',
    bgClass: 'bg-violet-50',
    borderClass: 'border-violet-200',
    description: 'ML models, pipelines, AI systems',
  },
  
  'Other': {
    icon: '🏷️',
    colorClass: 'text-gray-700',
    bgClass: 'bg-gray-50',
    borderClass: 'border-gray-200',
    description: 'Other categories',
  },
};

// Default meta for categories not in the mapping
export const DEFAULT_CATEGORY_META: CategoryMeta = {
  icon: '🏷️',
  colorClass: 'text-gray-700',
  bgClass: 'bg-gray-50',
  borderClass: 'border-gray-200',
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
