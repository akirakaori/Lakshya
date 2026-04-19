/**
 * Get the full URL for an uploaded file (avatar, resume, etc.)
 * @param path - The relative path from the server (e.g., '/uploads/avatars/avatar-123456.jpg')
 * @returns Full URL to access the file
 */
export const getFileUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Avoid mixed content errors in production by upgrading Cloudinary HTTP URLs to HTTPS
    if (path.startsWith('http://res.cloudinary.com')) {
      return path.replace('http://', 'https://');
    }
    return path;
  }
  
  // Otherwise, prepend the server base URL (remove trailing /api if present)
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  const serverBaseUrl = apiUrl.endsWith('/api') ? apiUrl.substring(0, apiUrl.length - 4) : apiUrl;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${serverBaseUrl}${cleanPath}`;
};

/**
 * Get initials from a name
 * @param name - Full name
 * @returns Initials (up to 2 characters)
 */
export const getInitials = (name: string | undefined | null): string => {
  if (!name) return 'U';
  
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};
