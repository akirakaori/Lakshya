import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner, EmptyState } from '../../components';
import { JobCard } from '../../components/jobs';
import { useSavedJobs, useRemoveSavedJob, useApplyForJob } from '../../hooks';
import type { Job } from '../../services';
import { toast } from 'react-toastify';

interface EasyApplyModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
}

const EasyApplyModal: React.FC<EasyApplyModalProps> = ({ job, isOpen, onClose }) => {
  const navigate = useNavigate();
  const applyMutation = useApplyForJob();

  if (!isOpen || !job) return null;

  const handleAnalyzeFirst = () => {
    navigate(`/jobs/${job._id}?action=analyze`);
    onClose();
  };

  const handleEasyApplyConfirm = async () => {
    const payload = {
      jobId: job._id,
      data: {},
    };

    // Debug: log payload before sending request
    console.log('[SavedJobs EasyApply] Submitting application payload:', payload);

    try {
      const response = await applyMutation.mutateAsync(payload);
      console.log('[SavedJobs EasyApply] Application submitted successfully:', response);
      toast.success('Application submitted successfully');
      onClose();
    } catch (err: unknown) {
      console.error('[SavedJobs EasyApply] Failed to submit application:', err);

      const errorMessage =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string'
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to submit application';

      toast.error(errorMessage);
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Apply Confirmation</h3>

        <p className="text-sm text-gray-700">
          Do you want to apply for this job before confirming your resume analysis?
        </p>
        <p className="mt-3 text-sm text-gray-500">
          You can still apply without analyzing your resume first.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleAnalyzeFirst}
            className="flex-1 px-4 py-2 rounded-lg border border-indigo-600 text-indigo-700 hover:bg-indigo-50 text-sm font-medium"
          >
            Analyze First
          </button>
          <button
            type="button"
            onClick={handleEasyApplyConfirm}
            disabled={applyMutation.isPending}
            className="flex-1 px-4 py-2 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-60 text-sm font-medium"
          >
            {applyMutation.isPending ? 'Applying...' : 'Easy Apply'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const SavedJobs: React.FC = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [showApplyModal, setShowApplyModal] = useState(false);
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
                    onClick={() => {
                      setSelectedJob(job);
                      setShowApplyModal(true);
                    }}
                    className="px-4 py-2 text-sm rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors"
                  >
                    Easy Apply
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
      <EasyApplyModal
        job={selectedJob}
        isOpen={showApplyModal}
        onClose={() => {
          setShowApplyModal(false);
          setSelectedJob(null);
        }}
      />
    </DashboardLayout>
  );
};

export default SavedJobs;
