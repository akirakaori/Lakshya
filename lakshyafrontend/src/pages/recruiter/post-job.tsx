import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout, LoadingSpinner } from '../../components';
import { useCreateJob, useUpdateJob, useJob } from '../../hooks';
import { toast } from 'react-toastify';
import SearchableSelect from '../../components/ui/searchable-select';

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

  const [formData, setFormData] = useState({
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
    skills: [] as string[],
    requirements: '',
    benefits: '',
    interviewRoundsRequired: 2, // Default to 2 rounds
  });

  const [newSkill, setNewSkill] = useState('');

  // Prefill form when editing
  useEffect(() => {
    if (isEditMode && jobData?.data) {
      const job = jobData.data;
      setFormData({
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
  }, [isEditMode, jobData]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name.startsWith('salary.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        salary: {
          ...prev.salary,
          [field]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const addSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()],
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title || !formData.description || !formData.companyName || !formData.location) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Prepare data
    const jobPayload = {
      ...formData,
      salary: {
        min: parseInt(formData.salary.min) || 0,
        max: parseInt(formData.salary.max) || 0,
        currency: formData.salary.currency,
      },
      skillsRequired: formData.skills,
      requirements: formData.requirements.split('\n').filter(r => r.trim()),
      benefits: formData.benefits.split('\n').filter(b => b.trim()),
      interviewRoundsRequired: parseInt(formData.interviewRoundsRequired.toString()) || 2,
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

        <form onSubmit={handleSubmit} className="space-y-6">
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
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleInputChange}
                  placeholder="e.g. Tech Corp"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Remote, New York, NY"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
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
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
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
                  name="interviewRoundsRequired"
                  value={formData.interviewRoundsRequired}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={1}>1 Round</option>
                  <option value={2}>2 Rounds (Recommended)</option>
                  <option value={3}>3 Rounds</option>
                  <option value={4}>4 Rounds</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Candidates must pass all {formData.interviewRoundsRequired} round{formData.interviewRoundsRequired > 1 ? 's' : ''} before being eligible for hire
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
                  name="salary.min"
                  value={formData.salary.min}
                  onChange={handleInputChange}
                  placeholder="50000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Salary</label>
                <input
                  type="number"
                  name="salary.max"
                  value={formData.salary.max}
                  onChange={handleInputChange}
                  placeholder="80000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <SearchableSelect
                  value={formData.salary.currency}
                  onChange={(value) => setFormData(prev => ({
                    ...prev,
                    salary: { ...prev.salary, currency: value }
                  }))}
                  options={CURRENCY_OPTIONS}
                  placeholder="Select currency"
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
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
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
              {formData.skills.map((skill, index) => (
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
              {formData.skills.length === 0 && (
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
                name="requirements"
                value={formData.requirements}
                onChange={handleInputChange}
                rows={5}
                placeholder="5+ years of experience in software development&#10;Bachelor's degree in Computer Science or related field&#10;Strong problem-solving skills"
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
                name="benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                rows={5}
                placeholder="Competitive salary and equity&#10;Health, dental, and vision insurance&#10;Flexible working hours and remote options&#10;Professional development budget"
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
