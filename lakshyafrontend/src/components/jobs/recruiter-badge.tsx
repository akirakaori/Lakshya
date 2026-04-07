import React from 'react';
import { getFileUrl } from '../../utils/image-utils';

type RecruiterInfo = {
  name?: string | null;
  profileImage?: string | null;
  profileImageUrl?: string | null;
  title?: string | null;
};

interface RecruiterBadgeProps {
  recruiter?: RecruiterInfo | null;
  label?: string;
  size?: 'sm' | 'md';
  className?: string;
}

const sizeClasses = {
  sm: {
    wrapper: 'gap-2.5',
    avatar: 'h-9 w-9 text-xs',
    name: 'text-[13px]',
    title: 'text-[12px]',
    label: 'text-[11px]',
  },
  md: {
    wrapper: 'gap-3',
    avatar: 'h-11 w-11 text-sm',
    name: 'text-sm',
    title: 'text-[13px]',
    label: 'text-[11px]',
  },
};

const getInitials = (name?: string | null) => {
  const safeName = name?.trim() || 'Recruiter';
  const parts = safeName.split(/\s+/).filter(Boolean).slice(0, 2);
  return parts.map((part) => part.charAt(0).toUpperCase()).join('') || 'R';
};

const RecruiterBadge: React.FC<RecruiterBadgeProps> = ({
  recruiter,
  label = 'Posted by',
  size = 'sm',
  className = '',
}) => {
  const classes = sizeClasses[size];
  const recruiterName = recruiter?.name?.trim() || 'Recruiter';
  const recruiterTitle = recruiter?.title?.trim() || '';
  const rawImagePath = recruiter?.profileImageUrl || recruiter?.profileImage || null;
  const avatarUrl = getFileUrl(rawImagePath);
  const [imageFailed, setImageFailed] = React.useState(false);

  React.useEffect(() => {
    setImageFailed(false);
  }, [rawImagePath]);

  const showImage = !!avatarUrl && !imageFailed;

  return (
    <div className={`flex items-center ${classes.wrapper} ${className}`.trim()}>
      {showImage ? (
        <img
          src={avatarUrl || undefined}
          alt={recruiterName}
          className={`${classes.avatar} rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700`}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div
          className={`${classes.avatar} flex items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700`}
          aria-label={recruiterName}
        >
          {getInitials(recruiterName)}
        </div>
      )}

      <div className="min-w-0">
        <p className={`${classes.label} font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400`}>
          {label}
        </p>
        <p className={`${classes.name} truncate font-semibold text-slate-900 dark:text-slate-100`}>
          {recruiterName}
        </p>
        {recruiterTitle && (
          <p className={`${classes.title} truncate text-slate-600 dark:text-slate-400`}>
            {recruiterTitle}
          </p>
        )}
      </div>
    </div>
  );
};

export default RecruiterBadge;
