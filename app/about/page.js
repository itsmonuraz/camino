'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function AboutPage() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    setIsDarkMode(shouldBeDark);
    document.documentElement.classList.toggle('dark', shouldBeDark);

    // Set page title and meta tags
    document.title = 'About | Camino';
    
    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Learn about Camino, a minimal habit tracker designed to help you build better routines. Discover how to track your habits honestly and consistently across all your devices.';
    
    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = 'https://camino.rknastenka.com/about/';
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8 bg-[#fcfcf9] dark:bg-[#1f2121]">

      {/* About Content */}
      <article className="w-full max-w-[800px]">
        <Link 
          href="/" 
          className="inline-flex items-center gap-1 text-sm text-[#626c71] dark:text-[rgba(167,169,169,0.7)] hover:text-[#14532d] dark:hover:text-[#f5f5f5] transition-colors mb-4"
          aria-label="Go back to home page"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back
        </Link>
        <div className="bg-[#fffffe] dark:bg-[#262828] rounded-xl border border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)] shadow-md p-8">
          <h1 className="text-[#14532d] text-2xl md:text-3xl font-bold dark:text-[#f5f5f5] mb-6">
            About Camino
          </h1>
          <div className="space-y-6 text-[#626c71] dark:text-[rgba(167,169,169,0.7)]">
            <p className="text-base leading-relaxed">
             Camino is nothing but a Habit Tracker, designed to be minialistic and straight to the point.
            <br/>
            <br/>
             You can tick your completed habits within the tie day. Passed days or future days cannot be modified,
             ensuring that your habit tracking remains accurate and honest.
            <br/>
            <br/>
            You can view your yearly habits progress data in the
           <Link href="/username" className="text-[#14532d] dark:text-[#25844b] hover:underline"> /username</Link> page.
            <br/>
            <br/>
            To ensure a sync across devices, Camino uses your Google account for authentication.
            You can <Link href="/" className="text-[#14532d] dark:text-[#25844b] hover:underline">sign up</Link> using your Google account, create a username, and start tracking your habits seamlessly across multiple devices.
            <br/>
            <br/>
            If you have any questions, suggestions, or feedback, feel free to reach out to me at {' '}
           <a href="mailto:itsmonuraz@gmail.com" className="text-[#14532d] dark:text-[#25844b] hover:underline">itsmonuraz@gmail.com</a>.

            </p>

            <div className="pt-4 border-t border-[rgba(94,82,64,0.12)] dark:border-[rgba(119,124,124,0.2)]">
              <p className="text-sm">
               
                <a 
                  href="https://github.com/itsmonuraz" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#14532d] dark:text-[#25844b] hover:underline font-medium"
                >
                  @rknastenka
                </a>
              </p>
            </div>

          </div>
        </div>
      </article>
      
    </div>
  );
}
