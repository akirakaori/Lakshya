import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DashboardLayout, JobCard, JobFilter, LoadingSpinner, EmptyState } from '../../components';
import { useJobs } from '../../hooks';
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
  if (params.get('location')) filters.location = params.get('location')!;
  if (params.get('salaryMin')) filters.salaryMin = parseInt(params.get('salaryMin')!);
  if (params.get('salaryMax')) filters.salaryMax = parseInt(params.get('salaryMax')!);
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
  if (filters.location) params.set('location', filters.location);
  if (filters.salaryMin) params.set('salaryMin', filters.salaryMin.toString());
  if (filters.salaryMax) params.set('salaryMax', filters.salaryMax.toString());
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
  
  // Initialize filters from URL on mount
  const initialFilters = urlParamsToFilters(searchParams);
  
  // Applied filters (triggers API calls) - synced with URL
  const [appliedFilters, setAppliedFilters] = useState<JobFilters>(initialFilters);
  
  // Search keyword state (for search bar)
  const [searchKeyword, setSearchKeyword] = useState(initialFilters.keyword || '');

  // Fetch jobs using applied filters
  const { data, isLoading, isFetching } = useJobs(appliedFilters);

  const jobs = data?.data || [];
  const pagination = data?.pagination;

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
    setAppliedFilters({
      ...newFilters,
      page: 1, // Reset to first page when filters change
      limit: appliedFilters.limit
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

  return (
    <DashboardLayout variant="job-seeker" title="Job Search">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
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
                placeholder="Search by job title, keywords, or company..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(e);
                  }
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </form>
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
                {isLoading ? 'Searching...' : `${pagination?.total || 0} Job${pagination?.total !== 1 ? 's' : ''} Found`}
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

            {/* Active Filters Display */}
            {Object.keys(appliedFilters).some(key => 
              key !== 'page' && key !== 'limit' && appliedFilters[key as keyof JobFilters]
            ) && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-indigo-700">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span className="font-medium">Filters Active</span>
                </div>
                <button
                  onClick={handleClearFilters}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  Clear All
                </button>
              </div>
            )}

            {isLoading ? (
              <LoadingSpinner text="Finding the best opportunities for you..." />
            ) : jobs.length === 0 ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {jobs.map((job) => (
                    <JobCard key={job._id} job={job} showMatchScore />
                  ))}
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
      </div>
    </DashboardLayout>
  );
};

export default BrowseJobs;
