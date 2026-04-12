import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import lakshyaLogo from '../assets/lakhsya-logo.svg';
import Footer from '../components/layout/footer';

const ContactPage: React.FC = () => {
  console.debug('[Routing] ContactPage rendered');

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    userType: 'job-seeker',
    subject: '',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted:', formData);
    alert('Contact form submitted successfully!');
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={lakshyaLogo} alt="Lakshya Logo" className="h-7 w-auto" />
            <span className="text-sm font-semibold text-slate-900">Lakshya</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link to="/platform" className="text-sm text-slate-500 transition hover:text-slate-900">
              Platform
            </Link>
            <Link to="/resources" className="text-sm text-slate-500 transition hover:text-slate-900">
              Resources
            </Link>
            <Link to="/pricing" className="text-sm text-slate-500 transition hover:text-slate-900">
              Pricing
            </Link>
            <Link to="/intelligence" className="text-sm text-slate-500 transition hover:text-slate-900">
              Intelligence
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden text-sm text-slate-500 transition hover:text-slate-900 sm:inline-flex">
              Login
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center rounded-md bg-[#4f5bd5] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4450c4]"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-20 pt-12">
        {/* Hero */}
        <section className="max-w-3xl pb-10">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6f78d8]">
            Contact Us
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            We&apos;re here to help
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 md:text-[15px]">
            Whether you&apos;re looking for enterprise solutions, technical support, or just want
            to learn more about how our career intelligence platform can help your organization
            scale.
          </p>
        </section>

        {/* Main content */}
        <section className="grid gap-6 lg:grid-cols-[1.45fr_0.95fr]">
          {/* Form */}
          <div className="border border-slate-200 bg-white p-6 md:p-7">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="h-11 w-full border border-slate-200 bg-[#f7f8fc] px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#4f5bd5] focus:bg-white"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Business Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="jane@company.com"
                    className="h-11 w-full border border-slate-200 bg-[#f7f8fc] px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#4f5bd5] focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="userType"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    I am a...
                  </label>
                  <div className="relative">
                    <select
                      id="userType"
                      name="userType"
                      value={formData.userType}
                      onChange={handleChange}
                      className="h-11 w-full appearance-none border border-slate-200 bg-[#f7f8fc] px-3 pr-10 text-sm text-slate-800 outline-none focus:border-[#4f5bd5] focus:bg-white"
                    >
                      <option value="job-seeker">Individual Professional</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="general">General Inquiry</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                        />
                      </svg>
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                  >
                    Subject
                  </label>
                  <input
                    id="subject"
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="How can we help?"
                    className="h-11 w-full border border-slate-200 bg-[#f7f8fc] px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#4f5bd5] focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={7}
                  placeholder="Tell us more about your needs..."
                  className="w-full resize-none border border-slate-200 bg-[#f7f8fc] px-3 py-3 text-sm leading-7 text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#4f5bd5] focus:bg-white"
                  required
                />
              </div>

              <button
                type="submit"
                className="inline-flex h-11 w-full items-center justify-center rounded-sm bg-[#4f5bd5] px-5 text-sm font-medium text-white transition hover:bg-[#4450c4]"
              >
                Send Message
              </button>

              <p className="text-center text-xs leading-5 text-slate-400">
                By submitting this message, you acknowledge that our team may use this information
                to respond to your inquiry.
              </p>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact info */}
            <div className="border border-slate-200 bg-white p-6">
              <h2 className="text-base font-semibold text-slate-900">Contact Information</h2>

              <div className="mt-5 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#eef1ff] text-[#4f5bd5]">
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">hello@lakshya.ai</p>
                    <p className="text-sm font-medium text-slate-700">sales@lakshya.ai</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#eef1ff] text-[#4f5bd5]">
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Headquarters
                    </p>
                    <p className="mt-1 text-sm font-medium leading-6 text-slate-700">
                      1200 Innovation Way, Suite 400
                      <br />
                      San Francisco, CA 94105
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#eef1ff] text-[#4f5bd5]">
                    <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.8}
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Hours
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-700">
                      Mon - Fri 9:00 AM - 6:00 PM PST
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Support status */}
            <div className="border border-slate-200 bg-[#f7f8fc] p-6">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-sm font-semibold text-[#4f5bd5]">Support Status</h3>
                <span className="text-sm font-semibold text-emerald-600">24h</span>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Our team is currently active. Average response time is within 24 hours.
              </p>

              <div className="mt-5 h-1.5 w-full bg-slate-200">
                <div className="h-1.5 w-[84%] bg-[#4f5bd5]" />
              </div>
            </div>

            {/* Quick help */}
            <div className="border border-slate-200 bg-white p-6">
              <h3 className="text-base font-semibold text-slate-900">Quick Help</h3>

              <div className="mt-4 divide-y divide-slate-100">
                {[
                  'How do I reset my password?',
                  'Can I upgrade my plan later?',
                  'Where can I find API docs?',
                ].map((item) => (
                  <div key={item} className="flex items-center justify-between py-3.5">
                    <span className="text-sm text-slate-700">{item}</span>
                    <span className="text-slate-300">›</span>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <Link
                  to="/help-center"
                  className="text-sm font-medium text-[#4f5bd5] transition hover:text-[#4450c4]"
                >
                  Visit Help Center ↗
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom image */}
        <section className="pt-14">
          <div className="overflow-hidden border border-slate-200 bg-white">
            <img
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1600&q=80"
              alt="Global team and connected work infrastructure"
              className="h-[300px] w-full object-cover md:h-[360px]"
            />
          </div>
        </section>
      </main>

      <Footer variant="public" />
    </div>
  );
};

export default ContactPage;