import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DashboardLayout, JobCard, LoadingSpinner, EmptyState, JobMatchPanel } from '../../components';
import { useJob, useJobs, useApplyForJob, useHasApplied } from '../../hooks';
import { useAuth } from '../../context/auth-context';
import { toast } from 'react-toastify';
import type { Job } from '../../services';

const formatSalary = (salary: Job['salary']) => {
  if (!salary) return null;
  if (typeof salary === 'string') return salary;
  if (!salary.min && !salary.max) return null;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: salary.currency || 'USD',
    maximumFractionDigits: 0,
  });
  return `${formatter.format(salary.min)} - ${formatter.format(salary.max)}`;
};

const JobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [coverLetter, setCoverLetter] = useState('');
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Guard: Invalid jobId parameter
  if (!jobId) {
    return (
      <DashboardLayout variant="job-seeker" title="Job Details">
        <EmptyState
          title="Invalid Job"
          description="The job link is invalid or incomplete."
          action={
            <Link
              to="/job-seeker/browse-jobs"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Jobs
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  const { data: jobData, isLoading, error } = useJob(jobId);
  const { data: relatedJobsData } = useJobs({ limit: 4 });
  const applyMutation = useApplyForJob();
  const hasApplied = useHasApplied(jobId);
  const { user } = useAuth();

  const job = jobData?.data;
  const relatedJobs = relatedJobsData?.data?.filter((j: Job) => j._id !== jobId).slice(0, 4) || [];

  const isJobSeeker = user?.role === 'job_seeker';

  const handleApply = async () => {
    if (!jobId) return;
    
    try {
      await applyMutation.mutateAsync({
        jobId,
        data: { coverLetter: coverLetter || undefined }
      });
      toast.success('Application submitted successfully!');
      setShowApplyModal(false);
      setCoverLetter('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout variant="job-seeker" title="Job Details">
        <LoadingSpinner text="Loading job details..." />
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout variant="job-seeker" title="Job Details">
        <EmptyState
          title="Job not found"
          description="The job you're looking for doesn't exist or has been removed."
          action={
            <Link
              to="/job-seeker/browse-jobs"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Jobs
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  // Check if job is deleted or inactive
  const isJobInactive = job.isDeleted || !job.isActive;

  return (
    <DashboardLayout variant="job-seeker" title="Job Details">
      <div className="max-w-7xl mx-auto">
        {/* Inactive Job Warning */}
        {isJobInactive && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-yellow-900 font-semibold">This job is no longer active</h3>
                <p className="text-yellow-700 text-sm mt-1">
                  {job.isDeleted 
                    ? "This job post has been removed by the employer and is no longer accepting applications."
                    : "This job is currently inactive and not accepting new applications."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Back Link */}
        <Link
          to="/job-seeker/browse-jobs"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Jobs
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Job Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                  <div className="flex items-center gap-2 mt-2 text-gray-600">
                    <span>{job.companyName}</span>
                    <span>•</span>
                    <span>{job.location}</span>
                    {formatSalary(job.salary) && (
                      <>
                        <span>•</span>
                        <span>{formatSalary(job.salary)}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    job.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {job.status === 'open' ? 'Active' : 'Closed'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{job.jobType}</span>
                <span className="text-sm text-gray-500">
                  Posted {new Date(job.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
              <div className="prose prose-sm max-w-none text-gray-600">
                {job.description.split('\n').map((paragraph: string, index: number) => (
                  <p key={index} className="mb-3">{paragraph}</p>
                ))}
              </div>
            </div>

            {/* Required Skills */}
            {job.skillsRequired && job.skillsRequired.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skillsRequired.map((skill: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Button */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              {isJobInactive ? (
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    This job is no longer available
                  </div>
                </div>
              ) : hasApplied || applyMutation.isSuccess ? (
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Already Applied
                  </div>
                  <p className="text-sm text-gray-500 mt-2">You have already submitted your application for this job.</p>
                </div>
              ) : job.status === 'closed' ? (
                <div className="text-center">
                  <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                    This position is no longer accepting applications
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowApplyModal(true)}
                  className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium text-lg"
                >
                  Apply Now
                </button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Company Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About {job.companyName}</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <span className="text-indigo-600 font-bold text-2xl">
                    {job.companyName?.charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{job.companyName}</h4>
                  <p className="text-sm text-gray-500">Software Development</p>
                  <p className="text-sm text-gray-500">50-200 employees</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                A leading company dedicated to developing cutting-edge solutions for global and local clients.
              </p>
            </div>

            {/* AI Match Score — real analysis */}
            {isJobSeeker && jobId && (
              <JobMatchPanel jobId={jobId} />
            )}
          </div>
        </div>

        {/* Related Jobs */}
        {relatedJobs.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Related Jobs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedJobs.map((relatedJob: Job) => (
                <JobCard key={relatedJob._id} job={relatedJob} showMatchScore />
              ))}
            </div>
          </div>
        )}

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-lg w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Apply for {job.title}</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter (Optional)
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={5}
                  placeholder="Write a brief cover letter explaining why you're a great fit for this role..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={applyMutation.isPending}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {applyMutation.isPending ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobDetails;
