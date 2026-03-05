import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardLayout, JobCard, JobFilter, LoadingSpinner, EmptyState, ActiveFilters, Footer } from '../../components';
import { useJobs, useJobMatchScores } from '../../hooks';
import { useAuth } from '../../context/auth-context';
import type { JobFilters } from '../../services';

// Default filters
const DEFAULT_FILTERS: JobFilters = {
  page: 1,
  limit: 12,
};

// Helper: Convert URL search params to JobFilters
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
  
  // Handle array params (experience levels)
  const expLevels = params.getAll('experienceLevel');
  if (expLevels.length > 0) filters.experienceLevels = expLevels;
  
  return filters;
};

// Helper: Convert JobFilters to URL search params
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
  
  // Array params
  if (filters.experienceLevels?.length) {
    filters.experienceLevels.forEach(level => params.append('experienceLevel', level));
  }
  
  return params;
};

const BrowseJobs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check if user is authenticated job seeker
  const isAuthenticatedJobSeeker = user?.role === 'job_seeker';
  
  // Initialize filters from URL on mount
  const initialFilters = urlParamsToFilters(searchParams);
  
  // Applied filters (triggers API calls) - synced with URL
  const [appliedFilters, setAppliedFilters] = useState<JobFilters>(initialFilters);
  
  // Search keyword state (for search bar)
  const [searchKeyword, setSearchKeyword] = useState(initialFilters.keyword || '');

  // Debug: Log filters before API call
  useEffect(() => {
    console.log('='.repeat(80));
    console.log('[BrowseJobs] Applied filters changed - will trigger useJobs');
    console.log('[BrowseJobs] appliedFilters:', JSON.stringify(appliedFilters, null, 2));
    console.log('[BrowseJobs] Filter count:', Object.keys(appliedFilters).length);
    console.log('[BrowseJobs] Active filters:', Object.entries(appliedFilters).filter(([, v]) => v !== undefined && v !== null && v !== ''));
    console.log('='.repeat(80));
  }, [appliedFilters]);

  // Fetch jobs using applied filters
  console.log('[BrowseJobs] About to call useJobs with:', appliedFilters);
  const { data, isLoading, isFetching } = useJobs(appliedFilters);

  const jobs = data?.data || [];
  const pagination = data?.pagination;

  // Extract job IDs for batch match score fetch
  const jobIds = useMemo(() => jobs.map(job => job._id), [jobs]);

  // Fetch match scores for all visible jobs (only for authenticated job seekers)
  const { data: matchScoresResponse } = useJobMatchScores(
    isAuthenticatedJobSeeker && jobIds.length > 0 ? jobIds : undefined
  );
  const matchScores = matchScoresResponse?.data || {};

  // Apply AI match filter on frontend (not sent to backend)
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

  // Update URL when applied filters change
  useEffect(() => {
    const params = filtersToUrlParams(appliedFilters);
    setSearchParams(params, { replace: true });
  }, [appliedFilters, setSearchParams]);

  // Handle search button or Enter key
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedFilters(prev => ({
      ...prev,
      keyword: searchKeyword || undefined,
      page: 1 // Reset to first page
    }));
  };

  // Handle filter sidebar applying filters
  const handleFilterChange = (newFilters: JobFilters) => {
    console.log('[BrowseJobs] Filter change received:', newFilters);
    // Replace all filters (except page/limit) with the new clean filters
    setAppliedFilters({
      ...newFilters,
      page: 1, // Reset to first page when filters change
      limit: appliedFilters.limit ?? 12
    });
  };

  // Remove a single filter
  const handleRemoveFilter = (filterKey: keyof JobFilters) => {
    console.log('[BrowseJobs] Removing filter:', filterKey);
    setAppliedFilters(prev => {
      const updated = { ...prev };
      delete updated[filterKey];
      updated.page = 1; // Reset to first page
      return updated;
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setAppliedFilters(DEFAULT_FILTERS);
    setSearchKeyword('');
  };

  // Handle pagination
  const handlePageChange = (newPage: number) => {
    setAppliedFilters(prev => ({ ...prev, page: newPage }));
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Public Navbar Component (for non-authenticated users)
  const PublicNavbar = () => (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 w-full">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-row justify-between items-center gap-8">
        {/* Logo - Left */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
            <span className="text-xl">💼</span>
          </div>
          <span className="text-xl font-bold text-gray-800 cursor-default select-none">
            Lakshya
          </span>
        </div>
        
        {/* Auth Buttons - Right */}
        <div className="flex flex-row items-center gap-3">
          <button 
            className="text-sm text-white bg-indigo-400 hover:bg-indigo-500 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm px-4 py-2 rounded-lg transition-all duration-200 ease-in-out select-none"
            onClick={() => navigate("/login")}
          >
            Login
          </button>
          <button 
            className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out select-none whitespace-nowrap"
            onClick={() => navigate("/signup-choice")}
          >
            Sign Up (Free)
          </button>
        </div>
      </div>
    </nav>
  );

  // Main content (shared between authenticated and public views)
  const JobContent = () => (
    <>
        {/* Blue Gradient Search Header Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-blue-700 px-4 sm:px-6 lg:px-10 py-6 sm:py-8 mb-6">
          {/* Decorative Shapes */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
          
          {/* Content */}
          <div className="relative z-10">
            <h1 className="text-white text-2xl sm:text-3xl font-semibold mb-4">
              Let's find your dream job!
            </h1>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch">
              <div className="flex-1 flex items-center gap-3 bg-white/15 backdrop-blur-md rounded-full px-4 py-3 ring-1 ring-white/20">
                <svg
                  className="w-5 h-5 text-white/70 flex-shrink-0"
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
                  className="w-full bg-transparent placeholder:text-white/70 text-white outline-none"
                />
              </div>
              <button
                type="submit"
                className="rounded-full bg-white text-blue-700 font-semibold px-6 py-3 hover:bg-white/90 transition flex items-center justify-center gap-2"
              >
                <span>Search</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <JobFilter
              filters={appliedFilters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
          </aside>

          {/* Job Results */}
          <div className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isLoading ? 'Searching...' : `${filteredJobs.length} Job${filteredJobs.length !== 1 ? 's' : ''} Found`}
                {appliedFilters.aiMatchMin && appliedFilters.aiMatchMin > 0 && (
                  <span className="text-sm text-gray-500 ml-2">
                    (filtered by {appliedFilters.aiMatchMin}%+ match)
                  </span>
                )}
              </h2>
              {isFetching && !isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </div>
              )}
            </div>

            {/* Active Filters Chips */}
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
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    Clear All Filters
                  </button>
                }
              />
            ) : (
              <>
                {/* Job Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                  {filteredJobs.map((job) => {
                    const matchData = matchScores[job._id];
                    const matchScore = matchData?.matchScore ?? undefined;
                    return (
                      <JobCard 
                        key={job._id} 
                        job={job} 
                        showMatchScore 
                        matchScore={matchScore}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.pages > 1 && (
                  <div className="flex items-center justify-center gap-2 pb-8">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    {Array.from({ length: Math.min(pagination.pages, 7) }, (_, i) => {
                      let pageNum;
                      if (pagination.pages <= 7) {
                        pageNum = i + 1;
                      } else {
                        // Smart pagination display
                        if (pagination.page <= 4) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.pages - 3) {
                          pageNum = pagination.pages - 6 + i;
                        } else {
                          pageNum = pagination.page - 3 + i;
                        }
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`min-w-[2.5rem] h-10 rounded-lg font-medium transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-indigo-600 text-white'
                              : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
    </>
  );

  // Conditional rendering based on authentication
  if (isAuthenticatedJobSeeker) {
    return (
      <DashboardLayout variant="job-seeker" title="Job Search">
        <JobContent />
      </DashboardLayout>
    );
  }

  // Public view
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNavbar />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <JobContent />
      </div>
      <Footer variant="public" />
    </div>
  );
};

export default BrowseJobs;
