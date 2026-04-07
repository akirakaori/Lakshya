import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { handleSuccess, handleError, getFileUrl, getInitials } from '../../Utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/api-client';
import {
  Footer,
  PageSizeSelect,
  PaginationControls,
  ConfirmModal,
  type PaginationMeta,
} from '../../components';
import ThemeToggle from '../../components/ui/theme-toggle';
import lakshyaLogo from '../../assets/lakhsya-logo.svg';
import { useProfile } from '../../hooks';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

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

  // Profile data for avatar in header
  const { data: profileData } = useProfile();
  const adminProfile = profileData?.data;
  const adminAvatarUrl = getFileUrl(adminProfile?.profileImageUrl);
  const adminDisplayName = adminProfile?.fullName || adminProfile?.name || loggedInUser;
  const adminInitials = getInitials(adminDisplayName);

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
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'post'; id: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editUserData, setEditUserData] = useState({ role: '', isActive: true, password: '' });
  const [editPostData, setEditPostData] = useState({
    title: '',
    description: '',
    company: '',
    location: '',
    salary: '',
    jobType: '',
  });
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'users' || tab === 'posts' || tab === 'dashboard') {
      setActiveNav(tab);
      return;
    }
    setActiveNav('dashboard');
  }, [location.search]);

  const panelClass =
    'border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950';
  const inputClass =
    'w-full border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/10';
  const primaryButtonClass =
    'inline-flex items-center justify-center rounded-sm bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1D4ED8]';
  const secondaryButtonClass =
    'inline-flex items-center justify-center rounded-sm border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900';
  const iconButtonClass =
    'inline-flex h-10 w-10 items-center justify-center rounded-sm border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white';

  const getNavButtonClass = (navKey: string) =>
    `flex w-full items-center ${isSidebarOpen ? 'space-x-3 px-4' : 'justify-center'} rounded-sm py-3 text-sm font-medium transition-colors ${
      activeNav === navKey
        ? 'bg-[#2563EB] text-white'
        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white'
    }`;

  const getRoleBadgeClass = (role: string) => {
    if (role === 'admin') {
      return 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300';
    }
    if (role === 'recruiter') {
      return 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300';
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';
  };

  const getStatusBadgeClass = (isActive: boolean) =>
    isActive
      ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
      : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300';

  const getJobStatusBadgeClass = (status: string) =>
    status === 'open'
      ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200';

  // Fetch users with useQuery
  const { data: usersData, isLoading: loadingUsers, isFetching: fetchingUsers } = useQuery<{
    success: boolean;
    users: User[];
    pagination?: PaginationMeta;
  }>({
    queryKey: ['admin-users', { page: usersPage, limit: usersLimit, search: appliedUserSearch }],
    queryFn: () =>
      adminApi.getUsers({
        page: usersPage,
        limit: usersLimit,
        search: appliedUserSearch,
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
    queryFn: () =>
      adminApi.getUsers({
        page: previewUsersPage,
        limit: previewUsersLimit,
        search: appliedPreviewUsersSearch,
      }),
    enabled: activeNav === 'dashboard',
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
    queryKey: [
      'admin-posts',
      {
        page: postsPage,
        limit: postsLimit,
        search: appliedPostSearch,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      },
    ],
    queryFn: () =>
      adminApi.getPosts({
        page: postsPage,
        limit: postsLimit,
        search: appliedPostSearch,
        status: statusFilter !== 'all' ? statusFilter : undefined,
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
    queryFn: () =>
      adminApi.getPosts({
        page: previewJobsPage,
        limit: previewJobsLimit,
        search: appliedPreviewJobsSearch,
      }),
    enabled: activeNav === 'dashboard',
  });

  const previewJobs = previewJobsData?.posts || [];
  const previewJobsPagination = previewJobsData?.pagination;

  // Fetch analytics data
  const { data: analyticsRes, isLoading: loadingAnalytics, isFetching: fetchingAnalytics } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: adminApi.getAnalytics,
    staleTime: 60_000,
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
    },
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: ({
      postId,
      postData,
    }: {
      postId: string;
      postData: { title?: string; description?: string; company?: string; location?: string; salary?: string; jobType?: string };
    }) => adminApi.updatePost(postId, postData),
    onSuccess: () => {
      handleSuccess('Post updated successfully');
      setShowEditPostModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
    onError: (error: Error) => {
      handleError(error.message || 'Failed to update post');
    },
  });

  // Delete mutation (for both users and posts/jobs)
  const deleteMutation = useMutation({
    mutationFn: ({ type, id, reason }: { type: 'user' | 'post'; id: string; reason?: string }) => {
      if (type === 'user') {
        return adminApi.deleteUser(id, reason || '');
      }
      return adminApi.deleteJob(id);
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
    },
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
      password: '',
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
      jobType: post.jobType,
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
      reason: deleteTarget.type === 'user' ? deleteReason : undefined,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white">
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } flex shrink-0 flex-col border-r border-slate-200 bg-white text-slate-900 transition-all duration-300 dark:border-slate-800 dark:bg-slate-950 dark:text-white`}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-6 dark:border-slate-800">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center transition hover:opacity-90 ${
              isSidebarOpen ? 'space-x-3' : 'w-full justify-center'
            }`}
            type="button"
            aria-label="Go to Home"
          >
            <div className="flex h-10 w-10 items-center justify-center border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              <img src={lakshyaLogo} alt="Lakshya Logo" className="h-7 w-auto" />
            </div>
            {isSidebarOpen && <h1 className="text-xl font-bold text-slate-900 dark:text-white">Lakshya</h1>}
          </button>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <button onClick={() => setActiveNav('dashboard')} className={getNavButtonClass('dashboard')}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {isSidebarOpen && <span>Dashboard</span>}
          </button>

          <button onClick={() => setActiveNav('users')} className={getNavButtonClass('users')}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {isSidebarOpen && <span>Users</span>}
          </button>

          <button onClick={() => setActiveNav('posts')} className={getNavButtonClass('posts')}>
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {isSidebarOpen && <span>Posts</span>}
          </button>

          <button
            onClick={() => navigate('/admin/profile')}
            className={`flex w-full items-center ${isSidebarOpen ? 'space-x-3 px-4' : 'justify-center'} rounded-sm py-3 text-sm font-medium transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            {isSidebarOpen && <span>Profile</span>}
          </button>
        </nav>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${
              isSidebarOpen ? 'space-x-3 px-4' : 'justify-center'
            } rounded-sm py-3 text-slate-600 transition-all duration-200 hover:bg-red-600 hover:text-white dark:text-slate-300`}
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center space-x-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={iconButtonClass}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {activeNav === 'dashboard'
                    ? 'Overview'
                    : activeNav === 'users'
                    ? 'User Management'
                    : 'Post Management'}
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {activeNav === 'dashboard'
                    ? 'Monitor platform activity and core metrics'
                    : activeNav === 'users'
                    ? 'Manage platform users and access'
                    : 'Manage jobs and posting status'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <ThemeToggle />
              <button
                onClick={() => navigate('/admin/profile')}
                className="hidden rounded-sm border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-[#2563EB] transition-colors hover:bg-blue-50 hover:text-[#1D4ED8] md:inline-flex dark:border-slate-700 dark:bg-slate-950 dark:text-blue-400 dark:hover:bg-slate-900"
              >
                Profile
              </button>
              {/* Dynamic avatar — shows uploaded image or initials fallback */}
              <button
                onClick={() => navigate('/admin/profile')}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-[#2563EB] transition-opacity hover:opacity-80"
                title="Admin Profile"
              >
                {adminAvatarUrl ? (
                  <img
                    src={adminAvatarUrl}
                    alt={adminDisplayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#2563EB] text-sm font-bold text-white">
                    {adminInitials}
                  </div>
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <main className="min-h-screen p-8">
            {activeNav === 'dashboard' && (
              <>
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    A clear overview of platform growth, activity, and management.
                  </p>
                </div>

                {/* Top Stats Cards */}
                <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {loadingAnalytics ? (
                    <>
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className={`${panelClass} animate-pulse p-5`}>
                          <div className="mb-4 h-10 w-10 bg-slate-200 dark:bg-slate-800"></div>
                          <div className="mb-2 h-8 w-24 bg-slate-200 dark:bg-slate-800"></div>
                          <div className="mb-2 h-4 w-28 bg-slate-200 dark:bg-slate-800"></div>
                          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800"></div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className={`${panelClass} p-5`}>
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {parseFloat(analytics?.totals.userChange || '0') > 0 ? '+' : ''}
                            {analytics?.totals.userChange}%
                          </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                          {analytics?.totals.totalUsers.toLocaleString() || '0'}
                        </h3>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Total Users
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Active users on platform</p>
                      </div>

                      <div className={`${panelClass} p-5`}>
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {parseFloat(analytics?.totals.jobSeekerChange || '0') > 0 ? '+' : ''}
                            {analytics?.totals.jobSeekerChange}%
                          </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                          {analytics?.totals.totalJobSeekers.toLocaleString() || '0'}
                        </h3>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Job Seekers
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Active job seekers</p>
                      </div>

                      <div className={`${panelClass} p-5`}>
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {parseFloat(analytics?.totals.recruiterChange || '0') > 0 ? '+' : ''}
                            {analytics?.totals.recruiterChange}%
                          </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                          {analytics?.totals.totalRecruiters.toLocaleString() || '0'}
                        </h3>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Recruiters
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Active recruiters</p>
                      </div>

                      <div className={`${panelClass} p-5`}>
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex h-10 w-10 items-center justify-center bg-blue-50 text-[#2563EB] dark:bg-blue-500/10 dark:text-blue-400">
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {parseFloat(analytics?.totals.jobChange || '0') > 0 ? '+' : ''}
                            {analytics?.totals.jobChange}%
                          </span>
                        </div>
                        <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                          {analytics?.totals.openJobs.toLocaleString() || '0'}
                        </h3>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Open Jobs
                        </p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                          {analytics?.totals.closedJobs || 0} closed
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {!loadingAnalytics && analytics && (
                  <div className="mb-8 space-y-6">
                    {/* Secondary Stats */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                      <div className={`${panelClass} p-5`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Total Applications
                        </p>
                        <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                          {analytics.totals.totalApplications.toLocaleString()}
                        </p>
                      </div>

                      <div className={`${panelClass} p-5`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Applications Today
                        </p>
                        <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                          {analytics.totals.applicationsToday.toLocaleString()}
                        </p>
                      </div>

                      <div className={`${panelClass} p-5`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Total Jobs Live
                        </p>
                        <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
                          {analytics.totals.openJobs.toLocaleString()}
                        </p>
                      </div>

                      <div className={`${panelClass} p-5`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                          Top Skill In Demand
                        </p>
                        <p className="mt-3 text-2xl font-bold capitalize text-slate-900 dark:text-white">
                          {analytics.topSkills[0]?.skill || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                      <div className={`${panelClass} p-6`}>
                        <div className="mb-5 flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Applications Trend</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Daily incoming applications in the last 30 days
                            </p>
                          </div>
                          {fetchingAnalytics && (
                            <span className="text-xs text-[#2563EB]">Refreshing...</span>
                          )}
                        </div>

                        <ResponsiveContainer width="100%" height={260}>
                          <LineChart data={analytics.trend14d}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="date"
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              tickFormatter={(value) => {
                                const date = new Date(value);
                                return `${date.getMonth() + 1}/${date.getDate()}`;
                              }}
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '2px',
                                fontSize: '12px',
                              }}
                              labelFormatter={(value) => {
                                const date = new Date(value);
                                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                              }}
                            />
                            <Line
                              type="monotone"
                              dataKey="count"
                              stroke="#2563EB"
                              strokeWidth={2}
                              dot={{ fill: '#2563EB', r: 3 }}
                              activeDot={{ r: 5 }}
                              name="New Apps"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className={`${panelClass} p-6`}>
                        <div className="mb-5">
                          <h3 className="text-base font-bold text-slate-900 dark:text-white">Popular Job Categories</h3>
                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Based on application volume
                          </p>
                        </div>

                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={analytics.topJobs} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis type="category" dataKey="title" tick={{ fontSize: 11, fill: '#64748b' }} width={120} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '2px',
                                fontSize: '12px',
                              }}
                            />
                            <Bar dataKey="count" fill="#2563EB" radius={[0, 2, 2, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Skills and Recruiter Activity */}
                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                      <div className={`${panelClass} p-6`}>
                        <div className="mb-5 flex items-center justify-between gap-4">
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Top Skills in Demand</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Extracted from top active job postings
                            </p>
                          </div>
                          <button
                            onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })}
                            className="text-sm font-medium text-[#2563EB] transition hover:text-[#1D4ED8]"
                          >
                            Refresh
                          </button>
                        </div>

                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart data={analytics.topSkills}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                              dataKey="skill"
                              tick={{ fontSize: 11, fill: '#64748b' }}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '2px',
                                fontSize: '12px',
                              }}
                            />
                            <Bar dataKey="count" fill="#2563EB" radius={[2, 2, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className={`${panelClass} overflow-hidden`}>
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                          <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-white">Recent Recruiter Activity</h3>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Snapshot of recruiter engagement and activity
                            </p>
                          </div>
                          <div className="hidden gap-2 md:flex">
                            <button className={secondaryButtonClass}>All Recruiters</button>
                            <button className={secondaryButtonClass}>Active Only</button>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[720px]">
                            <thead className="bg-slate-50 dark:bg-slate-900/60">
                              <tr className="border-b border-slate-200 dark:border-slate-800">
                                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Recruiter
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Jobs Posted
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Applications
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                              {analytics.recruiterActivity.slice(0, 5).map((recruiter, idx) => (
                                <tr key={idx} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white">
                                        {recruiter.recruiterName.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                          {recruiter.recruiterName}
                                        </p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                          {recruiter.recruiterEmail}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">
                                    {recruiter.jobsPosted}
                                  </td>
                                  <td className="px-6 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">
                                    {recruiter.applicationsReceived.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                    <span
                                      className={`inline-flex px-2 py-1 text-xs font-medium ${
                                        recruiter.status === 'Active'
                                          ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
                                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                      }`}
                                    >
                                      {recruiter.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {analytics.recruiterActivity.length > 5 && (
                          <div className="border-t border-slate-200 px-6 py-3 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                            Showing 5 of {analytics.recruiterActivity.length} recruiters
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* User Management Section */}
                <div className="mb-8">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">User Management</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Review platform users, roles, and account statuses.
                    </p>
                  </div>

                  <div className={panelClass}>
                    <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <input
                          type="text"
                          placeholder="Search users..."
                          value={previewUsersSearch}
                          onChange={(e) => setPreviewUsersSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleApplyPreviewUsersSearch();
                            }
                          }}
                          className={inputClass}
                        />
                        <button onClick={handleApplyPreviewUsersSearch} className={primaryButtonClass}>
                          Apply Search
                        </button>
                        {appliedPreviewUsersSearch && (
                          <button onClick={handleClearPreviewUsersSearch} className={secondaryButtonClass}>
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between dark:border-slate-800">
                      <PageSizeSelect
                        value={previewUsersLimit}
                        onChange={handlePreviewUsersLimitChange}
                        options={[5, 10, 15, 20]}
                        disabled={loadingPreviewUsers}
                      />
                      {previewUsersPagination && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Total users: <span className="font-medium text-slate-900 dark:text-white">{previewUsersPagination.total}</span>
                          {fetchingPreviewUsers && (
                            <span className="ml-2 text-[#2563EB]">Updating...</span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[860px]">
                        <thead className="bg-slate-50 dark:bg-slate-900/60">
                          <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">S.N.</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {loadingPreviewUsers ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                Loading...
                              </td>
                            </tr>
                          ) : previewUsers.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                No users found
                              </td>
                            </tr>
                          ) : (
                            previewUsers.map((user, index) => {
                              const serial = (previewUsersPage - 1) * previewUsersLimit + index + 1;
                              return (
                                <tr key={user._id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{serial}</td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm text-slate-600 dark:text-slate-300">{user.email}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex px-3 py-1 text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                                      {user.role}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex px-3 py-1 text-xs font-medium ${getStatusBadgeClass(user.isActive)}`}>
                                      {user.isActive ? 'Active' : 'Suspended'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {formatDate(user.createdAt)}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEditUser(user)}
                                        className="rounded-sm px-3 py-2 text-sm font-medium text-[#2563EB] transition hover:bg-blue-50 hover:text-[#1D4ED8] dark:text-blue-400 dark:hover:bg-slate-900"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClick('user', user._id)}
                                        className="rounded-sm px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {previewUsersPagination && previewUsersPagination.pages > 1 && (
                      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                        <PaginationControls
                          pagination={previewUsersPagination}
                          onPageChange={handlePreviewUsersPageChange}
                          isLoading={loadingPreviewUsers}
                          isFetching={fetchingPreviewUsers}
                        />
                      </div>
                    )}

                    <div className="border-t border-slate-200 px-5 py-4 text-center dark:border-slate-800">
                      <button
                        onClick={() => setActiveNav('users')}
                        className="text-sm font-medium text-[#2563EB] transition hover:text-[#1D4ED8]"
                      >
                        View full users list
                      </button>
                    </div>
                  </div>
                </div>

                {/* Job Management Section */}
                <div>
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Job Management Overview</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Review jobs, creators, status, and posting activity.
                    </p>
                  </div>

                  <div className={panelClass}>
                    <div className="border-b border-slate-200 p-5 dark:border-slate-800">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center">
                        <input
                          type="text"
                          placeholder="Search jobs..."
                          value={previewJobsSearch}
                          onChange={(e) => setPreviewJobsSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleApplyPreviewJobsSearch();
                            }
                          }}
                          className={inputClass}
                        />
                        <button onClick={handleApplyPreviewJobsSearch} className={primaryButtonClass}>
                          Apply Search
                        </button>
                        {appliedPreviewJobsSearch && (
                          <button onClick={handleClearPreviewJobsSearch} className={secondaryButtonClass}>
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between dark:border-slate-800">
                      <PageSizeSelect
                        value={previewJobsLimit}
                        onChange={handlePreviewJobsLimitChange}
                        options={[5, 10, 15, 20]}
                        disabled={loadingPreviewJobs}
                      />
                      {previewJobsPagination && (
                        <span className="text-sm text-slate-500 dark:text-slate-400">
                          Total jobs: <span className="font-medium text-slate-900 dark:text-white">{previewJobsPagination.total}</span>
                          {fetchingPreviewJobs && (
                            <span className="ml-2 text-[#2563EB]">Updating...</span>
                          )}
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px]">
                        <thead className="bg-slate-50 dark:bg-slate-900/60">
                          <tr className="border-b border-slate-200 dark:border-slate-800">
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">S.N.</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Posted By</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {loadingPreviewJobs ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                Loading...
                              </td>
                            </tr>
                          ) : previewJobs.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                                No jobs found
                              </td>
                            </tr>
                          ) : (
                            previewJobs.map((post, index) => {
                              const serial = (previewJobsPage - 1) * previewJobsLimit + index + 1;
                              return (
                                <tr key={post._id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                  <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{serial}</td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{post.title}</div>
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{post.jobType}</div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="text-sm font-medium text-slate-900 dark:text-white">{post.company}</div>
                                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{post.location}</div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {post.createdByName}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`inline-flex px-3 py-1 text-xs font-medium ${getJobStatusBadgeClass(post.status)}`}>
                                      {post.status === 'open' ? 'Open' : 'Closed'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                    {formatDate(post.createdAt)}
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleEditPost(post)}
                                        className="rounded-sm px-3 py-2 text-sm font-medium text-[#2563EB] transition hover:bg-blue-50 hover:text-[#1D4ED8] dark:text-blue-400 dark:hover:bg-slate-900"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeleteClick('post', post._id)}
                                        className="rounded-sm px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>

                    {previewJobsPagination && previewJobsPagination.pages > 1 && (
                      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
                        <PaginationControls
                          pagination={previewJobsPagination}
                          onPageChange={handlePreviewJobsPageChange}
                          isLoading={loadingPreviewJobs}
                          isFetching={fetchingPreviewJobs}
                        />
                      </div>
                    )}

                    <div className="border-t border-slate-200 px-5 py-4 text-center dark:border-slate-800">
                      <button
                        onClick={() => setActiveNav('posts')}
                        className="text-sm font-medium text-[#2563EB] transition hover:text-[#1D4ED8]"
                      >
                        View full jobs list
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeNav === 'users' && (
              <div className={panelClass}>
                <div className="border-b border-slate-200 p-6 dark:border-slate-800">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Users</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Search, review, and manage platform users.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 md:flex-row">
                      <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyUserSearch()}
                        className={inputClass}
                      />
                      <div className="flex gap-2">
                        <button onClick={handleApplyUserSearch} className={primaryButtonClass}>
                          Apply Search
                        </button>
                        {appliedUserSearch && (
                          <button onClick={handleClearUserSearch} className={secondaryButtonClass}>
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <PageSizeSelect value={usersLimit} onChange={handleUsersLimitChange} disabled={loadingUsers} />
                      {usersPagination && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {fetchingUsers && <span className="mr-2 text-[#2563EB]">Updating...</span>}
                          Total: <span className="font-medium text-slate-900 dark:text-white">{usersPagination.total}</span> users
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead className="bg-slate-50 dark:bg-slate-900/60">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="w-20 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">S.N.</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Joined</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loadingUsers ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                            Loading...
                          </td>
                        </tr>
                      ) : users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user, index) => {
                          const serial = (usersPage - 1) * usersLimit + index + 1;
                          return (
                            <tr key={user._id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{serial}</td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm text-slate-600 dark:text-slate-300">{user.email}</div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-3 py-1 text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                                  {user.role}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex px-3 py-1 text-xs font-medium ${getStatusBadgeClass(user.isActive)}`}>
                                  {user.isActive ? 'Active' : 'Suspended'}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                {formatDate(user.createdAt)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditUser(user)}
                                    className="rounded-sm px-3 py-2 text-sm font-medium text-[#2563EB] transition hover:bg-blue-50 hover:text-[#1D4ED8] dark:text-blue-400 dark:hover:bg-slate-900"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick('user', user._id)}
                                    className="rounded-sm px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

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
              <div className={panelClass}>
                <div className="border-b border-slate-200 p-6 dark:border-slate-800">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Posts</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Search, filter, and manage all job posts.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 md:flex-row">
                      <input
                        type="text"
                        placeholder="Search jobs by title or company..."
                        value={postSearchQuery}
                        onChange={(e) => setPostSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleApplyPostSearch()}
                        className={inputClass}
                      />
                      <select
                        value={statusFilter}
                        onChange={(e) => handleStatusFilterChange(e.target.value)}
                        className={`${inputClass} md:w-48`}
                      >
                        <option value="all">All Status</option>
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                      </select>
                      <div className="flex gap-2">
                        <button onClick={handleApplyPostSearch} className={primaryButtonClass}>
                          Apply Search
                        </button>
                        {appliedPostSearch && (
                          <button onClick={handleClearPostSearch} className={secondaryButtonClass}>
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <PageSizeSelect value={postsLimit} onChange={handlePostsLimitChange} disabled={loadingPosts} />
                      {postsPagination && (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {fetchingPosts && <span className="mr-2 text-[#2563EB]">Updating...</span>}
                          Total: <span className="font-medium text-slate-900 dark:text-white">{postsPagination.total}</span> jobs
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px]">
                    <thead className="bg-slate-50 dark:bg-slate-900/60">
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="w-20 px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">S.N.</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Company</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Posted By</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {loadingPosts ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                            Loading...
                          </td>
                        </tr>
                      ) : posts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                            No jobs found
                          </td>
                        </tr>
                      ) : (
                        posts.map((post, index) => {
                          const serial = (postsPage - 1) * postsLimit + index + 1;
                          return (
                            <tr key={post._id} className="transition hover:bg-slate-50 dark:hover:bg-slate-900/50">
                              <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">{serial}</td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">{post.title}</div>
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{post.jobType}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-slate-900 dark:text-white">{post.company}</div>
                                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{post.location}</div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                {post.createdByName}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1.5">
                                  <span className={`inline-flex w-fit px-3 py-1 text-xs font-medium ${getJobStatusBadgeClass(post.status)}`}>
                                    {post.status === 'open' ? 'Open' : 'Closed'}
                                  </span>
                                  {post.isDeleted && (
                                    <span className="inline-flex w-fit bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
                                      Deleted
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                                {formatDate(post.createdAt)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleEditPost(post)}
                                    disabled={post.isDeleted}
                                    className={`rounded-sm px-3 py-2 text-sm font-medium transition ${
                                      post.isDeleted
                                        ? 'cursor-not-allowed text-slate-400 dark:text-slate-500'
                                        : 'text-[#2563EB] hover:bg-blue-50 hover:text-[#1D4ED8] dark:text-blue-400 dark:hover:bg-slate-900'
                                    }`}
                                    title={post.isDeleted ? 'Cannot edit deleted jobs' : 'Edit job'}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteClick('post', post._id)}
                                    disabled={post.isDeleted}
                                    className={`rounded-sm px-3 py-2 text-sm font-medium transition ${
                                      post.isDeleted
                                        ? 'cursor-not-allowed text-slate-400 dark:text-slate-500'
                                        : 'text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-300 dark:hover:bg-red-500/10'
                                    }`}
                                    title={post.isDeleted ? 'Already deleted' : 'Delete job'}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit User</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{editingUser.name}</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Role</label>
                <select
                  value={editUserData.role}
                  onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                  className={inputClass}
                >
                  <option value="job_seeker">Job Seeker</option>
                  <option value="recruiter">Recruiter</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
                <select
                  value={editUserData.isActive ? 'active' : 'suspended'}
                  onChange={(e) => setEditUserData({ ...editUserData, isActive: e.target.value === 'active' })}
                  className={inputClass}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Reset Password (optional)
                </label>
                <input
                  type="password"
                  value={editUserData.password}
                  onChange={(e) => setEditUserData({ ...editUserData, password: e.target.value })}
                  placeholder="Leave blank to keep current"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button onClick={handleSaveUser} className={`${primaryButtonClass} flex-1`}>
                Save
              </button>
              <button onClick={() => setShowEditUserModal(false)} className={`${secondaryButtonClass} flex-1`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditPostModal && editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit Post</h3>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Update job information.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">Title</label>
                <input
                  type="text"
                  value={editPostData.title}
                  onChange={(e) => setEditPostData({ ...editPostData, title: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Description
                </label>
                <textarea
                  value={editPostData.description}
                  onChange={(e) => setEditPostData({ ...editPostData, description: e.target.value })}
                  rows={4}
                  className={`${inputClass} min-h-[120px] py-3`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Company
                  </label>
                  <input
                    type="text"
                    value={editPostData.company}
                    onChange={(e) => setEditPostData({ ...editPostData, company: e.target.value })}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editPostData.location}
                    onChange={(e) => setEditPostData({ ...editPostData, location: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-7 flex gap-3">
              <button onClick={handleSavePost} className={`${primaryButtonClass} flex-1`}>
                Save
              </button>
              <button onClick={() => setShowEditPostModal(false)} className={`${secondaryButtonClass} flex-1`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md border border-slate-200 bg-white p-7 shadow-xl dark:border-slate-800 dark:bg-slate-950">
            <h3 className="text-xl font-bold text-red-600 dark:text-red-400">Confirm Deletion</h3>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Are you sure you want to delete this {deleteTarget.type}?
            </p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Reason (optional)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="e.g., Spam, inappropriate..."
                rows={3}
                className={`${inputClass} min-h-[110px] py-3`}
              />
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={handleConfirmDelete}
                className="inline-flex flex-1 items-center justify-center rounded-sm bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Delete
              </button>
              <button onClick={() => setShowDeleteConfirm(false)} className={`${secondaryButtonClass} flex-1`}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
