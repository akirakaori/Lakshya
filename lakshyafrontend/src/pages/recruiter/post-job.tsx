import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner } from '../../components';
import { useCreateJob, useUpdateJob, useJob } from '../../hooks';
import { toast } from 'react-toastify';
import SearchableSelect from '../../components/ui/searchable-select';
import { useForm, Controller } from 'react-hook-form';

type JobFormData = {
  title: string;
  description: string;
  companyName: string;
  location: string;
  type: string;
  experienceLevel: string;
  salary: {
    min: string;
    max: string;
    currency: string;
  };
  skills: string[];
  requirements: string;
  benefits: string;
  interviewRoundsRequired: number;
};

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($) - US Dollar' },
  { value: 'EUR', label: 'EUR (€) - Euro' },
  { value: 'GBP', label: 'GBP (£) - British Pound' },
  { value: 'INR', label: 'INR (₹) - Indian Rupee' },
  { value: 'NPR', label: 'NPR (Rs) - Nepalese Rupee' },
  { value: 'JPY', label: 'JPY (¥) - Japanese Yen' },
  { value: 'CNY', label: 'CNY (¥) - Chinese Yuan' },
  { value: 'AUD', label: 'AUD ($) - Australian Dollar' },
  { value: 'CAD', label: 'CAD ($) - Canadian Dollar' },
];

const PostJob: React.FC = () => {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const isEditMode = !!jobId;
  
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const { data: jobData, isLoading: isLoadingJob } = useJob(jobId || '');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<JobFormData>({
    defaultValues: {
      title: '',
      description: '',
      companyName: '',
      location: '',
      type: 'full-time',
      experienceLevel: 'mid',
      salary: {
        min: '',
        max: '',
        currency: 'USD',
      },
      skills: [],
      requirements: '',
      benefits: '',
      interviewRoundsRequired: 2,
    },
  });

  const [newSkill, setNewSkill] = useState('');
  const skills = watch('skills');

  // Prefill form when editing
  useEffect(() => {
    if (isEditMode && jobData?.data) {
      const job = jobData.data;
      reset({
        title: job.title || '',
        description: job.description || '',
        companyName: job.companyName || '',
        location: job.location || '',
        type: job.type || job.jobType || 'full-time',
        experienceLevel: job.experienceLevel || 'mid',
        salary: {
          min: job.salary?.min?.toString() || '',
          max: job.salary?.max?.toString() || '',
          currency: job.salary?.currency || 'USD',
        },
        skills: job.skills || job.skillsRequired || [],
        requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : '',
        benefits: Array.isArray(job.benefits) ? job.benefits.join('\n') : '',
        interviewRoundsRequired: job.interviewRoundsRequired || 2,
      });
    }
  }, [isEditMode, jobData, reset]);

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setValue('skills', [...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setValue('skills', skills.filter(skill => skill !== skillToRemove));
  };

  const onSubmit = async (data: JobFormData) => {
    // Prepare data
    const jobPayload = {
      ...data,
      salary: {
        min: parseInt(data.salary.min) || 0,
        max: parseInt(data.salary.max) || 0,
        currency: data.salary.currency,
      },
      skillsRequired: data.skills,
      requirements: data.requirements.split('\n').filter(r => r.trim()),
      benefits: data.benefits.split('\n').filter(b => b.trim()),
      interviewRoundsRequired: parseInt(data.interviewRoundsRequired.toString()) || 2,
    };

    try {
      if (isEditMode && jobId) {
        await updateJobMutation.mutateAsync({ jobId, data: jobPayload });
        toast.success('Job updated successfully!');
      } else {
        await createJobMutation.mutateAsync(jobPayload);
        toast.success('Job posted successfully!');
      }
      navigate('/recruiter/manage-jobs');
    } catch {
      toast.error(isEditMode ? 'Failed to update job' : 'Failed to post job');
    }
  };

  // Show loading spinner while fetching job data in edit mode
  if (isEditMode && isLoadingJob) {
    return (
      <DashboardLayout variant="recruiter" title={isEditMode ? 'Edit Job' : 'Post New Job'}>
        <LoadingSpinner text="Loading job details..." />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout variant="recruiter" title={isEditMode ? 'Edit Job' : 'Post New Job'}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditMode ? 'Edit Job' : 'Post a New Job'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEditMode 
              ? 'Update the job details below.' 
              : 'Fill in the details below to create a new job posting.'}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Senior Software Engineer"
                  {...register('title', {
                    required: 'Job title is required',
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tech Corp"
                  {...register('companyName', {
                    required: 'Company name is required',
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.companyName && (
                  <p className="text-sm text-red-600 mt-1">{errors.companyName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Remote, New York, NY"
                  {...register('location', {
                    required: 'Location is required',
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.location && (
                  <p className="text-sm text-red-600 mt-1">{errors.location.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select
                  {...register('type')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                <select
                  {...register('experienceLevel')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="entry">Entry Level</option>
                  <option value="mid">Mid Level</option>
                  <option value="senior">Senior Level</option>
                  <option value="lead">Lead / Manager</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Interview Rounds Required
                  <span className="ml-2 text-xs text-gray-500">(How many rounds before hire?)</span>
                </label>
                <select
                  {...register('interviewRoundsRequired')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>1 Round</option>
                  <option value={2}>2 Rounds (Recommended)</option>
                  <option value={3}>3 Rounds</option>
                  <option value={4}>4 Rounds</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Candidates must pass all {watch('interviewRoundsRequired')} round{watch('interviewRoundsRequired') > 1 ? 's' : ''} before being eligible for hire
                </p>
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Salary Information</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Salary</label>
                <input
                  type="number"
                  placeholder="50000"
                  {...register('salary.min')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Salary</label>
                <input
                  type="number"
                  placeholder="80000"
                  {...register('salary.max', {
                    validate: value => {
                      const min = watch('salary.min');
                      if (min && value && parseInt(value) < parseInt(min)) {
                        return 'Maximum salary must be greater than minimum';
                      }
                      return true;
                    }
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {errors.salary?.max && (
                  <p className="text-sm text-red-600 mt-1">{errors.salary.max.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <Controller
                  name="salary.currency"
                  control={control}
                  render={({ field }) => (
                    <SearchableSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={CURRENCY_OPTIONS}
                      placeholder="Select currency"
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={6}
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                {...register('description', {
                  required: 'Job description is required',
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Required Skills</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                placeholder="Add a skill (e.g. React, Python, AWS)"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addSkill}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="ml-1 text-indigo-500 hover:text-indigo-700"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {skills.length === 0 && (
                <p className="text-gray-500 text-sm">No skills added yet. Add skills that are required for this position.</p>
              )}
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                List Requirements (one per line)
              </label>
              <textarea
                rows={5}
                placeholder="5+ years of experience in software development&#10;Bachelor's degree in Computer Science or related field&#10;Strong problem-solving skills"
                {...register('requirements')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Benefits</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                List Benefits (one per line)
              </label>
              <textarea
                rows={5}
                placeholder="Competitive salary and equity&#10;Health, dental, and vision insurance&#10;Flexible working hours and remote options&#10;Professional development budget"
                {...register('benefits')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/recruiter/manage-jobs')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createJobMutation.isPending || updateJobMutation.isPending}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isEditMode
                ? (updateJobMutation.isPending ? 'Updating...' : 'Update Job')
                : (createJobMutation.isPending ? 'Posting...' : 'Post Job')}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default PostJob;
