import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from '../../Utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/api-client';
import { Footer, PageSizeSelect, PaginationControls, ConfirmModal, type PaginationMeta } from '../../components';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  salary?: string;
  jobType: string;
  createdByName: string;
  status: string;
  isActive: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  editedByAdmin: boolean;
  createdAt: string;
}

function AdminDashboard() {
  const loggedInUser = localStorage.getItem('loggedInUser') || 'Admin';
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  
  // Preview tables pagination (dashboard tab only)
  const [previewUsersPage, setPreviewUsersPage] = useState(1);
  const [previewUsersLimit, setPreviewUsersLimit] = useState(5);
  const [previewUsersSearch, setPreviewUsersSearch] = useState('');
  const [appliedPreviewUsersSearch, setAppliedPreviewUsersSearch] = useState<string | undefined>(undefined);
  
  const [previewJobsPage, setPreviewJobsPage] = useState(1);
  const [previewJobsLimit, setPreviewJobsLimit] = useState(5);
  const [previewJobsSearch, setPreviewJobsSearch] = useState('');
  const [appliedPreviewJobsSearch, setAppliedPreviewJobsSearch] = useState<string | undefined>(undefined);
  
  // Users pagination & filters (full tabs)
  const [usersPage, setUsersPage] = useState(1);
  const [usersLimit, setUsersLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedUserSearch, setAppliedUserSearch] = useState<string | undefined>(undefined);
  
  // Posts pagination & filters (full tabs)
  const [postsPage, setPostsPage] = useState(1);
  const [postsLimit, setPostsLimit] = useState(10);
  const [postSearchQuery, setPostSearchQuery] = useState('');
  const [appliedPostSearch, setAppliedPostSearch] = useState<string | undefined>(undefined);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{type: 'user' | 'post', id: string} | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editUserData, setEditUserData] = useState({ role: '', isActive: true, password: '' });
  const [editPostData, setEditPostData] = useState({ title: '', description: '', company: '', location: '', salary: '', jobType: '' });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch users with useQuery
  const { data: usersData, isLoading: loadingUsers, isFetching: fetchingUsers } = useQuery<{ 
    success: boolean; 
    users: User[]; 
    pagination?: PaginationMeta;
  }>({
    queryKey: ['admin-users', { page: usersPage, limit: usersLimit, search: appliedUserSearch }],
    queryFn: () => adminApi.getUsers({ 
      page: usersPage, 
      limit: usersLimit, 
      search: appliedUserSearch 
    }),
  });

  const users = usersData?.users || [];
  const usersPagination = usersData?.pagination;

  // Fetch preview users (for dashboard tab only)
  const { data: previewUsersData, isLoading: loadingPreviewUsers, isFetching: fetchingPreviewUsers } = useQuery<{ 
    success: boolean; 
    users: User[]; 
    pagination?: PaginationMeta;
  }>({
    queryKey: ['admin-preview-users', { page: previewUsersPage, limit: previewUsersLimit, search: appliedPreviewUsersSearch }],
    queryFn: () => adminApi.getUsers({ 
      page: previewUsersPage, 
      limit: previewUsersLimit, 
      search: appliedPreviewUsersSearch 
    }),
    enabled: activeNav === 'dashboard', // Only fetch when on dashboard tab
  });

  const previewUsers = previewUsersData?.users || [];
  const previewUsersPagination = previewUsersData?.pagination;

  // Fetch posts with useQuery
  const { data: postsData, isLoading: loadingPosts, isFetching: fetchingPosts } = useQuery<{ 
    success: boolean; 
    posts: Post[]; 
    total?: number;
    pagination?: PaginationMeta;
  }>({
    queryKey: ['admin-posts', { 
      page: postsPage, 
      limit: postsLimit, 
      search: appliedPostSearch, 
      status: statusFilter !== 'all' ? statusFilter : undefined 
    }],
    queryFn: () => adminApi.getPosts({ 
      page: postsPage, 
      limit: postsLimit, 
      search: appliedPostSearch,
      status: statusFilter !== 'all' ? statusFilter : undefined
    }),
  });

  const posts = postsData?.posts || [];
  const postsPagination = postsData?.pagination;

  // Fetch preview jobs (for dashboard tab only)
  const { data: previewJobsData, isLoading: loadingPreviewJobs, isFetching: fetchingPreviewJobs } = useQuery<{ 
    success: boolean; 
    posts: Post[]; 
    total?: number;
    pagination?: PaginationMeta;
  }>({
    queryKey: ['admin-preview-jobs', { page: previewJobsPage, limit: previewJobsLimit, search: appliedPreviewJobsSearch }],
    queryFn: () => adminApi.getPosts({ 
      page: previewJobsPage, 
      limit: previewJobsLimit, 
      search: appliedPreviewJobsSearch 
    }),
    enabled: activeNav === 'dashboard', // Only fetch when on dashboard tab
  });

  const previewJobs = previewJobsData?.posts || [];
  const previewJobsPagination = previewJobsData?.pagination;

  // Fetch analytics data
  const { data: analyticsRes, isLoading: loadingAnalytics, isFetching: fetchingAnalytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: adminApi.getAnalytics,
    staleTime: 60_000, // Cache for 1 minute
  });

  const analytics = analyticsRes?.data;

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: { role?: string; isActive?: boolean; password?: string } }) =>
      adminApi.updateUser(userId, userData),
    onSuccess: () => {
      handleSuccess('User updated successfully');
      setShowEditUserModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => {
      handleError(error.message || 'Failed to update user');
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: ({ postId, postData }: { postId: string; postData: { title?: string; description?: string; company?: string; location?: string; salary?: string; jobType?: string } }) =>
      adminApi.updatePost(postId, postData),
    onSuccess: () => {
      handleSuccess('Post updated successfully');
      setShowEditPostModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
    onError: (error: Error) => {
      handleError(error.message || 'Failed to update post');
    }
  });

  // Delete mutation (for both users and posts/jobs)
  const deleteMutation = useMutation({
    mutationFn: ({ type, id, reason }: { type: 'user' | 'post'; id: string; reason?: string }) => {
      if (type === 'user') {
        return adminApi.deleteUser(id, reason || '');
      } else {
        // Use new job soft delete endpoint (no reason needed)
        return adminApi.deleteJob(id);
      }
    },
    onSuccess: (_, variables) => {
      handleSuccess(`${variables.type === 'user' ? 'User' : 'Job'} deleted successfully`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setDeleteReason('');
      if (variables.type === 'user') {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
        queryClient.invalidateQueries({ queryKey: ['jobs'] });
        queryClient.invalidateQueries({ queryKey: ['applications'] });
      }
    },
    onError: (error: Error & { response?: { data?: { message?: string } } }) => {
      handleError(error.response?.data?.message || error.message || 'Failed to delete');
      console.error('Delete error:', error);
    }
  });

  // Pagination & search handlers
  const handleUsersLimitChange = (newLimit: number) => {
    setUsersLimit(newLimit);
    setUsersPage(1);
  };

  const handleUsersPageChange = (newPage: number) => {
    setUsersPage(newPage);
  };

  const handleApplyUserSearch = () => {
    const trimmed = searchQuery.trim().toLowerCase();
    setAppliedUserSearch(trimmed.length >= 2 ? trimmed : undefined);
    setUsersPage(1);
  };

  const handleClearUserSearch = () => {
    setSearchQuery('');
    setAppliedUserSearch(undefined);
    setUsersPage(1);
  };

  const handlePostsLimitChange = (newLimit: number) => {
    setPostsLimit(newLimit);
    setPostsPage(1);
  };

  const handlePostsPageChange = (newPage: number) => {
    setPostsPage(newPage);
  };

  const handleApplyPostSearch = () => {
    const trimmed = postSearchQuery.trim().toLowerCase();
    setAppliedPostSearch(trimmed.length >= 2 ? trimmed : undefined);
    setPostsPage(1);
  };

  const handleClearPostSearch = () => {
    setPostSearchQuery('');
    setAppliedPostSearch(undefined);
    setPostsPage(1);
  };

  const handleStatusFilterChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setPostsPage(1);
  };

  // Preview tables handlers (dashboard tab)
  const handlePreviewUsersLimitChange = (newLimit: number) => {
    setPreviewUsersLimit(newLimit);
    setPreviewUsersPage(1);
  };

  const handlePreviewUsersPageChange = (newPage: number) => {
    setPreviewUsersPage(newPage);
  };

  const handleApplyPreviewUsersSearch = () => {
    const trimmed = previewUsersSearch.trim().toLowerCase();
    setAppliedPreviewUsersSearch(trimmed.length >= 2 ? trimmed : undefined);
    setPreviewUsersPage(1);
  };

  const handleClearPreviewUsersSearch = () => {
    setPreviewUsersSearch('');
    setAppliedPreviewUsersSearch(undefined);
    setPreviewUsersPage(1);
  };

  const handlePreviewJobsLimitChange = (newLimit: number) => {
    setPreviewJobsLimit(newLimit);
    setPreviewJobsPage(1);
  };

  const handlePreviewJobsPageChange = (newPage: number) => {
    setPreviewJobsPage(newPage);
  };

  const handleApplyPreviewJobsSearch = () => {
    const trimmed = previewJobsSearch.trim().toLowerCase();
    setAppliedPreviewJobsSearch(trimmed.length >= 2 ? trimmed : undefined);
    setPreviewJobsPage(1);
  };

  const handleClearPreviewJobsSearch = () => {
    setPreviewJobsSearch('');
    setAppliedPreviewJobsSearch(undefined);
    setPreviewJobsPage(1);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditUserData({
      role: user.role,
      isActive: user.isActive,
      password: ''
    });
    setShowEditUserModal(true);
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setEditPostData({
      title: post.title,
      description: post.description,
      company: post.company,
      location: post.location,
      salary: post.salary || '',
      jobType: post.jobType
    });
    setShowEditPostModal(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    updateUserMutation.mutate({ userId: editingUser._id, userData: editUserData });
  };

  const handleSavePost = async () => {
    if (!editingPost) return;
    updatePostMutation.mutate({ postId: editingPost._id, postData: editPostData });
  };

  const handleDeleteClick = (type: 'user' | 'post', id: string) => {
    setDeleteTarget({ type, id });
    setDeleteReason('');
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    deleteMutation.mutate({ 
      type: deleteTarget.type, 
      id: deleteTarget.id, 
      reason: deleteTarget.type === 'user' ? deleteReason : undefined
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <div className='flex h-screen bg-gray-50'>
      <aside className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white transition-all duration-300 flex flex-col shadow-2xl`}>

        <div className='p-6 flex items-center justify-between border-b border-indigo-700'>
          {isSidebarOpen && (
            <div onClick={() => navigate("/landing")}
            className='flex items-center space-x-3 cursor-pointer hover:opacity-80 transition'>
              <div className='w-10 h-10 bg-white rounded-lg flex items-center justify-center'>
                <span className='text-2xl'>💼</span>
              </div>
              <h1 className='text-xl font-bold'>Lakshya</h1>
            </div>
          )}
        </div>

        <nav className='flex-1 p-4 space-y-2'>
          <button onClick={() => setActiveNav('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeNav === 'dashboard' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' /></svg>
            {isSidebarOpen && <span className='font-medium'>Dashboard</span>}
          </button>
          <button onClick={() => setActiveNav('users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeNav === 'users' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' /></svg>
            {isSidebarOpen && <span className='font-medium'>Users</span>}
          </button>
          <button onClick={() => setActiveNav('posts')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeNav === 'posts' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' /></svg>
            {isSidebarOpen && <span className='font-medium'>Posts</span>}
          </button>
        </nav>

        <div className='p-4 border-t border-indigo-700'>
          <button onClick={handleLogout} className='w-full flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-red-600/20 transition-all duration-200 text-red-200 hover:text-white'>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' /></svg>
            {isSidebarOpen && <span className='font-medium'>Logout</span>}
          </button>
        </div>
      </aside>

      <div className='flex-1 flex flex-col overflow-hidden'>
        <header className='bg-white shadow-sm border-b border-gray-200'>
          <div className='flex items-center justify-between px-8 py-4'>
            <div className='flex items-center space-x-4'>
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className='p-2 rounded-lg hover:bg-gray-100'>
                <svg className='w-6 h-6 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M4 6h16M4 12h16M4 18h16' /></svg>
              </button>
              <h2 className='text-2xl font-bold text-gray-800'>{activeNav === 'dashboard' ? 'Overview' : activeNav === 'users' ? 'User Management' : 'Post Management'}</h2>
            </div>
            <div className='flex items-center space-x-3'>
              <button
                onClick={() => navigate('/admin/profile')}
                className='px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition-colors flex items-center space-x-2'
              >
                <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' />
                </svg>
                <span>Profile</span>
              </button>
              <div className='w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold'>{loggedInUser.charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        <div className='flex-1 overflow-y-auto bg-gray-50'>
          <main className='min-h-screen p-8'>
          {activeNav === 'dashboard' && (
            <>
              {/* Top Stats Cards with Percentage Changes */}
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                {loadingAnalytics ? (
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 animate-pulse'>
                        <div className='h-12 w-12 bg-gray-200 rounded-lg mb-4'></div>
                        <div className='h-8 w-20 bg-gray-200 rounded mb-2'></div>
                        <div className='h-4 w-24 bg-gray-200 rounded mb-1'></div>
                        <div className='h-3 w-16 bg-gray-200 rounded'></div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center'>
                          <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' />
                          </svg>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${parseFloat(analytics?.totals.userChange || '0') >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                          {parseFloat(analytics?.totals.userChange || '0') > 0 ? '+' : ''}{analytics?.totals.userChange}%
                        </span>
                      </div>
                      <h3 className='text-3xl font-bold text-gray-900 mb-1'>{analytics?.totals.totalUsers.toLocaleString() || '0'}</h3>
                      <p className='text-sm font-semibold text-gray-700 mb-1'>TOTAL USERS</p>
                      <p className='text-xs text-gray-500'>Active users on platform</p>
                    </div>

                    <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='w-12 h-12 bg-indigo-500 rounded-lg flex items-center justify-center'>
                          <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
                          </svg>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${parseFloat(analytics?.totals.jobSeekerChange || '0') >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                          {parseFloat(analytics?.totals.jobSeekerChange || '0') > 0 ? '+' : ''}{analytics?.totals.jobSeekerChange}%
                        </span>
                      </div>
                      <h3 className='text-3xl font-bold text-gray-900 mb-1'>{analytics?.totals.totalJobSeekers.toLocaleString() || '0'}</h3>
                      <p className='text-sm font-semibold text-gray-700 mb-1'>JOB SEEKERS</p>
                      <p className='text-xs text-gray-500'>Active job seekers</p>
                    </div>

                    <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center'>
                          <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' />
                          </svg>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${parseFloat(analytics?.totals.recruiterChange || '0') >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                          {parseFloat(analytics?.totals.recruiterChange || '0') > 0 ? '+' : ''}{analytics?.totals.recruiterChange}%
                        </span>
                      </div>
                      <h3 className='text-3xl font-bold text-gray-900 mb-1'>{analytics?.totals.totalRecruiters.toLocaleString() || '0'}</h3>
                      <p className='text-sm font-semibold text-gray-700 mb-1'>RECRUITERS</p>
                      <p className='text-xs text-gray-500'>Active recruiters</p>
                    </div>

                    <div className='bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow'>
                      <div className='flex items-center justify-between mb-3'>
                        <div className='w-12 h-12 bg-cyan-500 rounded-lg flex items-center justify-center'>
                          <svg className='w-6 h-6 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' />
                          </svg>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-1 rounded ${parseFloat(analytics?.totals.jobChange || '0') >= 0 ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'}`}>
                          {parseFloat(analytics?.totals.jobChange || '0') > 0 ? '+' : ''}{analytics?.totals.jobChange}%
                        </span>
                      </div>
                      <h3 className='text-3xl font-bold text-gray-900 mb-1'>{analytics?.totals.openJobs.toLocaleString() || '0'}</h3>
                      <p className='text-sm font-semibold text-gray-700 mb-1'>OPEN JOBS</p>
                      <p className='text-xs text-gray-500'>{analytics?.totals.closedJobs || 0} closed</p>
                    </div>
                  </>
                )}
              </div>

              {/* Analytics Section */}
              {!loadingAnalytics && analytics && (
                <div className='mb-8 space-y-6'>
                  {/* Secondary Stats Row */}
                  <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                    <div className='bg-white rounded-lg border border-gray-200 p-5'>
                      <p className='text-xs font-semibold text-gray-600 uppercase mb-1'>TOTAL APPLICATIONS</p>
                      <p className='text-2xl font-bold text-gray-900'>{analytics.totals.totalApplications.toLocaleString()}</p>
                    </div>
                    <div className='bg-white rounded-lg border border-gray-200 p-5'>
                      <p className='text-xs font-semibold text-gray-600 uppercase mb-1'>APPLICATIONS TODAY</p>
                      <p className='text-2xl font-bold text-gray-900'>{analytics.totals.applicationsToday.toLocaleString()}</p>
                    </div>
                    <div className='bg-white rounded-lg border border-gray-200 p-5'>
                      <p className='text-xs font-semibold text-gray-600 uppercase mb-1'>TOTAL JOBS LIVE</p>
                      <p className='text-2xl font-bold text-gray-900'>{analytics.totals.openJobs.toLocaleString()}</p>
                    </div>
                    <div className='bg-white rounded-lg border border-gray-200 p-5'>
                      <p className='text-xs font-semibold text-gray-600 uppercase mb-1'>TOP SKILL IN DEMAND</p>
                      <p className='text-2xl font-bold text-gray-900 capitalize'>{analytics.topSkills[0]?.skill || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Applications Trend */}
                    <div className='bg-white rounded-lg border border-gray-200 p-6'>
                      <div className='flex items-center justify-between mb-5'>
                        <div>
                          <h3 className='text-base font-bold text-gray-900'>Applications Trend</h3>
                          <p className='text-xs text-gray-500'>Daily incoming applications (Last 30 days)</p>
                        </div>
                        {fetchingAnalytics && (
                          <span className='text-xs text-blue-600'>Refreshing...</span>
                        )}
                      </div>
                      <ResponsiveContainer width='100%' height={250}>
                        <LineChart data={analytics.trend14d}>
                          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                          <XAxis 
                            dataKey='date' 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            tickFormatter={(value) => {
                              const date = new Date(value);
                              return `${date.getMonth() + 1}/${date.getDate()}`;
                            }}
                          />
                          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                            labelFormatter={(value) => {
                              const date = new Date(value);
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                          />
                          <Line 
                            type='monotone' 
                            dataKey='count' 
                            stroke='#3b82f6' 
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                            name='New Apps'
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Popular Job Categories */}
                    <div className='bg-white rounded-lg border border-gray-200 p-6'>
                      <h3 className='text-base font-bold text-gray-900 mb-1'>Popular Job Categories</h3>
                      <p className='text-xs text-gray-500 mb-5'>Based on application volume</p>
                      <ResponsiveContainer width='100%' height={250}>
                        <BarChart data={analytics.topJobs} layout='vertical'>
                          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                          <XAxis type='number' tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <YAxis 
                            type='category' 
                            dataKey='title' 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            width={120}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey='count' fill='#3b82f6' radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Skills and Recruiter Activity Row */}
                  <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                    {/* Top Skills in Demand */}
                    <div className='bg-white rounded-lg border border-gray-200 p-6'>
                      <div className='flex items-center justify-between mb-5'>
                        <div>
                          <h3 className='text-base font-bold text-gray-900'>Top Skills in Demand</h3>
                          <p className='text-xs text-gray-500'>Extracted from top 500 active job postings</p>
                        </div>
                        <button 
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })}
                          className='text-xs text-blue-600 hover:text-blue-700 font-medium'
                        >
                          View Full Report
                        </button>
                      </div>
                      <ResponsiveContainer width='100%' height={250}>
                        <BarChart data={analytics.topSkills}>
                          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                          <XAxis 
                            dataKey='skill' 
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            angle={-45}
                            textAnchor='end'
                            height={80}
                          />
                          <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e5e7eb', 
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          />
                          <Bar dataKey='count' fill='#06d6a0' radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Recent Recruiter Activity */}
                    <div className='bg-white rounded-lg border border-gray-200 p-6'>
                      <div className='flex items-center justify-between mb-4'>
                        <div>
                          <h3 className='text-base font-bold text-gray-900'>Recent Recruiter Activity</h3>
                        </div>
                        <div className='flex gap-2'>
                          <button className='px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200'>
                            All Recruiters
                          </button>
                          <button className='px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded'>
                            Active Only
                          </button>
                        </div>
                      </div>
                      <div className='overflow-hidden'>
                        <table className='w-full'>
                          <thead>
                            <tr className='border-b border-gray-200'>
                              <th className='text-left text-xs font-semibold text-gray-600 uppercase pb-2'>RECRUITER NAME</th>
                              <th className='text-center text-xs font-semibold text-gray-600 uppercase pb-2'>JOBS POSTED</th>
                              <th className='text-center text-xs font-semibold text-gray-600 uppercase pb-2'>APPLICATIONS RECEIVED</th>
                              <th className='text-center text-xs font-semibold text-gray-600 uppercase pb-2'>STATUS</th>
                            </tr>
                          </thead>
                          <tbody className='divide-y divide-gray-100'>
                            {analytics.recruiterActivity.slice(0, 5).map((recruiter, idx) => (
                              <tr key={idx} className='hover:bg-gray-50'>
                                <td className='py-3'>
                                  <div className='flex items-center gap-2'>
                                    <div className='w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold'>
                                      {recruiter.recruiterName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <p className='text-sm font-medium text-gray-900'>{recruiter.recruiterName}</p>
                                      <p className='text-xs text-gray-500'>{recruiter.recruiterEmail}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className='text-center text-sm font-semibold text-gray-900'>{recruiter.jobsPosted}</td>
                                <td className='text-center'>
                                  <div className='flex items-center justify-center gap-2'>
                                    <div className='flex-1 bg-gray-200 rounded-full h-1.5 max-w-[60px]'>
                                      <div 
                                        className='bg-blue-600 h-1.5 rounded-full' 
                                        style={{ width: `${Math.min((recruiter.applicationsReceived / 5000) * 100, 100)}%` }}
                                      ></div>
                                    </div>
                                    <span className='text-sm font-semibold text-gray-900'>{recruiter.applicationsReceived.toLocaleString()}</span>
                                  </div>
                                </td>
                                <td className='text-center'>
                                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                    recruiter.status === 'Active' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {recruiter.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {analytics.recruiterActivity.length > 5 && (
                          <div className='mt-3 text-center'>
                            <p className='text-xs text-gray-500'>
                              Showing 5 of {analytics.recruiterActivity.length} recruiters
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* User Management Section */}
              <div className='mb-8'>
                <h3 className='text-xl font-bold text-gray-800 mb-4'>User Management</h3>
                <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
                  <div className='p-6 border-b'>
                    <div className='flex gap-3 items-center'>
                      <input 
                        type='text' 
                        placeholder='Search users...' 
                        value={previewUsersSearch} 
                        onChange={(e) => setPreviewUsersSearch(e.target.value)} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyPreviewUsersSearch();
                          }
                        }}
                        className='flex-1 px-4 py-3 border rounded-lg' 
                      />
                      <button
                        onClick={handleApplyPreviewUsersSearch}
                        className='px-5 py-3 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors'
                      >
                        Apply Search
                      </button>
                      {appliedPreviewUsersSearch && (
                        <button
                          onClick={handleClearPreviewUsersSearch}
                          className='px-5 py-3 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors'
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className='p-4 border-b bg-gray-50 flex justify-between items-center'>
                    <PageSizeSelect
                      value={previewUsersLimit}
                      onChange={handlePreviewUsersLimitChange}
                      options={[5, 10, 15, 20]}
                      disabled={loadingPreviewUsers}
                    />
                    {previewUsersPagination && (
                      <span className='text-sm text-gray-600'>
                        Total users: {previewUsersPagination.total}
                        {fetchingPreviewUsers && <span className='ml-2 text-indigo-600 animate-pulse'>Updating...</span>}
                      </span>
                    )}
                  </div>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className='bg-gray-50 border-b'>
                        <tr>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>S.N.</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Name</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Email</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Role</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Status</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Joined</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Actions</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {loadingPreviewUsers ? (
                          <tr><td colSpan={7} className='px-6 py-8 text-center text-gray-500'>Loading...</td></tr>
                        ) : previewUsers.length === 0 ? (
                          <tr><td colSpan={7} className='px-6 py-8 text-center text-gray-500'>No users found</td></tr>
                        ) : previewUsers.map((user, index) => {
                          const serial = (previewUsersPage - 1) * previewUsersLimit + index + 1;
                          return (
                            <tr key={user._id} className='hover:bg-gray-50'>
                              <td className='px-6 py-4 text-sm text-gray-900'>{serial}</td>
                              <td className='px-6 py-4'><div className='text-sm font-medium text-gray-900'>{user.name}</div></td>
                              <td className='px-6 py-4'><div className='text-sm text-gray-600'>{user.email}</div></td>
                              <td className='px-6 py-4'><span className='px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800'>{user.role}</span></td>
                              <td className='px-6 py-4'><span className={`px-3 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.isActive ? 'Active' : 'Suspended'}</span></td>
                              <td className='px-6 py-4 text-sm text-gray-600'>{formatDate(user.createdAt)}</td>
                              <td className='px-6 py-4 space-x-2'>
                                <button onClick={() => handleEditUser(user)} className='text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50'>Edit</button>
                                <button onClick={() => handleDeleteClick('user', user._id)} className='text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50'>Delete</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {previewUsersPagination && previewUsersPagination.pages > 1 && (
                    <div className='p-4 border-t'>
                      <PaginationControls
                        pagination={previewUsersPagination}
                        onPageChange={handlePreviewUsersPageChange}
                        isLoading={loadingPreviewUsers}
                        isFetching={fetchingPreviewUsers}
                      />
                    </div>
                  )}
                  <div className='p-4 border-t bg-gray-50 text-center'>
                    <button onClick={() => setActiveNav('users')} className='text-indigo-600 hover:text-indigo-900 font-medium'>View full users list →</button>
                  </div>
                </div>
              </div>

              {/* Job Management Section */}
              <div>
                <h3 className='text-xl font-bold text-gray-800 mb-4'>Job Management Overview</h3>
                <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
                  <div className='p-6 border-b'>
                    <div className='flex gap-3 items-center'>
                      <input 
                        type='text' 
                        placeholder='Search jobs...' 
                        value={previewJobsSearch} 
                        onChange={(e) => setPreviewJobsSearch(e.target.value)} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleApplyPreviewJobsSearch();
                          }
                        }}
                        className='flex-1 px-4 py-3 border rounded-lg' 
                      />
                      <button
                        onClick={handleApplyPreviewJobsSearch}
                        className='px-5 py-3 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors'
                      >
                        Apply Search
                      </button>
                      {appliedPreviewJobsSearch && (
                        <button
                          onClick={handleClearPreviewJobsSearch}
                          className='px-5 py-3 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors'
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className='p-4 border-b bg-gray-50 flex justify-between items-center'>
                    <PageSizeSelect
                      value={previewJobsLimit}
                      onChange={handlePreviewJobsLimitChange}
                      options={[5, 10, 15, 20]}
                      disabled={loadingPreviewJobs}
                    />
                    {previewJobsPagination && (
                      <span className='text-sm text-gray-600'>
                        Total jobs: {previewJobsPagination.total}
                        {fetchingPreviewJobs && <span className='ml-2 text-indigo-600 animate-pulse'>Updating...</span>}
                      </span>
                    )}
                  </div>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className='bg-gray-50 border-b'>
                        <tr>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>S.N.</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Title</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Company</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Posted By</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Status</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Date</th>
                          <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Actions</th>
                        </tr>
                      </thead>
                      <tbody className='divide-y'>
                        {loadingPreviewJobs ? (
                          <tr><td colSpan={7} className='px-6 py-8 text-center text-gray-500'>Loading...</td></tr>
                        ) : previewJobs.length === 0 ? (
                          <tr><td colSpan={7} className='px-6 py-8 text-center text-gray-500'>No jobs found</td></tr>
                        ) : previewJobs.map((post, index) => {
                          const serial = (previewJobsPage - 1) * previewJobsLimit + index + 1;
                          return (
                            <tr key={post._id} className='hover:bg-gray-50'>
                              <td className='px-6 py-4 text-sm text-gray-900'>{serial}</td>
                              <td className='px-6 py-4'>
                                <div className='text-sm font-medium text-gray-900'>{post.title}</div>
                                <div className='text-xs text-gray-500'>{post.jobType}</div>
                              </td>
                              <td className='px-6 py-4'>
                                <div className='text-sm text-gray-900'>{post.company}</div>
                                <div className='text-xs text-gray-500'>{post.location}</div>
                              </td>
                              <td className='px-6 py-4'><div className='text-sm text-gray-600'>{post.createdByName}</div></td>
                              <td className='px-6 py-4'>
                                <span className={`px-3 py-1 text-xs rounded-full ${
                                  post.status === 'open' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {post.status === 'open' ? 'Open' : 'Closed'}
                                </span>
                              </td>
                              <td className='px-6 py-4 text-sm text-gray-600'>{formatDate(post.createdAt)}</td>
                              <td className='px-6 py-4 space-x-2'>
                                <button onClick={() => handleEditPost(post)} className='text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50'>Edit</button>
                                <button onClick={() => handleDeleteClick('post', post._id)} className='text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50'>Delete</button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {previewJobsPagination && previewJobsPagination.pages > 1 && (
                    <div className='p-4 border-t'>
                      <PaginationControls
                        pagination={previewJobsPagination}
                        onPageChange={handlePreviewJobsPageChange}
                        isLoading={loadingPreviewJobs}
                        isFetching={fetchingPreviewJobs}
                      />
                    </div>
                  )}
                  <div className='p-4 border-t bg-gray-50 text-center'>
                    <button onClick={() => setActiveNav('posts')} className='text-indigo-600 hover:text-indigo-900 font-medium'>View full jobs list →</button>
                  </div>
                </div>
              </div>            </>
          )}

          {activeNav === 'users' && (
            <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
              {/* Search & Filters */}
              <div className='p-6 border-b space-y-4'>
                <div className='flex flex-col md:flex-row gap-4'>
                  <input 
                    type='text' 
                    placeholder='Search by name or email...' 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyUserSearch()}
                    className='flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' 
                  />
                  <div className='flex gap-2'>
                    <button
                      onClick={handleApplyUserSearch}
                      className='px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium'
                    >
                      Apply Search
                    </button>
                    {appliedUserSearch && (
                      <button
                        onClick={handleClearUserSearch}
                        className='px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium'
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <PageSizeSelect 
                    value={usersLimit} 
                    onChange={handleUsersLimitChange}
                    disabled={loadingUsers}
                  />
                  {usersPagination && (
                    <div className='text-sm text-gray-600'>
                      {fetchingUsers && <span className='text-indigo-600 mr-2'>Updating...</span>}
                      Total: <span className='font-semibold'>{usersPagination.total}</span> users
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 border-b'>
                    <tr>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase w-20'>S.N.</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Name</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Email</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Role</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Status</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Joined</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {loadingUsers ? (
                      <tr><td colSpan={7} className='px-6 py-8 text-center text-gray-500'>Loading...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={7} className='px-6 py-8 text-center text-gray-500'>No users found</td></tr>
                    ) : users.map((user, index) => {
                      const serial = (usersPage - 1) * usersLimit + index + 1;
                      return (
                        <tr key={user._id} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 text-sm text-gray-600'>{serial}</td>
                          <td className='px-6 py-4'><div className='text-sm font-medium text-gray-900'>{user.name}</div></td>
                          <td className='px-6 py-4'><div className='text-sm text-gray-600'>{user.email}</div></td>
                          <td className='px-6 py-4'><span className='px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-800'>{user.role}</span></td>
                          <td className='px-6 py-4'><span className={`px-3 py-1 text-xs rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{user.isActive ? 'Active' : 'Suspended'}</span></td>
                          <td className='px-6 py-4 text-sm text-gray-600'>{formatDate(user.createdAt)}</td>
                          <td className='px-6 py-4 space-x-2'>
                            <button onClick={() => handleEditUser(user)} className='text-indigo-600 hover:text-indigo-900 p-2 rounded-lg hover:bg-indigo-50'>Edit</button>
                            <button onClick={() => handleDeleteClick('user', user._id)} className='text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50'>Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {usersPagination && usersPagination.pages > 1 && (
                <PaginationControls
                  pagination={usersPagination}
                  onPageChange={handleUsersPageChange}
                  isLoading={loadingUsers}
                  isFetching={fetchingUsers}
                />
              )}
            </div>
          )}

          {activeNav === 'posts' && (
            <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
              {/* Search & Filters */}
              <div className='p-6 border-b space-y-4'>
                <div className='flex flex-col md:flex-row gap-4'>
                  <input 
                    type='text' 
                    placeholder='Search jobs by title or company...' 
                    value={postSearchQuery} 
                    onChange={(e) => setPostSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyPostSearch()}
                    className='flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' 
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => handleStatusFilterChange(e.target.value)}
                    className='px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  >
                    <option value='all'>All Status</option>
                    <option value='open'>Open</option>
                    <option value='closed'>Closed</option>
                  </select>
                  <div className='flex gap-2'>
                    <button
                      onClick={handleApplyPostSearch}
                      className='px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium'
                    >
                      Apply Search
                    </button>
                    {appliedPostSearch && (
                      <button
                        onClick={handleClearPostSearch}
                        className='px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium'
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className='flex items-center justify-between'>
                  <PageSizeSelect 
                    value={postsLimit} 
                    onChange={handlePostsLimitChange}
                    disabled={loadingPosts}
                  />
                  {postsPagination && (
                    <div className='text-sm text-gray-600'>
                      {fetchingPosts && <span className='text-indigo-600 mr-2'>Updating...</span>}
                      Total: <span className='font-semibold'>{postsPagination.total}</span> jobs
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 border-b'>
                    <tr>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase w-20'>S.N.</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Title</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Company</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Posted By</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Status</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Date</th>
                      <th className='px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase'>Actions</th>
                    </tr>
                  </thead>
                  <tbody className='divide-y'>
                    {loadingPosts ? (
                      <tr><td colSpan={7} className='px-6 py-8 text-center text-gray-500'>Loading...</td></tr>
                    ) : posts.length === 0 ? (
                      <tr><td colSpan={7} className='px-6 py-8 text-center text-gray-500'>No jobs found</td></tr>
                    ) : posts.map((post, index) => {
                      const serial = (postsPage - 1) * postsLimit + index + 1;
                      return (
                        <tr key={post._id} className='hover:bg-gray-50'>
                          <td className='px-6 py-4 text-sm text-gray-600'>{serial}</td>
                          <td className='px-6 py-4'>
                            <div className='text-sm font-medium text-gray-900'>{post.title}</div>
                            <div className='text-xs text-gray-500'>{post.jobType}</div>
                          </td>
                          <td className='px-6 py-4'>
                            <div className='text-sm text-gray-900'>{post.company}</div>
                            <div className='text-xs text-gray-500'>{post.location}</div>
                          </td>
                          <td className='px-6 py-4'>
                            <div className='text-sm text-gray-600'>{post.createdByName}</div>
                          </td>
                          <td className='px-6 py-4'>
                            <div className="flex flex-col gap-1">
                              <span className={`px-3 py-1 text-xs rounded-full inline-block ${
                                post.status === 'open' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {post.status === 'open' ? 'Open' : 'Closed'}
                              </span>
                              {post.isDeleted && (
                                <span className="px-3 py-1 text-xs rounded-full inline-block bg-red-100 text-red-800">
                                  Deleted
                                </span>
                              )}
                            </div>
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-600'>{formatDate(post.createdAt)}</td>
                          <td className='px-6 py-4 space-x-2'>
                            <button 
                              onClick={() => handleEditPost(post)} 
                              disabled={post.isDeleted}
                              className={`p-2 rounded-lg ${
                                post.isDeleted 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50'
                              }`}
                              title={post.isDeleted ? 'Cannot edit deleted jobs' : 'Edit job'}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDeleteClick('post', post._id)} 
                              disabled={post.isDeleted}
                              className={`p-2 rounded-lg ${
                                post.isDeleted 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-red-600 hover:text-red-900 hover:bg-red-50'
                              }`}
                              title={post.isDeleted ? 'Already deleted' : 'Delete job'}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {postsPagination && postsPagination.pages > 1 && (
                <PaginationControls
                  pagination={postsPagination}
                  onPageChange={handlePostsPageChange}
                  isLoading={loadingPosts}
                  isFetching={fetchingPosts}
                />
              )}
            </div>
          )}
          </main>
          <Footer variant="dashboard" />
        </div>
      </div>

      {showEditUserModal && editingUser && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-8 max-w-md w-full'>
            <h3 className='text-xl font-bold mb-4'>Edit User: {editingUser.name}</h3>
            <div className='space-y-4'>
              <div><label className='block text-sm font-medium mb-2'>Role</label><select value={editUserData.role} onChange={(e) => setEditUserData({...editUserData, role: e.target.value})} className='w-full px-4 py-2 border rounded-lg'><option value='job_seeker'>Job Seeker</option><option value='recruiter'>Recruiter</option><option value='admin'>Admin</option></select></div>
              <div><label className='block text-sm font-medium mb-2'>Status</label><select value={editUserData.isActive ? 'active' : 'suspended'} onChange={(e) => setEditUserData({...editUserData, isActive: e.target.value === 'active'})} className='w-full px-4 py-2 border rounded-lg'><option value='active'>Active</option><option value='suspended'>Suspended</option></select></div>
              <div><label className='block text-sm font-medium mb-2'>Reset Password (optional)</label><input type='password' value={editUserData.password} onChange={(e) => setEditUserData({...editUserData, password: e.target.value})} placeholder='Leave blank to keep current' className='w-full px-4 py-2 border rounded-lg' /></div>
            </div>
            <div className='flex space-x-4 mt-6'>
              <button onClick={handleSaveUser} className='flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700'>Save</button>
              <button onClick={() => setShowEditUserModal(false)} className='flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300'>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showEditPostModal && editingPost && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto'>
            <h3 className='text-xl font-bold mb-4'>Edit Post</h3>
            <div className='space-y-4'>
              <div><label className='block text-sm font-medium mb-2'>Title</label><input type='text' value={editPostData.title} onChange={(e) => setEditPostData({...editPostData, title: e.target.value})} className='w-full px-4 py-2 border rounded-lg' /></div>
              <div><label className='block text-sm font-medium mb-2'>Description</label><textarea value={editPostData.description} onChange={(e) => setEditPostData({...editPostData, description: e.target.value})} rows={4} className='w-full px-4 py-2 border rounded-lg' /></div>
              <div className='grid grid-cols-2 gap-4'><div><label className='block text-sm font-medium mb-2'>Company</label><input type='text' value={editPostData.company} onChange={(e) => setEditPostData({...editPostData, company: e.target.value})} className='w-full px-4 py-2 border rounded-lg' /></div><div><label className='block text-sm font-medium mb-2'>Location</label><input type='text' value={editPostData.location} onChange={(e) => setEditPostData({...editPostData, location: e.target.value})} className='w-full px-4 py-2 border rounded-lg' /></div></div>
            </div>
            <div className='flex space-x-4 mt-6'>
              <button onClick={handleSavePost} className='flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700'>Save</button>
              <button onClick={() => setShowEditPostModal(false)} className='flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300'>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && deleteTarget && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-8 max-w-md w-full'>
            <h3 className='text-xl font-bold mb-4 text-red-600'>Confirm Deletion</h3>
            <p className='mb-4'>Are you sure you want to delete this {deleteTarget.type}?</p>
            <div className='mb-4'><label className='block text-sm font-medium mb-2'>Reason (optional)</label><textarea value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} placeholder='e.g., Spam, inappropriate...' rows={3} className='w-full px-4 py-2 border rounded-lg' /></div>
            <div className='flex space-x-4'>
              <button onClick={handleConfirmDelete} className='flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700'>Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className='flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300'>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          localStorage.removeItem('token');
          localStorage.removeItem('loggedInUser');
          localStorage.removeItem('role');
          handleSuccess('User Logged out successfully');
          setTimeout(() => {
            navigate('/login', { replace: true });
          }, 1000);
        }}
        title="Logout Confirmation"
        message="Are you sure you want to logout? You will need to login again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
      />
    </div>
  );
}

export default AdminDashboard;
