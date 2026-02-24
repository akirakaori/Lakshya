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
  if (!status) return 'bg-gray-100 text-gray-700';
  
  switch (status.toLowerCase()) {
    case 'applied':
      return 'bg-blue-100 text-blue-700';
    case 'shortlisted':
      return 'bg-green-100 text-green-700';
    case 'interview':
      return 'bg-purple-100 text-purple-700';
    case 'rejected':
      return 'bg-red-100 text-red-700';
    case 'hired':
      return 'bg-emerald-100 text-emerald-700';
    case 'offer':
      return 'bg-teal-100 text-teal-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}
