/**
 * Shared utility for consistent application status display across the application.
 * Maps backend status values to user-friendly labels and badge styling.
 */

/**
 * Get the display label for an application status
 * @param status - The application status from the backend
 * @returns User-friendly status label
 */
export function getStatusLabel(status?: string): string {
  if (!status) return 'Pending';
  
  switch (status.toLowerCase()) {
    case 'applied':
      return 'Pending';
    case 'shortlisted':
      return 'Shortlisted';
    case 'interview':
      return 'Interview';
    case 'rejected':
      return 'Rejected';
    case 'hired':
      return 'Selected';
    case 'offer':
      return 'Offer Extended';
    case 'withdrawn':
      return 'Withdrawn';
    default:
      return 'Pending';
  }
}

/**
 * Get the Tailwind CSS classes for status badge styling
 * @param status - The application status from the backend
 * @returns Tailwind CSS classes for the badge
 */
export function getStatusBadgeClass(status?: string): string {
  if (!status) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  
  switch (status.toLowerCase()) {
    case 'applied':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300';
    case 'shortlisted':
      return 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300';
    case 'interview':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300';
    case 'rejected':
      return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300';
    case 'hired':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
    case 'offer':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300';
    case 'withdrawn':
      return 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  }
}
