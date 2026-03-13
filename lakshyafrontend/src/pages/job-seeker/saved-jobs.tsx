import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState } from '../../components';
import { JobCard } from '../../components/jobs';
import { useSavedJobs, useRemoveSavedJob } from '../../hooks';
import type { Job } from '../../services';
import { toast } from 'react-toastify';

const SavedJobs: React.FC = () => {
  const { data, isLoading, isFetching, isError } = useSavedJobs();
  const removeSavedJobMutation = useRemoveSavedJob();
  const navigate = useNavigate();

  const savedJobs: Job[] = data?.data ?? [];

  const handleRemove = async (jobId: string) => {
    try {
      await removeSavedJobMutation.mutateAsync(jobId);
      toast.success('Removed from saved jobs');
    } catch {
      toast.error('Failed to remove saved job');
    }
  };

  const handleApply = (jobId: string) => {
    navigate(`/jobs/${jobId}?action=apply`);
  };

  return (
    <DashboardLayout variant="job-seeker" title="Saved Jobs">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Saved Jobs</h1>
            <p className="text-sm text-gray-500 mt-1">
              Jobs you have bookmarked to review or apply later.
            </p>
          </div>
        </div>

        {isLoading || isFetching ? (
          <LoadingSpinner text="Loading your saved jobs..." />
        ) : isError ? (
          <EmptyState
            title="Failed to load saved jobs."
            description="Please try again in a moment."
            action={
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Retry
              </button>
            }
          />
        ) : savedJobs.length === 0 ? (
          <EmptyState
            title="You haven't saved any jobs yet."
            description="Browse jobs and click the heart icon to save jobs you are interested in."
            action={
              <Link
                to="/browse-jobs"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Browse Jobs
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {savedJobs.map((job) => (
              <div key={job._id} className="flex flex-col gap-3">
                <JobCard job={job} />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/jobs/${job._id}`)}
                    className="px-4 py-2 text-sm rounded-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApply(job._id)}
                    className="px-4 py-2 text-sm rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    Apply Now
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(job._id)}
                    className="px-4 py-2 text-sm rounded-full border border-red-400 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SavedJobs;
