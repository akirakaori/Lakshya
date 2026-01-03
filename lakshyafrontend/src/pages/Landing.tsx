import { useNavigate } from "react-router-dom";
import "../styles/Landing.css";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">LAKSHYA</div>
          <div className="nav-links">
            <a href="#jobs">Find Jobs</a>
            <a href="#employers">For Employers</a>
            <a href="#scoring">About AI Scoring</a>
            <button className="nav-login-btn" onClick={() => navigate("/login")}>
              Login
            </button>
            <button className="nav-signup-btn" onClick={() => navigate("/signup-choice")}>
              Sign Up (Free)
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Find Your Lakshya. Match Your Future.</h1>
          <p className="hero-subtitle">
            The first AI-powered job portal where scores truly matter and Lakshya<br />
            goes beyond finding jobs—it matches futures.
          </p>
          <div className="search-container">
            <input
              type="text"
              placeholder="Job, Position, or Company"
              className="search-input"
            />
            <select className="location-select">
              <option>Kathmandu</option>
              <option>Pokhara</option>
              <option>Lalitpur</option>
            </select>
            <button className="search-btn">Search Jobs</button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="step-title">Upload PDF Resume</h3>
            <p className="step-description">
              Simply upload your Resume in PDF format and submit it along with job application.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="step-title">AI Analyzes & Scores</h3>
            <p className="step-description">
              Our advanced AI evaluates each resume according to the skills, and education requirements.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="step-title">Apply to High-Match Jobs</h3>
            <p className="step-description">
              Get an excellent list of opportunities that fit your skills and aspirations. Our highest match rates...
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <h2 className="section-title">Lakshya by the Numbers</h2>
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-number">500 +</div>
            <div className="stat-label">Active Jobs</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">1,000+</div>
            <div className="stat-label">Verified Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">50 +</div>
            <div className="stat-label">Top Companies</div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <div className="cta-card">
            <h3 className="cta-title">I am a Job Seeker</h3>
            <p className="cta-description">
              Upload your resume and receive AI-powered personalized job recommendations.
            </p>
            <button className="cta-btn" onClick={() => navigate("/signup-choice")}>
              Find My Dream Job
            </button>
          </div>
          <div className="cta-card">
            <h3 className="cta-title">I am an Employer</h3>
            <p className="cta-description">
              Access top talent that perfectly matches your job requirements.
            </p>
            <button className="cta-btn" onClick={() => navigate("/signup-choice")}>
              Hire Top Talent
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-container">
          <div className="footer-column">
            <h4 className="footer-brand">LAKSHYA</h4>
            <p className="footer-description">
              The first AI-powered job portal<br />
              where scores truly matter and<br />
              Lakshya goes beyond finding<br />
              jobs—it matches futures.
            </p>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">Company</h4>
            <a href="#about">About Us</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">Resources</h4>
            <a href="#blog">Blog</a>
            <a href="#faqs">FAQs</a>
          </div>
          <div className="footer-column">
            <h4 className="footer-heading">Legal</h4>
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
