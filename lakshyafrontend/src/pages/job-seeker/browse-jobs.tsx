import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { DashboardLayout, JobCard, JobFilter, LoadingSpinner, EmptyState, ActiveFilters, Footer, PageSizeSelect, PaginationControls, type PaginationMeta } from '../../components';
import { useJobs, useJobMatchScores, useMyApplications } from '../../hooks';
import { useAuth } from '../../context/auth-context';
import type { Application, JobFilters } from '../../services';
import ThemeToggle from '../../components/ui/theme-toggle';
import lakshyaLogo from '../../assets/lakhsya-logo.svg';

const DEFAULT_FILTERS: JobFilters = {
  page: 1,
  limit: 12,
};

const urlParamsToFilters = (params: URLSearchParams): JobFilters => {
  const filters: JobFilters = { ...DEFAULT_FILTERS };

  if (params.get('keyword')) filters.keyword = params.get('keyword')!;
  if (params.get('category')) filters.category = params.get('category')!;
  if (params.get('jobType')) filters.jobType = params.get('jobType')!;
  if (params.get('remoteType')) filters.remoteType = params.get('remoteType')!;
  if (params.get('companySize')) filters.companySize = params.get('companySize')!;
  if (params.get('location')) filters.location = params.get('location')!;
  if (params.get('salaryMin')) filters.salaryMin = parseInt(params.get('salaryMin')!);
  if (params.get('salaryMax')) filters.salaryMax = parseInt(params.get('salaryMax')!);
  if (params.get('postedWithinDays')) filters.postedWithinDays = parseInt(params.get('postedWithinDays')!);
  if (params.get('aiMatchMin')) filters.aiMatchMin = parseInt(params.get('aiMatchMin')!);
  if (params.get('page')) filters.page = parseInt(params.get('page')!);

  const expLevels = params.getAll('experienceLevel');
  if (expLevels.length > 0) filters.experienceLevels = expLevels;

  return filters;
};

const filtersToUrlParams = (filters: JobFilters): URLSearchParams => {
  const params = new URLSearchParams();

  if (filters.keyword) params.set('keyword', filters.keyword);
  if (filters.category) params.set('category', filters.category);
  if (filters.jobType) params.set('jobType', filters.jobType);
  if (filters.remoteType) params.set('remoteType', filters.remoteType);
  if (filters.companySize) params.set('companySize', filters.companySize);
  if (filters.location) params.set('location', filters.location);
  if (filters.salaryMin) params.set('salaryMin', filters.salaryMin.toString());
  if (filters.salaryMax) params.set('salaryMax', filters.salaryMax.toString());
  if (filters.postedWithinDays && filters.postedWithinDays > 0) params.set('postedWithinDays', filters.postedWithinDays.toString());
  if (filters.aiMatchMin && filters.aiMatchMin > 0) params.set('aiMatchMin', filters.aiMatchMin.toString());
  if (filters.page && filters.page > 1) params.set('page', filters.page.toString());

  if (filters.experienceLevels?.length) {
    filters.experienceLevels.forEach(level => params.append('experienceLevel', level));
  }

  return params;
};

const BrowseJobs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isAuthenticatedJobSeeker = user?.role === 'job_seeker';
  const initialFilters = urlParamsToFilters(searchParams);
  const [appliedFilters, setAppliedFilters] = useState<JobFilters>(initialFilters);
  const [searchKeyword, setSearchKeyword] = useState(initialFilters.keyword || '');

  useEffect(() => {
    console.log('='.repeat(80));
    console.log('[BrowseJobs] Applied filters changed - will trigger useJobs');
    console.log('[BrowseJobs] appliedFilters:', JSON.stringify(appliedFilters, null, 2));
    console.log('[BrowseJobs] Filter count:', Object.keys(appliedFilters).length);
    console.log('[BrowseJobs] Active filters:', Object.entries(appliedFilters).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    console.log('='.repeat(80));
  }, [appliedFilters]);

  console.log('[BrowseJobs] About to call useJobs with:', appliedFilters);
  const { data, isLoading, isFetching } = useJobs(appliedFilters);

  const { data: applicationsResponse } = useMyApplications(
    undefined,
    { enabled: isAuthenticatedJobSeeker }
  );

  const jobs = useMemo(() => data?.data ?? [], [data]);
  const pagination = data?.pagination;

  const appliedJobLookup = useMemo(() => {
    const lookup = new Map<string, Application['status']>();
    const applications = applicationsResponse?.data ?? [];

    applications.forEach((application) => {
      if (!application || !application.jobId) {
        return;
      }

      const normalizedJobId =
        typeof application.jobId === 'string'
          ? application.jobId
          : application.jobId?._id;

      if (!normalizedJobId) {
        return;
      }

      lookup.set(normalizedJobId, application.status);
    });

    return lookup;
  }, [applicationsResponse]);

  const jobIds = useMemo(() => jobs.map(job => job._id), [jobs]);

  const { data: matchScoresResponse } = useJobMatchScores(
    isAuthenticatedJobSeeker && jobIds.length > 0 ? jobIds : undefined
  );
  const matchScores = useMemo(() => matchScoresResponse?.data ?? {}, [matchScoresResponse]);

  const filteredJobs = useMemo(() => {
    if (!appliedFilters.aiMatchMin || appliedFilters.aiMatchMin === 0) {
      return jobs;
    }
    return jobs.filter(job => {
      const matchData = matchScores[job._id];
      const matchScore = matchData?.matchScore ?? null;
      return matchScore !== null && matchScore >= appliedFilters.aiMatchMin!;
    });
  }, [jobs, matchScores, appliedFilters.aiMatchMin]);

  useEffect(() => {
    const params = filtersToUrlParams(appliedFilters);
    setSearchParams(params, { replace: true });
  }, [appliedFilters, setSearchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters(prev => ({
      ...prev,
      keyword: searchKeyword || undefined,
      page: 1
    }));
  };

  const handleFilterChange = (newFilters: JobFilters) => {
    console.log('[BrowseJobs] Filter change received:', newFilters);
    setAppliedFilters({
      ...newFilters,
      page: 1,
      limit: appliedFilters.limit ?? 12
    });
  };

  const handleRemoveFilter = (filterKey: keyof JobFilters) => {
    console.log('[BrowseJobs] Removing filter:', filterKey);
    setAppliedFilters(prev => {
      const updated = { ...prev };
      delete updated[filterKey];
      updated.page = 1;
      return updated;
    });
  };

  const handleClearFilters = () => {
    setAppliedFilters(DEFAULT_FILTERS);
    setSearchKeyword('');
  };

  const handlePageChange = (newPage: number) => {
    setAppliedFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLimitChange = (newLimit: number) => {
    setAppliedFilters(prev => ({
      ...prev,
      limit: newLimit,
      page: 1
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPublicNavbar = () => (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-7xl flex-row items-center justify-between gap-6 px-4 py-4 md:px-8">
        <Link to="/" className="flex flex-shrink-0 items-center transition-opacity hover:opacity-80">
          <img
            src={lakshyaLogo}
            alt="Lakshya Logo"
            className="h-9 w-auto"
          />
        </Link>

        <div className="flex flex-row items-center gap-3">
          <ThemeToggle />
          <button
            className="select-none border border-[#2563EB] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700"
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button
            className="whitespace-nowrap border border-[#2563EB] bg-white dark:bg-slate-900 px-5 py-2 text-sm font-medium text-[#2563EB] dark:text-indigo-300 transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-indigo-500/10"
            onClick={() => navigate('/signup-choice')}
          >
            Sign Up (Free)
          </button>
        </div>
      </div>
    </nav>
  );

  const renderJobContent = () => (
    <>
      <div className="mb-4 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-4 font-sans sm:px-5 sm:py-5 lg:px-6">
        <div>
          <h1 className="mb-4 text-[18px] font-semibold text-slate-900 dark:text-slate-100">
            Let's find your dream job!
          </h1>

          <form onSubmit={handleSearch} className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 border border-[#D1D5DB] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
              <svg
                className="h-5 w-5 flex-shrink-0 text-[#6B7280] dark:text-slate-400"
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
                placeholder="Find job title..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
                className="w-full bg-transparent text-[14px] font-normal text-[#111827] dark:text-slate-100 outline-none placeholder:text-[#6B7280]"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 border border-[#2563EB] bg-[#2563EB] px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-blue-700"
            >
              <span>Search</span>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="w-full flex-shrink-0 lg:w-80">
          <JobFilter
            filters={appliedFilters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-col items-start justify-between gap-3 border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 px-4 py-4 sm:flex-row sm:items-center">
            <h2 className="text-[18px] font-semibold text-slate-900 dark:text-slate-100">
              {isLoading ? 'Searching...' : `${filteredJobs.length} Job${filteredJobs.length !== 1 ? 's' : ''} Found`}
              {appliedFilters.aiMatchMin && appliedFilters.aiMatchMin > 0 && (
                <span className="ml-2 text-[13px] font-normal text-[#6B7280] dark:text-slate-400">
                  (filtered by {appliedFilters.aiMatchMin}%+ match)
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3">
              {isFetching && !isLoading && (
                <div className="flex items-center gap-2 text-[13px] font-normal text-[#6B7280] dark:text-slate-400">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </div>
              )}
              <PageSizeSelect
                value={appliedFilters.limit || 12}
                onChange={handleLimitChange}
                options={[6, 12, 18, 24]}
                disabled={isLoading}
              />
            </div>
          </div>

          <ActiveFilters
            filters={appliedFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearFilters}
          />

          {isLoading ? (
            <LoadingSpinner text="Finding the best opportunities for you..." />
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              title="No jobs found"
              description="We couldn't find any jobs matching your criteria. Try adjusting your filters or search keywords."
              action={
                <button
                  onClick={handleClearFilters}
                  className="border border-[#2563EB] bg-[#2563EB] px-6 py-3 text-[14px] font-medium text-white transition-colors hover:bg-blue-700"
                >
                  Clear All Filters
                </button>
              }
            />
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {filteredJobs.map((job) => {
                  const matchData = matchScores[job._id];
                  const matchScore = matchData?.matchScore ?? undefined;
                  const applicationStatus = appliedJobLookup.get(job._id);
                  const isApplied = !!applicationStatus;

                  return (
                    <JobCard
                      key={job._id}
                      job={job}
                      showMatchScore
                      matchScore={matchScore}
                      isApplied={isApplied}
                      applicationStatus={applicationStatus}
                    />
                  );
                })}
              </div>

              {pagination && pagination.pages > 1 && (
                <PaginationControls
                  pagination={pagination as PaginationMeta}
                  onPageChange={handlePageChange}
                  isLoading={isLoading}
                  isFetching={isFetching}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );

  if (isAuthenticatedJobSeeker) {
    return (
      <DashboardLayout variant="job-seeker" title="Job Search">
        {renderJobContent()}
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100">
      {renderPublicNavbar()}
      <div className="mx-auto max-w-7xl px-4 pb-6 pt-24">
        {renderJobContent()}
      </div>
      <Footer variant="public" />
    </div>
  );
};

export default BrowseJobs;
