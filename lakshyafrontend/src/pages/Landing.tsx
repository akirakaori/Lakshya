import { useNavigate } from "react-router-dom";

function Landing() {
  const navigate = useNavigate();

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
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md hover:shadow-lg transition-shadow">
              <span className="text-xl">💼</span>
            </div>
            <span className="text-xl font-bold text-gray-800 cursor-default select-none" draggable="false">
              Lakshya
            </span>
          </div>
          
          {/* Nav Links - Center */}
          <div className="hidden md:flex flex-row items-center gap-8 flex-1 justify-center">
            <a href="#jobs" className="text-sm text-gray-600 hover:text-primary transition-colors select-none cursor-pointer" draggable="false">
              Find Jobs
            </a>
            <a href="#employers" className="text-sm text-gray-600 hover:text-primary transition-colors select-none cursor-pointer" draggable="false">
              For Employers
            </a>
            <a href="#scoring" className="text-sm text-gray-600 hover:text-primary transition-colors select-none cursor-pointer" draggable="false">
              About AI Scoring
            </a>
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#5b57e8] via-[#6366f1] to-[#7c7ff5] text-white py-16 md:py-24 px-4 md:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight select-none">
            Find Your Lakshya. Match Your Future.
          </h1>
          <p className="text-sm md:text-base mb-8 opacity-90 leading-relaxed select-none max-w-2xl mx-auto">
            The first AI-powered job portal where scores truly matter and Lakshya goes beyond finding jobs.
          </p>
          <div className="bg-white rounded-lg p-3 md:p-4 flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 shadow-2xl max-w-3xl mx-auto">
            <input
              type="text"
              placeholder="Job Position, or Company"
              className="flex-1 px-4 py-2.5 outline-none border border-gray-200 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 text-sm select-text transition-all"
            />
            <select className="px-4 py-2.5 bg-white border border-gray-200 rounded-md outline-none focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer text-gray-700 text-sm select-none transition-all">
              <option>Kathmandu</option>
              <option>Pokhara</option>
              <option>Lalitpur</option>
            </select>
            <button className="px-6 md:px-8 py-2.5 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all duration-200 ease-in-out whitespace-nowrap select-none">
              Search Jobs
            </button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900 select-none">
          How It Works
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-300 rounded-lg p-6 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer">
            <div className="text-2xl font-bold text-gray-900 mb-4 select-none">1. Upload PDF Resume</div>
            <p className="text-sm text-gray-600 leading-relaxed select-none">
              Simply upload your Resume in PDF format. Our system is designed to handle various layouts.
            </p>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-6 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer">
            <div className="text-2xl font-bold text-gray-900 mb-4 select-none">2. AI Analyzes & Scores</div>
            <p className="text-sm text-gray-600 leading-relaxed select-none">
              Our advanced AI evaluates your resume according to the skills, and education requirements.
            </p>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-6 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer">
            <div className="text-2xl font-bold text-gray-900 mb-4 select-none">3. Apply to High-Match Jobs</div>
            <p className="text-sm text-gray-600 leading-relaxed select-none">
              Get an excellent list of opportunities that fit your skills and aspirations. Our highest match rates...
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-12 text-gray-900 select-none">
          Lakshya by the Numbers
        </h2>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white border border-gray-300 rounded-lg p-8 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 select-none">500 +</div>
            <div className="text-sm text-gray-600 select-none">Active Jobs</div>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-8 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 select-none">1,000+</div>
            <div className="text-sm text-gray-600 select-none">Verified Students</div>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-8 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out cursor-pointer">
            <div className="text-4xl md:text-5xl font-bold text-primary mb-2 select-none">50 +</div>
            <div className="text-sm text-gray-600 select-none">Top Companies</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white border border-gray-300 rounded-lg p-8 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out">
            <h3 className="text-xl font-bold mb-3 text-gray-900 select-none">
              I am a Job Seeker
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 select-none">
              Upload your resume and receive AI-powered personalized job recommendations.
            </p>
            <button 
              className="w-full px-6 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out cursor-pointer select-none"
              onClick={() => navigate("/signup-choice")}
            >
              Find My Dream Job
            </button>
          </div>
          <div className="bg-white border border-gray-300 rounded-lg p-8 text-center hover:shadow-xl hover:border-primary hover:-translate-y-1 active:translate-y-0 active:shadow-lg transition-all duration-300 ease-in-out">
            <h3 className="text-xl font-bold mb-3 text-gray-900 select-none">
              I am an Employer
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-6 select-none">
              Access top talent that perfectly matches your job requirements.
            </p>
            <br></br>
            <button 
              className="w-full px-6 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md transition-all duration-200 ease-in-out cursor-pointer select-none"
              onClick={() => navigate("/signup-choice")}
            >
              Hire Top Talent
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-10 px-4 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-white text-xs font-bold">
                  L
                </div>
                <span className="text-lg font-semibold text-gray-900 select-none">Lakshya</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed select-none mb-4">
                The first AI-powered job portal where scores truly matter and Lakshya goes beyond finding jobs—it matches futures.
              </p>
              {/* Social Media Icons */}
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-primary hover:text-white hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm flex items-center justify-center transition-all duration-200 ease-in-out">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-primary hover:text-white hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm flex items-center justify-center transition-all duration-200 ease-in-out">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-primary hover:text-white hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm flex items-center justify-center transition-all duration-200 ease-in-out">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm4.441 16.892c-2.102.144-6.784.144-8.883 0C5.282 16.736 5.017 15.622 5 12c.017-3.629.285-4.736 2.558-4.892 2.099-.144 6.782-.144 8.883 0C18.718 7.264 18.982 8.378 19 12c-.018 3.629-.285 4.736-2.559 4.892zM10 9.658l4.917 2.338L10 14.342V9.658z"/></svg>
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-100 hover:bg-primary hover:text-white hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm flex items-center justify-center transition-all duration-200 ease-in-out">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-900 select-none">Company</h4>
              <div className="flex flex-col gap-2">
                <a href="#about" className="text-xs text-gray-600 hover:text-primary focus-visible:text-primary focus-visible:outline-none rounded transition-colors select-none">About Us</a>
                <a href="#contact" className="text-xs text-gray-600 hover:text-primary focus-visible:text-primary focus-visible:outline-none rounded transition-colors select-none">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-900 select-none">Resources</h4>
              <div className="flex flex-col gap-2">
                <a href="#blog" className="text-xs text-gray-600 hover:text-primary focus-visible:text-primary focus-visible:outline-none rounded transition-colors select-none">Blog</a>
                <a href="#faqs" className="text-xs text-gray-600 hover:text-primary focus-visible:text-primary focus-visible:outline-none rounded transition-colors select-none">FAQs</a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-3 text-gray-900 select-none">Legal</h4>
              <div className="flex flex-col gap-2">
                <a href="#privacy" className="text-xs text-gray-600 hover:text-primary focus-visible:text-primary focus-visible:outline-none rounded transition-colors select-none">Privacy Policy</a>
                <a href="#terms" className="text-xs text-gray-600 hover:text-primary focus-visible:text-primary focus-visible:outline-none rounded transition-colors select-none">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 select-none">© 2026 Lakshya. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
