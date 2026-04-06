import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState } from '../../components';
import { useMyJobs, useSoftDeleteJob, useToggleJobStatus } from '../../hooks';
import { toast } from 'react-toastify';
import type { Job } from '../../services';
import { PaginationControls, PageSizeSelect } from '../../components/pagination';

const shellCard = 'rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900';
const labelText = 'text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400';

interface StatCardProps {
  label: string;
  value: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div className={`${shellCard} px-5 py-4`}>
    <p className={labelText}>{label}</p>
    <p className="mt-2 text-[34px] font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100">
      {value}
    </p>
  </div>
);

const ManageJobs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'all';

  const { data: jobsData, isLoading } = useMyJobs({
    page,
    limit,
    search: search.trim() || undefined
  });

  const softDeleteJobMutation = useSoftDeleteJob();
  const toggleStatusMutation = useToggleJobStatus();

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const jobs = jobsData?.data || [];
  const pagination = jobsData?.pagination;

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', newPage.toString());
      return prev;
    });
  };

  const handleLimitChange = (newLimit: number) => {
    setSearchParams((prev) => {
      prev.set('limit', newLimit.toString());
      prev.set('page', '1');
      return prev;
    });
  };

  const handleSearchChange = (val: string) => {
    setSearchParams((prev) => {
      if (val) prev.set('search', val);
      else prev.delete('search');
      prev.set('page', '1');
      return prev;
    });
  };

  const handleStatusChange = (val: string) => {
    setSearchParams((prev) => {
      if (val !== 'all') prev.set('status', val);
      else prev.delete('status');
      prev.set('page', '1');
      return prev;
    });
  };

  const filteredJobs = jobs.filter((job: Job) => {
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && job.isActive && !job.isDeleted) ||
      (statusFilter === 'inactive' && (!job.isActive || job.isDeleted));
    return matchesStatus;
  });

  const handleToggleStatus = async (jobId: string, currentStatus: boolean) => {
    try {
      await toggleStatusMutation.mutateAsync(jobId);
      toast.success(`Job ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch {
      toast.error('Failed to update job status');
    }
  };

  const handleSoftDelete = async (jobId: string) => {
    try {
      await softDeleteJobMutation.mutateAsync(jobId);
      toast.success('Job deleted successfully!');
      setDeleteConfirmId(null);
    } catch (error: unknown) {
      let message = 'Failed to delete job';
      if (error instanceof Error) {
        message = error.message;
      } else if (error && typeof error === 'object' && 'response' in error) {
        const response = (error as { response?: { data?: { message?: string } } }).response;
        message = response?.data?.message || message;
      }
      toast.error(message);
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatSalary = (salary: { min: number; max: number; currency: string }) => {
    if (!salary.min && !salary.max) return 'Not specified';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: salary.currency,
      maximumFractionDigits: 0,
    });
    return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
  };

  const totalJobs = jobsData?.pagination?.total || jobs.length;
  const activeJobs = jobs.filter((j: Job) => j.isActive && !j.isDeleted).length;
  const inactiveJobs = jobs.filter((j: Job) => !j.isActive && !j.isDeleted).length;
  const deletedJobs = jobs.filter((j: Job) => j.isDeleted).length;

  const getStatusBadge = (job: Job) => {
    if (job.isDeleted) {
      return 'border border-red-200 bg-red-50 text-red-700';
    }
    if (job.isActive) {
      return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
    }
    return 'border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
  };

  const getStatusLabel = (job: Job) => {
    if (job.isDeleted) return 'Deleted';
    if (job.isActive) return 'Active';
    return 'Inactive';
  };


  const secondaryBtn = 'inline-flex items-center justify-center rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800';
  const dangerBtn = 'inline-flex items-center justify-center rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100';

  if (isLoading) {
    return (
      <DashboardLayout variant="recruiter" title="Manage Jobs">
        <LoadingSpinner text="Loading your jobs..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="recruiter" title="Manage Jobs">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-[34px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Manage Jobs
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Review, update, and manage your current active and inactive job listings.
            </p>
          </div>

          <Link
            to="/recruiter/post-job"
            className="inline-flex items-center justify-center gap-2 rounded-sm border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post New Job
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Jobs" value={totalJobs} />
          <StatCard label="Active Postings" value={activeJobs} />
          <StatCard label="Inactive" value={inactiveJobs} />
          <StatCard label="Drafts / Deleted" value={deletedJobs} />
        </div>

        {/* Search / Filter */}
        <div className={`${shellCard} mb-6 p-4`}>
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
            <div className="relative flex-1">
              <svg
                className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by job title or keyword..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-3 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-200 outline-none transition-colors placeholder:text-slate-400 focus:border-[#3b4bb8]"
              />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row xl:items-center">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 outline-none transition-colors focus:border-[#3b4bb8]"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400">Show</span>
                <PageSizeSelect value={limit} onChange={handleLimitChange} />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner text="Loading your jobs..." />
        ) : filteredJobs.length === 0 ? (
          <EmptyState
            title={jobs.length === 0 ? 'No job posts yet' : 'No matching jobs'}
            description={
              jobs.length === 0
                ? 'Start recruiting by posting your first job.'
                : 'Try adjusting your search or filter criteria.'
            }
            action={
              jobs.length === 0 ? (
                <Link
                  to="/recruiter/post-job"
                  className="inline-flex rounded-sm border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]"
                >
                  Post a Job
                </Link>
              ) : (
                <button
                  onClick={() => setSearchParams({})}
                  className="rounded-sm border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]"
                >
                  Clear Filters
                </button>
              )
            }
          />
        ) : (
          <>
            {/* Job Cards */}
            <div className="space-y-4">
              {filteredJobs.map((job: Job) => (
                <div
                  key={job._id}
                  className={`${shellCard} overflow-hidden`}
                >
                  <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-sm border border-[#dfe4ff] bg-[#eef1ff] text-[#4a57c8]">
                        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="truncate text-[18px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                            {job.title}
                          </h3>
                          <span
                            className={`inline-flex items-center rounded-sm px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.06em] ${getStatusBadge(job)}`}
                          >
                            {getStatusLabel(job)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {job.location}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {job.type}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatSalary(job.salary)}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Posted {formatDate(job.createdAt)}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {job.skillsRequired?.slice(0, 4).map((skill: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center rounded-sm border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-400"
                            >
                              {skill}
                            </span>
                          ))}
                          {(job.skillsRequired?.length ?? 0) > 4 && (
                            <span className="inline-flex items-center px-1 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              +{(job.skillsRequired?.length ?? 0) - 4} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-col gap-2 lg:items-end">
                      <Link
                        to={`/recruiter/jobs/${job._id}/applications`}
                        className="inline-flex items-center justify-center rounded-sm border border-[#3b4bb8] bg-[#3b4bb8] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2e3a94]"
                      >
                        View Applications
                      </Link>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleStatus(job._id, job.isActive)}
                          disabled={toggleStatusMutation.isPending || job.isDeleted}
                          title={job.isDeleted ? 'Cannot toggle deleted jobs' : ''}
                          className={`${
                            job.isActive
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          } inline-flex items-center justify-center rounded-sm border px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          {job.isActive ? 'Deactivate' : 'Activate'}
                        </button>

                        <Link
                          to={`/recruiter/jobs/${job._id}/edit`}
                          title={job.isDeleted ? 'Cannot edit deleted jobs' : ''}
                          className={`inline-flex items-center justify-center rounded-sm border px-3 py-2 text-sm font-medium transition-colors ${
                            job.isDeleted
                              ? 'pointer-events-none cursor-not-allowed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-400'
                              : secondaryBtn
                          }`}
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() => setDeleteConfirmId(job._id)}
                          disabled={job.isDeleted}
                          title={job.isDeleted ? 'Already deleted' : ''}
                          className={`${dangerBtn} disabled:cursor-not-allowed disabled:opacity-50`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="mt-8 flex justify-center">
                <PaginationControls
                  pagination={pagination}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/45" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative w-full max-w-md rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-lg">
            <h2 className="mb-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Delete Job Post
            </h2>
            <p className="mb-6 text-sm leading-6 text-slate-600 dark:text-slate-400">
              Are you sure you want to delete this job post? The job will be marked as deleted and will no longer be visible to job seekers. Applications will be preserved.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSoftDelete(deleteConfirmId)}
                disabled={softDeleteJobMutation.isPending}
                className="flex-1 rounded-sm border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                {softDeleteJobMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageJobs;