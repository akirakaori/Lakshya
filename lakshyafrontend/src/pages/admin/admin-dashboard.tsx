import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { handleSuccess, handleError } from '../../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/api-client';
import { Footer } from '../../components';

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
  editedByAdmin: boolean;
  createdAt: string;
}

function AdminDashboard() {
  const [loggedInUser, setLoggedInUser] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [postSearchQuery, setPostSearchQuery] = useState('');
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
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch users with useQuery
  const { data: usersData, isLoading: loadingUsers } = useQuery<{ success: boolean; users: User[] }>({
    queryKey: ['admin-users'],
    queryFn: adminApi.getUsers,
  });

  const users = usersData?.users || [];

  // Fetch posts with useQuery
  const { data: postsData, isLoading: loadingPosts } = useQuery<{ success: boolean; posts: Post[]; total?: number }>({
    queryKey: ['admin-posts'],
    queryFn: adminApi.getPosts,
  });

  const posts = postsData?.posts || [];
  const totalPosts = postsData?.total || posts.length;

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: ({ userId, userData }: { userId: string; userData: any }) =>
      adminApi.updateUser(userId, userData),
    onSuccess: () => {
      handleSuccess('User updated successfully');
      setShowEditUserModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      handleError(error.message || 'Failed to update user');
    }
  });

  // Update post mutation
  const updatePostMutation = useMutation({
    mutationFn: ({ postId, postData }: { postId: string; postData: any }) =>
      adminApi.updatePost(postId, postData),
    onSuccess: () => {
      handleSuccess('Post updated successfully');
      setShowEditPostModal(false);
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
    onError: (error: any) => {
      handleError(error.message || 'Failed to update post');
    }
  });

  // Delete mutation (for both users and posts)
  const deleteMutation = useMutation({
    mutationFn: ({ type, id, reason }: { type: 'user' | 'post'; id: string; reason: string }) => {
      if (type === 'user') {
        return adminApi.deleteUser(id, reason);
      } else {
        return adminApi.deletePost(id, reason);
      }
    },
    onSuccess: (_, variables) => {
      handleSuccess(`${variables.type === 'user' ? 'User' : 'Post'} deleted successfully`);
      setShowDeleteConfirm(false);
      if (variables.type === 'user') {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      }
    },
    onError: (error: any) => {
      handleError(error.message || 'Failed to delete');
    }
  });

  useEffect(() => {
    setLoggedInUser(localStorage.getItem('loggedInUser') || 'Admin');
  }, []);

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
      reason: deleteReason 
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
    localStorage.removeItem('token');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('role');
    handleSuccess('User Logged out successfully');
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 1000);
  };

  const activeUsers = users.filter(u => u.isActive);
  const jobSeekers = activeUsers.filter(u => u.role === 'job_seeker');
  const recruiters = activeUsers.filter(u => u.role === 'recruiter');
  const openJobs = posts.filter(p => p.status === 'open');
  const closedJobs = posts.filter(p => p.status === 'closed');
  
  const stats = [
    { title: 'Total Users', value: activeUsers.length.toString(), description: 'Active users', icon: '', color: 'bg-blue-500' },
    { title: 'Job Seekers', value: jobSeekers.length.toString(), description: 'Active job seekers', icon: '', color: 'bg-green-500' },
    { title: 'Recruiters', value: recruiters.length.toString(), description: 'Active recruiters', icon: '', color: 'bg-purple-500' },
    { title: 'Open Jobs', value: openJobs.length.toString(), description: `${closedJobs.length} closed`, icon: '', color: 'bg-orange-500' },
  ];

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.company.toLowerCase().includes(postSearchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'open' && post.status === 'open') ||
      (statusFilter === 'closed' && post.status === 'closed');
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='flex h-screen bg-gray-50'>
      <aside className={`{${isSidebarOpen ? 'w-64' : 'w-20'} bg-gradient-to-b from-indigo-900 via-indigo-800 to-indigo-900 text-white transition-all duration-300 flex flex-col shadow-2xl`}>

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
          <button onClick={() => setActiveNav('dashboard')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {${activeNav === 'dashboard' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' /></svg>
            {isSidebarOpen && <span className='font-medium'>Dashboard</span>}
          </button>
          <button onClick={() => setActiveNav('users')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {${activeNav === 'users' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}>
            <svg className='w-6 h-6' fill='none' stroke='currentColor' viewBox='0 0 24 24'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' /></svg>
            {isSidebarOpen && <span className='font-medium'>Users</span>}
          </button>
          <button onClick={() => setActiveNav('posts')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 {${activeNav === 'posts' ? 'bg-white/20 shadow-lg' : 'hover:bg-white/10'}`}>
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
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                {stats.map((stat, index) => (
                  <div key={index} className='bg-white rounded-xl shadow-sm p-6 border border-gray-100'>
                    <div className={`w-12 h-12 {${stat.color} rounded-lg flex items-center justify-center text-2xl mb-4`}>{stat.icon}</div>
                    <h3 className='text-3xl font-bold text-gray-800 mb-2'>{stat.value}</h3>
                    <p className='text-sm font-semibold text-gray-600 mb-1'>{stat.title}</p>
                    <p className='text-xs text-gray-500'>{stat.description}</p>
                  </div>
                ))}
              </div>
              {/* User Management Section */}
              <div className='mb-8'>
                <h3 className='text-xl font-bold text-gray-800 mb-4'>User Management</h3>
                <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
                  <div className='p-6 border-b'>
                    <input type='text' placeholder='Search users...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='w-full px-4 py-3 border rounded-lg' />
                  </div>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className='bg-gray-50 border-b'>
                        <tr>
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
                          <tr><td colSpan={6} className='px-6 py-8 text-center text-gray-500'>Loading...</td></tr>
                        ) : filteredUsers.length === 0 ? (
                          <tr><td colSpan={6} className='px-6 py-8 text-center text-gray-500'>No users found</td></tr>
                        ) : filteredUsers.slice(0, 5).map((user) => (
                          <tr key={user._id} className='hover:bg-gray-50'>
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredUsers.length > 5 && (
                    <div className='p-4 border-t bg-gray-50 text-center'>
                      <button onClick={() => setActiveNav('users')} className='text-indigo-600 hover:text-indigo-900 font-medium'>View all {filteredUsers.length} users →</button>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Management Section */}
              <div>
                <h3 className='text-xl font-bold text-gray-800 mb-4'>Job Management Overview</h3>
                <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
                  <div className='p-6 border-b'>
                    <input type='text' placeholder='Search jobs...' value={postSearchQuery} onChange={(e) => setPostSearchQuery(e.target.value)} className='w-full px-4 py-3 border rounded-lg' />
                  </div>
                  <div className='overflow-x-auto'>
                    <table className='w-full'>
                      <thead className='bg-gray-50 border-b'>
                        <tr>
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
                          <tr><td colSpan={6} className='px-6 py-8 text-center text-gray-500'>Loading...</td></tr>
                        ) : filteredPosts.length === 0 ? (
                          <tr><td colSpan={6} className='px-6 py-8 text-center text-gray-500'>No jobs found</td></tr>
                        ) : filteredPosts.slice(0, 5).map((post) => (
                          <tr key={post._id} className='hover:bg-gray-50'>
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {filteredPosts.length > 5 && (
                    <div className='p-4 border-t bg-gray-50 text-center'>
                      <button onClick={() => setActiveNav('posts')} className='text-indigo-600 hover:text-indigo-900 font-medium'>View all {filteredPosts.length} posts →</button>
                    </div>
                  )}
                </div>
              </div>            </>
          )}

          {activeNav === 'users' && (
            <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
              <div className='p-6 border-b'>
                <input type='text' placeholder='Search users...' value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className='w-full px-4 py-3 pl-11 border rounded-lg' />
              </div>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b'>
                  <tr>
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
                    <tr><td colSpan={6} className='px-6 py-8 text-center text-gray-500'>Loading...</td></tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan={6} className='px-6 py-8 text-center text-gray-500'>No users found</td></tr>
                  ) : filteredUsers.map((user) => (
                    <tr key={user._id} className='hover:bg-gray-50'>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeNav === 'posts' && (
            <div className='bg-white rounded-xl shadow-sm border border-gray-100'>
              <div className='p-6 border-b'>
                <div className='flex flex-col md:flex-row gap-4'>
                  <input 
                    type='text' 
                    placeholder='Search jobs by title or company...' 
                    value={postSearchQuery} 
                    onChange={(e) => setPostSearchQuery(e.target.value)} 
                    className='flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent' 
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className='px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                  >
                    <option value='all'>All Status</option>
                    <option value='open'>Open</option>
                    <option value='closed'>Closed</option>
                  </select>
                </div>
                <div className='mt-3 text-sm text-gray-600'>
                  Showing {filteredPosts.length} of {totalPosts} jobs
                </div>
              </div>
              <table className='w-full'>
                <thead className='bg-gray-50 border-b'>
                  <tr>
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
                    <tr><td colSpan={6} className='px-6 py-8 text-center text-gray-500'>Loading...</td></tr>
                  ) : filteredPosts.length === 0 ? (
                    <tr><td colSpan={6} className='px-6 py-8 text-center text-gray-500'>No jobs found</td></tr>
                  ) : filteredPosts.map((post) => (
                    <tr key={post._id} className='hover:bg-gray-50'>
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
                  ))}
                </tbody>
              </table>
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
    </div>
  );
}

export default AdminDashboard;
