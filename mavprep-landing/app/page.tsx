"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Fixed Neon Background - stays in place while content scrolls */}
      <div className="fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Hero Section */}
      <section
        id="home"
        className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative"
        aria-labelledby="hero-heading"
      >
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col items-center text-center space-y-8 py-20">
            {/* Hero Headline */}
            <h1
              id="hero-heading"
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl"
            >
              <span className="inline-flex items-center">
                <span className="text-gray-300">Mav</span>
                <span className="text-primary neon-text-glow">Prep</span>
              </span>
            </h1>

            {/* Hero Description */}
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl">
              Your intelligent companion for academic success and exam
              preparation.
            </p>

            {/* CTA Button */}
            <Link
              href="/login"
              className="bg-primary hover:bg-accent text-black font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 neon-glow hover:shadow-2xl"
              aria-label="Get started with MavPrep"
            >
              Get Started
            </Link>

            {/* Stats or Social Proof */}
            <div className="flex flex-wrap justify-center gap-8 pt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary neon-text-glow">
                  10K+
                </div>
                <div className="text-sm text-gray-400">Active Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary neon-text-glow">
                  500+
                </div>
                <div className="text-sm text-gray-400">Practice Tests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary neon-text-glow">
                  95%
                </div>
                <div className="text-sm text-gray-400">Success Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-black"
        aria-labelledby="features-heading"
      >
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2
              id="features-heading"
              className="text-3xl sm:text-4xl font-bold text-white mb-4"
            >
              Powerful Features to Boost Your Learning
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Everything you need to excel in your studies, all in one place.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Practice Tests */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Practice Tests
              </h3>
              <p className="text-gray-400">
                Access hundreds of practice tests with detailed explanations and
                instant feedback to track your progress.
              </p>
            </div>

            {/* Feature 2: Study Plans */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Custom Study Plans
              </h3>
              <p className="text-gray-400">
                Get personalized study schedules tailored to your goals,
                timeline, and learning style.
              </p>
            </div>

            {/* Feature 3: Progress Analytics */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Progress Analytics
              </h3>
              <p className="text-gray-400">
                Visualize your performance with detailed analytics and insights
                to identify strengths and weaknesses.
              </p>
            </div>

            {/* Feature 4: Video Lessons */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Video Lessons
              </h3>
              <p className="text-gray-400">
                Learn from expert instructors through engaging video content
                covering all key topics and concepts.
              </p>
            </div>

            {/* Feature 5: Flashcards */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Smart Flashcards
              </h3>
              <p className="text-gray-400">
                Master key concepts with AI-powered flashcards that adapt to
                your learning pace and retention.
              </p>
            </div>

            {/* Feature 6: Community Support */}
            <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow">
                <svg
                  className="w-6 h-6 text-black"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Community Support
              </h3>
              <p className="text-gray-400">
                Connect with peers, ask questions, and collaborate in our
                vibrant learning community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="bg-black border-t border-gray-800 text-white py-12 px-4 sm:px-6 lg:px-8"
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand Section */}
            <div>
              <div className="flex items-center mb-4">
                <span className="text-2xl font-bold text-gray-300 tracking-wide">
                  MAV
                </span>
                <span className="text-2xl font-bold text-white tracking-wide">
                  PREP
                </span>
              </div>
              <p className="text-gray-400">
                Empowering students to achieve their academic goals through
                innovative learning tools.
              </p>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">
                Contact Us
              </h3>
              <address className="not-italic text-gray-400 space-y-2">
                <p>
                  Email:{" "}
                  <a
                    href="mailto:support@mavprep.com"
                    className="hover:text-primary transition-colors"
                  >
                    support@mavprep.com
                  </a>
                </p>
                <p>
                  Phone:{" "}
                  <a
                    href="tel:+1234567890"
                    className="hover:text-primary transition-colors"
                  >
                    (123) 456-7890
                  </a>
                </p>
                <p>Address: 123 Learning St, Education City, EC 12345</p>
              </address>
            </div>

            {/* Social Media Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary">
                Follow Us
              </h3>
              <div className="flex space-x-4">
                {/* Twitter/X */}
                <a
                  href="https://twitter.com/mavprep"
                  className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all group"
                  aria-label="Follow us on Twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* LinkedIn */}
                <a
                  href="https://linkedin.com/company/mavprep"
                  className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all group"
                  aria-label="Follow us on LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href="https://facebook.com/mavprep"
                  className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all group"
                  aria-label="Follow us on Facebook"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    className="w-5 h-5 group-hover:scale-110 transition-transform"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* Instagram */}
                <a
                  href="https://instagram.com/mavprep"
                  className="w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all group"
                  aria-label="Follow us on Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} MavPrep. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
