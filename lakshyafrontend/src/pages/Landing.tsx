import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Footer, PageSizeSelect, PaginationControls, type PaginationMeta } from "../components";
import BlogCard from "../components/blog-card";
import { blogPosts } from "../data/blog-data";
import { getLandingData, searchPublicJobs } from "../services/landing-service";
import { useAuth } from "../context/auth-context";
import { toast } from "react-toastify";
import { motion, type Variants } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { ThemeToggle } from "../components/ui";
import lakshyaLogo from "../assets/lakhsya-logo.svg";

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
  const { ref: aboutRef, inView: aboutInView } = useInView({ triggerOnce: true, threshold: 0.15 });
  const { ref: blogRef, inView: blogInView } = useInView({ triggerOnce: true, threshold: 0.1 });
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
      className="landing-page relative min-h-screen w-full overflow-x-hidden bg-white text-slate-900 select-none dark:bg-slate-950 dark:text-slate-100"
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Navbar */}
      <nav className="sticky top-0 left-0 z-50 w-full border-b border-gray-100/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex flex-row justify-between items-center gap-8">
          {/* Logo - Left */}
          <Link to="/" className="flex-shrink-0 flex items-center hover:opacity-80 transition-opacity">
          
            <img
              src={lakshyaLogo}
              alt="Lakshya Logo"
              className="h-9 w-auto"
            />
       <span className="ml-[2px] mb-[5px] text-2xl font-semibold tracking-tight text-black dark:text-white">
  Lakshya
</span>
          </Link>
          

          {/* Nav Links - Center */}
          <div className="hidden md:flex flex-row items-center gap-8 flex-1 justify-center">
            <a
              href="#jobs"
              className="cursor-pointer select-none text-sm text-gray-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-indigo-300"
              draggable="false"
            >
              Find Jobs
            </a>
            <Link
              to="/how-it-works"
              className="cursor-pointer select-none text-sm text-gray-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-indigo-300"
              draggable="false"
            >
              How It Works
            </Link>
            <Link
              to="/about"
              className="cursor-pointer select-none text-sm text-gray-600 transition-colors hover:text-primary dark:text-slate-300 dark:hover:text-indigo-300"
              draggable="false"
            >
              About Lakshya
            </Link>
          </div>

          {/* Auth Buttons - Right */}
          <div className="flex flex-row items-center gap-3">
            <ThemeToggle />
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
            className="mx-auto flex max-w-3xl flex-col items-stretch gap-2 rounded-lg bg-white p-3 shadow-2xl md:flex-row md:items-center md:gap-3 md:p-4 dark:border dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-[0_24px_60px_-24px_rgba(15,23,42,0.9)]"
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
              className="flex-1 rounded-md border border-gray-200 px-4 py-2.5 text-sm text-gray-700 outline-none transition-all select-text focus:border-transparent focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400"
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

      {/* About Preview Section */}
      <section id="about-preview" ref={aboutRef} className="bg-white px-4 py-10 md:px-8 md:py-12 dark:bg-slate-950">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          animate={aboutInView ? "visible" : "hidden"}
        >
          <motion.h2
            variants={fadeUp}
            className="mb-12 text-center text-2xl font-bold text-gray-900 select-none md:text-3xl dark:text-slate-100"
          >
            About Lakshya
          </motion.h2>
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.25 }}
            className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-slate-900 dark:border-slate-800"
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="">
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-slate-100">Lakshya — Career Intelligence</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400">
                  Lakshya is an AI-powered career intelligence platform that helps job seekers and recruiters make smarter decisions.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 hover:scale-105 hover:shadow-lg transition-all duration-200"
                >
                  Learn More... →
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Blog Preview Section */}
      <section id="blog-preview" ref={blogRef} className="bg-white px-4 py-10 md:px-8 md:py-12 dark:bg-slate-950">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={staggerContainer}
          initial="hidden"
          animate={blogInView ? "visible" : "hidden"}
        >
          <motion.h2
            variants={fadeUp}
            className="mb-12 text-center text-2xl font-bold text-gray-900 select-none md:text-3xl dark:text-slate-100"
          >
            From the Blog
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-start">
            {blogPosts.slice(0, 3).map((post) => (
              <motion.div
                key={post.id}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25 }}
              >
                <BlogCard title={post.title} excerpt={post.excerpt} category={post.category} href="/blog" />
              </motion.div>
            ))}
            <motion.div variants={fadeUp} className="col-span-full flex justify-end mt-2">
              <Link
                to="/blog"
                className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-200 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors dark:bg-slate-900 dark:border-slate-800 dark:text-indigo-300"
              >
                View All →
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Browse Jobs Section */}
      <section id="jobs" ref={jobsRef} className="bg-gray-50 px-4 py-16 md:px-8 md:py-20 dark:bg-slate-900">
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
            <h2 className="select-none text-2xl font-bold text-gray-900 md:text-3xl dark:text-slate-100">
              {appliedSearch ? (
                <>
                  Search Results
                  {pagination && (
                    <span className="ml-2 text-lg text-gray-600 dark:text-slate-400">({pagination.total} jobs)</span>
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
                <span className="animate-pulse text-sm text-indigo-600 dark:text-indigo-300">Updating...</span>
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
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950/70"
                >
                  <div className="mb-3 h-6 w-3/4 rounded bg-gray-200 dark:bg-slate-800"></div>
                  <div className="mb-2 h-4 w-1/2 rounded bg-gray-200 dark:bg-slate-800"></div>
                  <div className="mb-4 h-4 w-2/3 rounded bg-gray-200 dark:bg-slate-800"></div>
                  <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-slate-800"></div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {isError && !isLoading && (
            <motion.div variants={fadeUp} className="text-center py-12">
              <p className="mb-4 text-gray-500 dark:text-slate-400">Unable to load jobs at the moment.</p>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.99 }}
                className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                onClick={() => window.location.reload()}
              >
                Try Again!
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
                    className="rounded-lg border border-gray-200 bg-white p-6 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:shadow-xl active:translate-y-0 active:shadow-lg dark:border-slate-800 dark:bg-slate-950 dark:hover:border-indigo-400 dark:hover:shadow-[0_22px_60px_-28px_rgba(99,102,241,0.55)]"
                  >
                    {/* Header with Save Button */}
                    <div className="flex items-start justify-between mb-2 gap-3">
                      <h3 className="line-clamp-2 flex-1 select-none text-lg font-semibold text-gray-900 dark:text-slate-100">
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
                            ? "text-yellow-600 dark:text-amber-300"
                            : "text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
                    <p className="mb-1 flex items-center gap-1 select-none text-sm text-gray-600 dark:text-slate-400">
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
                    <p className="mb-2 flex items-center gap-1 select-none text-sm text-gray-600 dark:text-slate-400">
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
                      <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600 select-none dark:bg-blue-500/15 dark:text-blue-300">
                        {job.jobType}
                      </span>
                    </div>

                    {/* Posted Date */}
                    <p className="mb-4 select-none text-xs text-gray-500 dark:text-slate-500">
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
              <p className="mb-2 text-gray-500 dark:text-slate-400">
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
      <section ref={howItWorksRef} className="bg-white px-4 py-16 md:px-8 md:py-20 dark:bg-slate-950">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={howItWorksInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center text-2xl font-bold text-gray-900 select-none md:text-3xl dark:text-slate-100"
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
            className="cursor-pointer rounded-lg border border-gray-300 bg-white p-6 text-center transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:shadow-xl active:translate-y-0 active:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400"
          >
            <div className="mb-4 select-none text-2xl font-bold text-gray-900 dark:text-slate-100">1. Upload PDF Resume</div>
            <p className="select-none text-sm leading-relaxed text-gray-600 dark:text-slate-400">
              Simply upload your Resume in PDF format. Our system is designed to handle various layouts.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white p-6 text-center transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:shadow-xl active:translate-y-0 active:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400"
          >
            <div className="mb-4 select-none text-2xl font-bold text-gray-900 dark:text-slate-100">2. AI Analyzes & Scores</div>
            <p className="select-none text-sm leading-relaxed text-gray-600 dark:text-slate-400">
              Our advanced AI evaluates your resume according to the skills, and education requirements.
            </p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white p-6 text-center transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:shadow-xl active:translate-y-0 active:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400"
          >
            <div className="mb-4 select-none text-2xl font-bold text-gray-900 dark:text-slate-100">3. Apply to High-Match Jobs</div>
            <p className="select-none text-sm leading-relaxed text-gray-600 dark:text-slate-400">
              Get an excellent list of opportunities that fit your skills and aspirations. Our highest match rates...
            </p>
          </motion.div>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="bg-white px-4 py-16 md:px-8 md:py-20 dark:bg-slate-950">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          animate={statsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center text-2xl font-bold text-gray-900 select-none md:text-3xl dark:text-slate-100"
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
            className="cursor-pointer rounded-lg border border-gray-300 bg-white p-8 text-center transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:shadow-xl active:translate-y-0 active:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400"
          >
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 select-none">
              {isLoading ? (
                <div className="mx-auto h-12 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-800"></div>
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
            <div className="select-none text-sm text-gray-600 dark:text-slate-400">Active Jobs</div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white p-8 text-center transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:shadow-xl active:translate-y-0 active:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400"
          >
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 select-none">
              {isLoading ? (
                <div className="mx-auto h-12 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-800"></div>
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
            <div className="select-none text-sm text-gray-600 dark:text-slate-400">Verified Users</div>
          </motion.div>

          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="cursor-pointer rounded-lg border border-gray-300 bg-white p-8 text-center transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:shadow-xl active:translate-y-0 active:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400"
          >
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 select-none">
              {isLoading ? (
                <div className="mx-auto h-12 w-32 animate-pulse rounded bg-gray-200 dark:bg-slate-800"></div>
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
            <div className="select-none text-sm text-gray-600 dark:text-slate-400">Top Companies</div>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className="bg-white px-4 py-16 md:px-8 md:py-20 dark:bg-slate-950">
        <motion.div
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8"
          variants={staggerContainer}
          initial="hidden"
          animate={ctaInView ? "visible" : "hidden"}
        >
          <motion.div
            variants={fadeUp}
            whileHover={{ y: -8 }}
            className="rounded-lg border border-gray-300 bg-white p-8 text-center transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:shadow-xl active:translate-y-0 active:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400"
          >
            <h3 className="mb-3 select-none text-xl font-bold text-gray-900 dark:text-slate-100">I am a Job Seeker</h3>
            <p className="mb-6 select-none text-sm leading-relaxed text-gray-600 dark:text-slate-400">
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
            className="rounded-lg border border-gray-300 bg-white p-8 text-center transition-all duration-300 ease-in-out hover:-translate-y-1 hover:border-primary hover:shadow-xl active:translate-y-0 active:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-400"
          >
            <h3 className="mb-3 select-none text-xl font-bold text-gray-900 dark:text-slate-100">I am an Employer</h3>
            <p className="mb-6 select-none text-sm leading-relaxed text-gray-600 dark:text-slate-400">
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