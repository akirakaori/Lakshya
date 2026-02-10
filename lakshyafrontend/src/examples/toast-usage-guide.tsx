/**
 * Toast Notification Usage Guide
 * 
 * This file demonstrates how to use the centralized toast notification system
 * in your Lakshya MERN application.
 */

// Import the toast helper functions
import { handleSuccess, handleError, handleInfo, handleWarning, showToast } from '../utils';

// ============================================
// 1. BASIC USAGE - Simple Success/Error
// ============================================

// Success notification
const onUserCreated = () => {
  handleSuccess('User created successfully!');
};

// Error notification
const onError = (error: any) => {
  handleError(error.message || 'Something went wrong');
};

// Info notification
const onInfoMessage = () => {
  handleInfo('Processing your request...');
};

// Warning notification
const onWarning = () => {
  handleWarning('Please verify your email address');
};

// ============================================
// 2. TANSTACK QUERY INTEGRATION
// ============================================

import { useMutation, useQuery } from '@tanstack/react-query';
import { adminApi } from '../api/api-client';

// Example: Mutation with automatic toast notifications
export const useCreateUserMutation = () => {
  return useMutation({
    mutationFn: adminApi.updateUser,
    onSuccess: (data) => {
      handleSuccess(data.message || 'User updated successfully!');
      // Optionally: invalidate queries, navigate, etc.
    },
    onError: (error: any) => {
      handleError(error.message || 'Failed to update user');
    }
  });
};

// Example: Query with loading and error toasts
export const useUsersQuery = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: adminApi.getUsers,
    onError: (error: any) => {
      handleError('Failed to fetch users');
    }
  });
};

// ============================================
// 3. CUSTOM TOAST WITH OPTIONS
// ============================================

// Using showToast with custom options
const customToast = () => {
  showToast('success', 'Custom success message', {
    autoClose: 5000, // 5 seconds instead of default 3
    position: 'bottom-right',
  });
};

// ============================================
// 4. REAL-WORLD EXAMPLES
// ============================================

// Example 1: Form submission with loading state
const handleFormSubmit = async (formData: any) => {
  try {
    handleInfo('Submitting form...');
    const result = await someApiCall(formData);
    handleSuccess('Form submitted successfully!');
    return result;
  } catch (error: any) {
    handleError(error.message || 'Form submission failed');
    throw error;
  }
};

// Example 2: Delete confirmation with warning
const handleDelete = async (id: string) => {
  handleWarning('Deleting item...');
  try {
    await deleteItem(id);
    handleSuccess('Item deleted successfully');
  } catch (error: any) {
    handleError('Failed to delete item');
  }
};

// Example 3: Login flow
const handleLogin = async (credentials: any) => {
  try {
    const response = await loginApi(credentials);
    handleSuccess(`Welcome back, ${response.name}!`);
    // Navigate to dashboard
  } catch (error: any) {
    handleError('Invalid credentials. Please try again.');
  }
};

// Example 4: File upload with progress
const handleFileUpload = async (file: File) => {
  handleInfo('Uploading file...');
  try {
    await uploadFile(file);
    handleSuccess('File uploaded successfully!');
  } catch (error: any) {
    handleError('File upload failed');
  }
};

// ============================================
// 5. COMPONENT USAGE EXAMPLE
// ============================================

import React from 'react';

const ExampleComponent = () => {
  const mutation = useMutation({
    mutationFn: adminApi.updateUser,
    onSuccess: () => handleSuccess('Updated!'),
    onError: (error: any) => handleError(error.message),
  });

  const handleClick = () => {
    mutation.mutate({ userId: '123', userData: { name: 'John' } });
  };

  return (
    <div>
      <button onClick={handleClick} disabled={mutation.isPending}>
        {mutation.isPending ? 'Updating...' : 'Update User'}
      </button>
    </div>
  );
};

// ============================================
// 6. TOAST CONFIGURATION (Already set in App.tsx)
// ============================================

/**
 * The global ToastContainer is configured with:
 * - Position: top-center
 * - Auto-close: 3 seconds
 * - Progress bar: visible
 * - Draggable: yes
 * - Pause on hover: yes
 * - Stack limit: 3 notifications
 * - z-index: 9999 (always on top)
 */

// ============================================
// 7. BEST PRACTICES
// ============================================

/**
 * ✅ DO:
 * - Use handleSuccess for successful operations
 * - Use handleError for errors
 * - Use handleInfo for informational messages
 * - Use handleWarning for warnings or important notices
 * - Keep messages short and clear
 * - Use toasts in TanStack Query callbacks (onSuccess, onError)
 * 
 * ❌ DON'T:
 * - Don't import ToastContainer in individual components (it's global)
 * - Don't use alert() anymore (use toast instead)
 * - Don't show too many toasts at once (limit is 3)
 * - Don't use console.log for user-facing messages
 */

// Placeholder functions for examples
const someApiCall = async (data: any) => ({ success: true });
const deleteItem = async (id: string) => ({ success: true });
const loginApi = async (data: any) => ({ name: 'User' });
const uploadFile = async (file: File) => ({ success: true });

export {};
