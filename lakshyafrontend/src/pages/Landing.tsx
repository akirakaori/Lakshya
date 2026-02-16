import { useNavigate } from "react-router-dom";
import { Footer } from "../components";

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
      <Footer variant="public" />
    </div>
  );
}

export default Landing;
