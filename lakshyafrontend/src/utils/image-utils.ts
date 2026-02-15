/**
 * Get the full URL for an uploaded file (avatar, resume, etc.)
 * @param path - The relative path from the server (e.g., '/uploads/avatars/avatar-123456.jpg')
 * @returns Full URL to access the file
 */
export const getFileUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  
  // If it's already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Otherwise, prepend the server base URL (without /api)
  const serverBaseUrl = 'http://localhost:3000';
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
