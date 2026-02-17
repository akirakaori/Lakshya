import { useState } from 'react';
import { toast } from 'react-toastify';

/**
 * Shared hook for profile edit mode gating
 * Ensures users must explicitly enter edit mode before making changes
 */
export const useEditMode = () => {
  const [isEditing, setIsEditing] = useState(false);

  const enterEditMode = () => {
    setIsEditing(true);
  };

  const exitEditMode = () => {
    setIsEditing(false);
  };

  /**
   * Guard function to prevent actions when not in edit mode
   * Returns true if action should proceed, false otherwise
   */
  const guardAction = (actionName: string = 'action'): boolean => {
    if (!isEditing) {
      toast.info('Please click "Edit Profile" to make changes', {
        position: 'top-center',
        autoClose: 3000,
      });
      return false;
    }
    return true;
  };

  return {
    isEditing,
    enterEditMode,
    exitEditMode,
    guardAction,
  };
};
