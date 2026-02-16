import { useNavigate } from "react-router-dom";
import { Footer } from '../components';

function SignupChoice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
        {/* Logo and Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-indigo-600">Lakshya</span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Join Lakshya Today</h1>
          <p className="text-gray-600">Choose your role to get started.</p>
        </div>

        {/* Cards Container */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Job Seeker Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:scale-[1.02] hover:border-indigo-200 border-2 border-transparent transition-all duration-300 cursor-pointer">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl group-hover:bg-indigo-200 transition-colors duration-300">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-gray-900">I am a Job Seeker</h2>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                Find your perfect job with AI matching and elevate your career.
              </p>

              {/* Button */}
              <button
                onClick={() => navigate("/signup/jobseeker")}
                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-xl active:scale-[0.98] hover:scale-[1.02] transition-all duration-300"
              >
                Continue
              </button>
            </div>
          </div>

          {/* Employer Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-2xl hover:scale-[1.02] hover:border-indigo-200 border-2 border-transparent transition-all duration-300 cursor-pointer">
            <div className="text-center space-y-6">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-2xl group-hover:bg-indigo-200 transition-colors duration-300">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>

              {/* Title */}
              <h2 className="text-xl font-semibold text-gray-900">I am an Employer</h2>

              {/* Description */}
              <p className="text-gray-600 text-sm leading-relaxed">
                Hire top talent efficiently with AI-powered ranking and candidate screening.
              </p>

              {/* Button */}
              <button
                onClick={() => navigate("/signup/recruiter")}
                className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-xl active:scale-[0.98] hover:scale-[1.02] transition-all duration-300"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
      <Footer variant="public" />
    </div>
  );
}

export default SignupChoice;
