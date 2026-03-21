import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Footer, PageSizeSelect, PaginationControls, type PaginationMeta } from "../components";
import { getLandingData, searchPublicJobs } from "../services/landing-service";
import { useAuth } from "../context/auth-context";
import { toast } from "react-toastify";
import { motion, type Variants } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Search state
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState<string | undefined>(undefined);

  // Pagination state for jobs listing
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsLimit, setJobsLimit] = useState(12);

  // Saved jobs state (local, for demo purposes)
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  // In-view hooks for animation triggers
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true, threshold: 0.15 });
  const { ref: jobsRef, inView: jobsInView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { ref: howItWorksRef, inView: howItWorksInView } = useInView({ triggerOnce: true, threshold: 0.15 });
  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true, threshold: 0.2 });
  const { ref: ctaRef, inView: ctaInView } = useInView({ triggerOnce: true, threshold: 0.15 });

  // Fetch landing data from API (stats only - no pagination needed)
  const { data: landingData } = useQuery({
    queryKey: ["public-landing"],
    queryFn: getLandingData,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  // Fetch public jobs with pagination (always active, search optional)
  const {
    data: jobsData,
    isLoading: isLoadingJobs,
    isError: isErrorJobs,
    isFetching: isFetchingJobs,
  } = useQuery({
    queryKey: ["public-jobs", { page: jobsPage, limit: jobsLimit, search: appliedSearch }],
    queryFn: () => searchPublicJobs({ keyword: appliedSearch, page: jobsPage, limit: jobsLimit }),
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });

  // Extract jobs and pagination
  const displayJobs = jobsData?.data.jobs || [];
  const pagination: PaginationMeta | undefined = jobsData?.data.pagination
    ? {
        page: jobsData.data.pagination.currentPage,
        limit: jobsLimit,
        total: jobsData.data.pagination.totalJobs,
        pages: jobsData.data.pagination.totalPages,
      }
    : undefined;
  const isLoading = isLoadingJobs;
  const isError = isErrorJobs;

  // Handle search - filter jobs on same page (no navigation)
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const normalized = searchInput.trim().toLowerCase();
    if (normalized.length < 2) {
      setAppliedSearch(undefined);
    } else {
      setAppliedSearch(normalized);
    }
    setJobsPage(1);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchInput("");
    setAppliedSearch(undefined);
    setJobsPage(1);
  };

  // Handle pagination
  const handleJobsLimitChange = (newLimit: number) => {
    setJobsLimit(newLimit);
    setJobsPage(1);
    window.scrollTo({ top: document.getElementById("jobs")?.offsetTop || 0, behavior: "smooth" });
  };

  const handleJobsPageChange = (newPage: number) => {
    setJobsPage(newPage);
    window.scrollTo({ top: document.getElementById("jobs")?.offsetTop || 0, behavior: "smooth" });
  };

  // Format date for job posting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  // Handle job click (view details)
  const handleJobClick = (jobId: string) => {
    navigate(`/jobs/${jobId}`);
  };

  // Handle save job toggle
  const handleToggleSaveJob = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    e.preventDefault();

    if (!user) {
      const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
      navigate(`/login?redirect=${redirectUrl}`);
      return;
    }

    if (user.role !== "job_seeker") {
      toast.error("Only job seekers can save jobs.");
      return;
    }

    const newSavedJobs = new Set(savedJobs);
    if (newSavedJobs.has(jobId)) {
      newSavedJobs.delete(jobId);
      toast.success("Removed from saved jobs", { autoClose: 2000 });
    } else {
      newSavedJobs.add(jobId);
      toast.success("Job saved successfully", { autoClose: 2000 });
    }
    setSavedJobs(newSavedJobs);
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 32 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const staggerContainer: Variants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  return (
    <div
      className="landing-page w-full min-h-screen bg-white relative overflow-x-hidden select-none"
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-100 w-full left-0">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-row justify-between items-center gap-8">
          {/* Logo - Left */}
          <div className="flex items-center space-x-3">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              transition={{ duration: 0.2 }}
              className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="text-xl">💼</span>
            </motion.div>
            <span className="text-xl font-bold text-gray-800 cursor-default select-none" draggable="false">
              Lakshya
            </span>
          </div>

          {/* Nav Links - Center */}
          <div className="hidden md:flex flex-row items-center gap-8 flex-1 justify-center">
            <a
              href="#jobs"
              className="text-sm text-gray-600 hover:text-primary transition-colors select-none cursor-pointer"
              draggable="false"
            >
              Find Jobs
            </a>
            <a
              href="#employers"
              className="text-sm text-gray-600 hover:text-primary transition-colors select-none cursor-pointer"
              draggable="false"
            >
              For Employers
            </a>
            <a
              href="#scoring"
              className="text-sm text-gray-600 hover:text-primary transition-colors select-none cursor-pointer"
              draggable="false"
            >
              About AI Scoring
            </a>
          </div>

          {/* Auth Buttons - Right */}
          <div className="flex flex-row items-center gap-3">
            {user ? (
              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out select-none whitespace-nowrap"
                onClick={() => {
                  if (user.role === "admin") navigate("/AdminDashboard");
                  else if (user.role === "recruiter") navigate("/recruiter/dashboard");
                  else navigate("/job-seeker/dashboard");
                }}
              >
                Go to Dashboard
              </motion.button>
            ) : (
              <>
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="text-sm text-white bg-indigo-400 hover:bg-indigo-500 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm px-4 py-2 rounded-lg transition-all duration-200 ease-in-out select-none"
                  onClick={() => navigate("/login")}
                >
                  Login
                </motion.button>
                <motion.button
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out select-none whitespace-nowrap"
                  onClick={() => navigate("/signup-choice")}
                >
                  Sign Up (Free)
                </motion.button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        ref={heroRef}
        className="bg-gradient-to-br from-[#5b57e8] via-[#6366f1] to-[#7c7ff5] text-white py-16 md:py-24 px-4 md:px-8 text-center"
      >
        <motion.div
          className="max-w-4xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          animate={heroInView ? "visible" : "hidden"}
        >
          <motion.h1
            variants={fadeUp}
            className="text-3xl md:text-5xl font-bold mb-3 leading-tight select-none"
          >
            Find Your Lakshya. Match Your Future.
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="text-sm md:text-base mb-8 opacity-90 leading-relaxed select-none max-w-2xl mx-auto"
          >
            The first AI-powered job portal where scores truly matter and Lakshya goes beyond finding jobs.
          </motion.p>
          <motion.form
            variants={fadeUp}
            onSubmit={handleSearch}
            className="bg-white rounded-lg p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 shadow-2xl max-w-3xl mx-auto"
          >
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              placeholder="Search jobs, skills, companies or location"
              className="flex-1 px-4 py-2.5 outline-none border border-gray-200 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 text-sm select-text transition-all"
            />
            <motion.button
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              className="px-6 md:px-8 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 ease-in-out whitespace-nowrap select-none"
            >
              Search Jobs
            </motion.button>
          </motion.form>
        </motion.div>
      </section>

      {/* Browse Jobs Section */}
      <section id="jobs" ref={jobsRef} className="py-16 md:py-20 px-4 md:px-8 bg-gray-50">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          animate={jobsInView ? "visible" : "hidden"}
        >
          <motion.div
            variants={fadeUp}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
          >
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 select-none">
              {appliedSearch ? (
                <>
                  Search Results
                  {pagination && (
                    <span className="text-lg text-gray-600 ml-2">({pagination.total} jobs)</span>
                  )}
                </>
              ) : (
                "Latest Job Openings"
              )}
            </h2>
            <div className="flex gap-3 items-center">
              <PageSizeSelect
                value={jobsLimit}
                onChange={handleJobsLimitChange}
                options={[6, 12, 18, 24]}
                disabled={isLoading}
              />
              {isFetchingJobs && (
                <span className="text-sm text-indigo-600 animate-pulse">Updating...</span>
              )}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex gap-3 mb-8">
            {appliedSearch && (
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="px-5 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out select-none"
                onClick={handleClearSearch}
              >
                Clear Search
              </motion.button>
            )}
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out select-none"
              onClick={() => navigate("/browse-jobs")}
            >
              Browse All Jobs
            </motion.button>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <motion.div variants={fadeUp} className="text-center py-12">
              <p className="text-gray-500 mb-4">Unable to load jobs at the moment.</p>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                onClick={() => window.location.reload()}
              >
                Try Again
              </motion.button>
            </motion.div>
          )}

          {/* Jobs Grid */}
          {!isLoading && !isError && displayJobs && displayJobs.length > 0 && (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              variants={staggerContainer}
              initial="hidden"
              animate={jobsInView ? "visible" : "hidden"}
            >
              {displayJobs.map((job) => {
                const isSaved = savedJobs.has(job._id);
                return (
                  <motion.div
                    key={job._id}
                    variants={fadeUp}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out"
                  >
                    {/* Header with Save Button */}
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 select-none flex-1">
                        {job.title}
                      </h3>

                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={(e) => handleToggleSaveJob(e, job._id)}
                        title={isSaved ? "Saved" : "Save Job"}
                        className={`flex-shrink-0 flex items-center justify-center p-2 rounded-lg transition ${
                          isSaved
                            ? "text-yellow-600"
                            : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                        }`}
                        aria-label={isSaved ? "Remove from saved jobs" : "Save this job"}
                      >
                        {!isSaved && (
                          <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z"
                            />
                          </svg>
                        )}
                        {isSaved && (
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M5 5a2 2 0 012-2h6a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        )}
                      </motion.button>
                    </div>

                    {/* Company Name */}
                    <p className="text-sm text-gray-600 mb-1 flex items-center gap-1 select-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                        />
                      </svg>
                      {job.companyName}
                    </p>

                    {/* Location */}
                    <p className="text-sm text-gray-600 mb-2 flex items-center gap-1 select-none">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {job.location}
                    </p>

                    {/* Job Type */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded-full select-none">
                        {job.jobType}
                      </span>
                    </div>

                    {/* Posted Date */}
                    <p className="text-xs text-gray-500 mb-4 select-none">
                      Posted {formatDate(job.createdAt)}
                    </p>

                    {/* View Details Button */}
                    <motion.button
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleJobClick(job._id)}
                      className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      View Details
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* No Jobs State */}
          {!isLoading && !isError && displayJobs && displayJobs.length === 0 && (
            <motion.div variants={fadeUp} className="text-center py-12">
              <p className="text-gray-500 mb-2">
                {appliedSearch ? `No jobs found for "${appliedSearch}"` : "No jobs available at the moment."}
              </p>
              {appliedSearch && (
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors mt-4"
                  onClick={handleClearSearch}
                >
                  Clear Search
                </motion.button>
              )}
            </motion.div>
          )}

          {/* Pagination Controls */}
          {!isLoading && !isError && pagination && pagination.pages > 1 && (
            <motion.div variants={fadeUp} className="mt-8">
              <PaginationControls
                pagination={pagination}
                onPageChange={handleJobsPageChange}
                isLoading={isLoading}
                isFetching={isFetchingJobs}
              />
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* How It Works Section */}
      <section ref={howItWorksRef} className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900 select-none"
        >
          How It Works
        </motion.h2>

        <motion.div
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate={howItWorksInView ? "visible" : "hidden"}
        >
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="bg-white border border-gray-300 rounded-lg p-6 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer"
          >
            <div className="text-2xl font-bold text-gray-900 mb-4 select-none">1. Upload PDF Resume</div>
            <p className="text-sm text-gray-600 leading-relaxed select-none">
              Simply upload your Resume in PDF format. Our system is designed to handle various layouts.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="bg-white border border-gray-300 rounded-lg p-6 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer"
          >
            <div className="text-2xl font-bold text-gray-900 mb-4 select-none">2. AI Analyzes & Scores</div>
            <p className="text-sm text-gray-600 leading-relaxed select-none">
              Our advanced AI evaluates your resume according to the skills, and education requirements.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="bg-white border border-gray-300 rounded-lg p-6 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer"
          >
            <div className="text-2xl font-bold text-gray-900 mb-4 select-none">3. Apply to High-Match Jobs</div>
            <p className="text-sm text-gray-600 leading-relaxed select-none">
              Get an excellent list of opportunities that fit your skills and aspirations. Our highest match rates...
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900 select-none"
        >
          Lakshya by the Numbers
        </motion.h2>

        <motion.div
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate={statsInView ? "visible" : "hidden"}
        >
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="bg-white border border-gray-300 rounded-lg p-8 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer"
          >
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 select-none">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-12 rounded mx-auto w-32"></div>
              ) : isError ? (
                "—"
              ) : statsInView ? (
                <>
                  <CountUp end={landingData?.data.stats.totalJobs || 0} duration={2} separator="," />+
                </>
              ) : (
                "0+"
              )}
            </div>
            <div className="text-sm text-gray-600 select-none">Active Jobs</div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="bg-white border border-gray-300 rounded-lg p-8 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer"
          >
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 select-none">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-12 rounded mx-auto w-32"></div>
              ) : isError ? (
                "—"
              ) : statsInView ? (
                <>
                  <CountUp end={landingData?.data.stats.totalUsers || 0} duration={2} separator="," />+
                </>
              ) : (
                "0+"
              )}
            </div>
            <div className="text-sm text-gray-600 select-none">Verified Users</div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="bg-white border border-gray-300 rounded-lg p-8 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer"
          >
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 select-none">
              {isLoading ? (
                <div className="animate-pulse bg-gray-200 h-12 rounded mx-auto w-32"></div>
              ) : isError ? (
                "—"
              ) : statsInView ? (
                <>
                  <CountUp end={landingData?.data.stats.totalCompanies || 0} duration={2} separator="," />+
                </>
              ) : (
                "0+"
              )}
            </div>
            <div className="text-sm text-gray-600 select-none">Top Companies</div>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <motion.div
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate={ctaInView ? "visible" : "hidden"}
        >
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="bg-white border border-gray-300 rounded-lg p-8 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out"
          >
            <h3 className="text-xl font-bold mb-3 text-gray-900 select-none">I am a Job Seeker</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 select-none">
              Upload your resume and receive AI-powered personalized job recommendations.
            </p>
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="w-full px-6 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out cursor-pointer select-none"
              onClick={() => navigate("/signup-choice")}
            >
              Find My Dream Job
            </motion.button>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="bg-white border border-gray-300 rounded-lg p-8 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out"
          >
            <h3 className="text-xl font-bold mb-3 text-gray-900 select-none">I am an Employer</h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 select-none">
              Access top talent that perfectly matches your job requirements.
            </p>
            <br />
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.99 }}
              className="w-full px-6 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out cursor-pointer select-none"
              onClick={() => navigate("/signup-choice")}
            >
              Hire Top Talent
            </motion.button>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer variant="public" />
    </div>
  );
}

export default Landing;