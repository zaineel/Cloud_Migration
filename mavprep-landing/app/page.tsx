"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className='min-h-screen bg-black'>
      {/* Fixed Neon Background - stays in place while content scrolls */}
      <div className='fixed inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-20 pointer-events-none'>
        <div className='absolute top-1/4 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent rounded-full blur-3xl animate-pulse delay-1000'></div>
      </div>

      {/* Hero Section */}
      <section
        id='home'
        className='pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative'
        aria-labelledby='hero-heading'>
        <div className='max-w-7xl mx-auto relative z-10'>
          <div className='flex flex-col items-center text-center space-y-8 py-20'>
            {/* Hero Headline */}
            <h1
              id='hero-heading'
              className='text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl'>
              <span className='inline-flex items-center'>
                <span className='text-gray-300'>Mav</span>
                <span className='text-primary neon-text-glow'>Prep</span>
              </span>
            </h1>

            {/* Hero Description */}
            <p className='text-lg sm:text-xl text-gray-300 max-w-2xl'>
              The collaborative study platform for UTA students. Connect with
              peers through text and voice channels, join study rooms, and ace
              your exams together.
            </p>

            {/* CTA Button */}
            <Link
              href='/login'
              className='bg-primary hover:bg-accent text-black font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary focus:ring-opacity-50 neon-glow hover:shadow-2xl'
              aria-label='Get started with MavPrep'>
              Get Started
            </Link>

            {/* Feature Highlights */}
            <div className='flex flex-wrap justify-center gap-8 pt-8'>
              <div className='text-center'>
                <div className='w-14 h-14 mx-auto mb-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center overflow-visible'>
                  <svg
                    className='w-7 h-7 text-primary'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                    />
                  </svg>
                </div>
                <div className='text-sm text-gray-400'>Text Channels</div>
              </div>
              <div className='text-center'>
                <div className='w-14 h-14 mx-auto mb-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center overflow-visible'>
                  <svg
                    className='w-7 h-7 text-primary'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
                    />
                  </svg>
                </div>
                <div className='text-sm text-gray-400'>Voice Calls</div>
              </div>
              <div className='text-center'>
                <div className='w-14 h-14 mx-auto mb-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center overflow-visible'>
                  <svg
                    className='w-7 h-7 text-primary'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                    />
                  </svg>
                </div>
                <div className='text-sm text-gray-400'>Video Chat</div>
              </div>
              <div className='text-center'>
                <div className='w-14 h-14 mx-auto mb-2 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center overflow-visible'>
                  <svg
                    className='w-7 h-7 text-primary'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={1.5}
                      d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                    />
                  </svg>
                </div>
                <div className='text-sm text-gray-400'>Study Rooms</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id='features'
        className='py-20 px-4 sm:px-6 lg:px-8 bg-black'
        aria-labelledby='features-heading'>
        <div className='max-w-7xl mx-auto'>
          {/* Section Header */}
          <div className='text-center mb-16'>
            <h2
              id='features-heading'
              className='text-3xl sm:text-4xl font-bold text-white mb-4'>
              Study Smarter, Together
            </h2>
            <p className='text-lg text-gray-400 max-w-2xl mx-auto'>
              Everything you need to collaborate with classmates and prepare for
              exams.
            </p>
          </div>

          {/* Features Grid */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {/* Feature 1: Text Channels */}
            <div className='p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group'>
              <div className='w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow'>
                <svg
                  className='w-6 h-6 text-black'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                Text Channels
              </h3>
              <p className='text-gray-400'>
                Real-time messaging with emoji support, message replies, and the
                ability to edit or delete your messages. Stay connected with
                your study group.
              </p>
            </div>

            {/* Feature 2: Voice Channels */}
            <div className='p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group'>
              <div className='w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow'>
                <svg
                  className='w-6 h-6 text-black'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                Voice Channels
              </h3>
              <p className='text-gray-400'>
                Jump into voice calls with classmates. Features mute, deafen,
                and audio cues so you know when people join or leave. Perfect
                for group study sessions.
              </p>
            </div>

            {/* Feature 3: Video Calls */}
            <div className='p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group'>
              <div className='w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow'>
                <svg
                  className='w-6 h-6 text-black'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                Video Calls
              </h3>
              <p className='text-gray-400'>
                Turn on your camera during voice calls for face-to-face study
                sessions. Toggle video on or off anytime while staying in the
                call.
              </p>
            </div>

            {/* Feature 4: Study Rooms */}
            <div className='p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group'>
              <div className='w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow'>
                <svg
                  className='w-6 h-6 text-black'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                Study Rooms
              </h3>
              <p className='text-gray-400'>
                Browse and join study rooms organized by course. Each room shows
                the course it&apos;s for and who created it. Find your study
                group easily.
              </p>
            </div>

            {/* Feature 5: User Profiles */}
            <div className='p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group'>
              <div className='w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow'>
                <svg
                  className='w-6 h-6 text-black'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                User Profiles
              </h3>
              <p className='text-gray-400'>
                Create your unique username, customize your profile, and manage
                your account settings. Your identity across all study rooms.
              </p>
            </div>

            {/* Feature 6: Course-Based Organization */}
            <div className='p-6 bg-gray-900 border border-gray-800 rounded-xl hover:border-primary hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 group'>
              <div className='w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform neon-glow'>
                <svg
                  className='w-6 h-6 text-black'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  aria-hidden='true'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                  />
                </svg>
              </div>
              <h3 className='text-xl font-semibold text-white mb-2'>
                Course-Based Channels
              </h3>
              <p className='text-gray-400'>
                Channels are organized by UTA courses like CSE 2320, CSE 3318,
                and more. Find study partners taking the same classes as you.
              </p>
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className='mt-16 text-center'>
            <h3 className='text-2xl font-bold text-white mb-6'>Coming Soon</h3>
            <div className='flex flex-wrap justify-center gap-4'>
              <span className='px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-gray-300 text-sm flex items-center gap-2'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                  />
                </svg>
                Practice Tests
              </span>
              <span className='px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-gray-300 text-sm flex items-center gap-2'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
                Study Plans
              </span>
              <span className='px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-gray-300 text-sm flex items-center gap-2'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                  />
                </svg>
                Progress Analytics
              </span>
              <span className='px-4 py-2 bg-gray-800 border border-gray-700 rounded-full text-gray-300 text-sm flex items-center gap-2'>
                <svg
                  className='w-4 h-4'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={1.5}
                    d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                  />
                </svg>
                Smart Flashcards
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className='py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black to-gray-900'>
        <div className='max-w-4xl mx-auto text-center'>
          <h2 className='text-3xl sm:text-4xl font-bold text-white mb-4'>
            Ready to Study Smarter?
          </h2>
          <p className='text-lg text-gray-400 mb-8'>
            Join your fellow Mavericks and start collaborating today. Free for
            all UTA students.
          </p>
          <Link
            href='/login'
            className='inline-block bg-primary hover:bg-accent text-black font-semibold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 neon-glow'>
            Join MavPrep
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className='bg-black border-t border-gray-800 text-white py-12 px-4 sm:px-6 lg:px-8'
        role='contentinfo'>
        <div className='max-w-7xl mx-auto'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-8'>
            {/* Brand Section */}
            <div>
              <div className='flex items-center mb-4'>
                <span className='text-2xl font-bold text-gray-300 tracking-wide'>
                  MAV
                </span>
                <span className='text-2xl font-bold text-primary tracking-wide'>
                  PREP
                </span>
              </div>
              <p className='text-gray-400'>
                A collaborative study platform built for UTA students by UTA
                students. Part of the ACM Create initiative.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className='text-lg font-semibold mb-4 text-primary'>
                Quick Links
              </h3>
              <ul className='space-y-2 text-gray-400'>
                <li>
                  <Link
                    href='/login'
                    className='hover:text-primary transition-colors'>
                    Sign In / Sign Up
                  </Link>
                </li>
                <li>
                  <a
                    href='https://github.com/zaineel/Cloud_Migration'
                    className='hover:text-primary transition-colors'
                    target='_blank'
                    rel='noopener noreferrer'>
                    GitHub Repository
                  </a>
                </li>
                <li>
                  <a
                    href='https://www.uta.edu/academics/schools-colleges/engineering/academics/departments/cse'
                    className='hover:text-primary transition-colors'
                    target='_blank'
                    rel='noopener noreferrer'>
                    UTA CSE Department
                  </a>
                </li>
              </ul>
            </div>

            {/* Project Info */}
            <div>
              <h3 className='text-lg font-semibold mb-4 text-primary'>
                About the Project
              </h3>
              <p className='text-gray-400 text-sm'>
                MavPrep is an ACM Projects initiative developed by UTA students.
                Built with Next.js, AWS Cognito, DynamoDB, and WebRTC.
              </p>
              <div className='flex space-x-4 mt-4'>
                {/* GitHub */}
                <a
                  href='https://github.com/zaineel/Cloud_Migration'
                  className='w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all group'
                  aria-label='View on GitHub'
                  target='_blank'
                  rel='noopener noreferrer'>
                  <svg
                    className='w-5 h-5 group-hover:scale-110 transition-transform'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                    aria-hidden='true'>
                    <path
                      fillRule='evenodd'
                      d='M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z'
                      clipRule='evenodd'
                    />
                  </svg>
                </a>

                {/* Discord */}
                <a
                  href='https://discord.gg/acm'
                  className='w-10 h-10 bg-gray-800 border border-gray-700 rounded-lg flex items-center justify-center hover:bg-primary hover:border-primary hover:text-black transition-all group'
                  aria-label='Join Discord'
                  target='_blank'
                  rel='noopener noreferrer'>
                  <svg
                    className='w-5 h-5 group-hover:scale-110 transition-transform'
                    fill='currentColor'
                    viewBox='0 0 24 24'
                    aria-hidden='true'>
                    <path d='M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z' />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className='border-t border-gray-800 pt-8 text-center text-gray-400'>
            <p>
              &copy; {new Date().getFullYear()} MavPrep - An ACM Projects
              Initiative. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
