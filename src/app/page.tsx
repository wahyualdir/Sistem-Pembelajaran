'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Copy, ExternalLink, X } from 'lucide-react';
import { MacIllustration } from '@/components/retro/mac-illustration';

export default function HomePage() {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-black font-sans selection:bg-black selection:text-white antialiased flex flex-col">
      {/* -------------------- TOP RETRO NAVIGATION BAR -------------------- */}
      <header className="sticky top-0 z-50 w-full border-b-2 border-black bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          {/* Logo & Nav Links */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Retro Mac Icon in square box */}
            <Link
              href="/"
              className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white shadow-[2px_2px_0px_#000] hover:bg-black hover:text-white transition-all group"
              title="Home / Mac"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 fill-none stroke-current stroke-2 group-hover:stroke-white"
              >
                {/* Compact Mac Case */}
                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                {/* CRT Screen */}
                <rect x="6" y="6" width="12" height="9" rx="1.5" strokeWidth="2" />
                {/* Smiling Eyeball */}
                <circle cx="12" cy="10.5" r="2.5" fill="currentColor" />
                {/* Floppy Slot */}
                <line x1="8" y1="18" x2="16" y2="18" strokeWidth="2" />
              </svg>
            </Link>

            {/* Menu items */}
            <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-bold">
              <a href="#projects" className="hover:underline underline-offset-4">
                Projects
              </a>
              <a href="#blog" className="hover:underline underline-offset-4">
                Blog
              </a>
              <a href="#learn" className="hover:underline underline-offset-4 hidden xs:inline">
                Learn
              </a>
              <button
                onClick={() => setActiveModal('clone')}
                className="hover:underline underline-offset-4"
              >
                Clone me
              </button>
              <a href="#contact" className="hover:underline underline-offset-4 hidden sm:inline">
                Find me
              </a>
            </nav>
          </div>

          {/* Quick Jump to SIAJAR Portal / Login */}
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-3 py-1 sm:px-4 sm:py-1.5 border-2 border-black bg-white text-black font-bold text-xs shadow-[2px_2px_0px_#000] hover:bg-black hover:text-white active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              Masuk SIAJAR ↗
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------- MAIN CONTENT WRAPPER -------------------- */}
      <main className="flex-1 w-full">
        {/* 1. HERO SECTION */}
        <section className="w-full max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="grid md:grid-cols-[1.1fr_1fr] items-center gap-8 lg:gap-12">
            {/* Left: Headline & Call To Action */}
            <div className="space-y-4 sm:space-y-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-black tracking-tight text-black leading-[0.98]">
                Hello.
                <br />
                I&apos;m Mac.
              </h1>
              <p className="text-sm sm:text-base text-black font-semibold max-w-md leading-relaxed">
                I&apos;m a free retro Webflow template made by{' '}
                <a
                  href="https://twitter.com/mackenziechild"
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4 decoration-2 hover:opacity-75"
                >
                  Mackenzie Child.
                </a>
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveModal('clone')}
                  className="px-5 py-2.5 border-2 border-black bg-white text-black font-bold text-xs sm:text-sm shadow-[3px_3px_0px_#000] hover:bg-black hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer"
                >
                  Clone me on Webflow
                </button>
                <Link
                  href="/login"
                  className="px-5 py-2.5 border-2 border-black bg-[#EFEFEF] text-black font-bold text-xs sm:text-sm shadow-[3px_3px_0px_#000] hover:bg-black hover:text-white active:translate-x-0.5 active:translate-y-0.5 active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  Buka Portal Kampus <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Right: Retro Macintosh Vector Illustration */}
            <div className="flex justify-center md:justify-end">
              <MacIllustration className="w-full max-w-[340px] sm:max-w-[380px] h-auto drop-shadow-sm select-none" />
            </div>
          </div>

          {/* 2. QUICK LINKS BAR */}
          <div className="mt-12 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-heading font-black text-black mb-3">
              Quick links
            </h2>
            <div className="border-2 border-black bg-white shadow-[3.5px_3.5px_0px_#000] grid grid-cols-2 md:grid-cols-4 overflow-hidden">
              <a
                href="#blog"
                className="flex items-center justify-between px-4 sm:px-6 py-3 border-r-2 border-black border-b-2 md:border-b-0 hover:bg-black hover:text-white transition-colors group font-bold text-xs sm:text-sm"
              >
                <span>Blog</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="#projects"
                className="flex items-center justify-between px-4 sm:px-6 py-3 md:border-r-2 border-black border-b-2 md:border-b-0 hover:bg-black hover:text-white transition-colors group font-bold text-xs sm:text-sm"
              >
                <span>Projects</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="#learn"
                className="flex items-center justify-between px-4 sm:px-6 py-3 border-r-2 border-black hover:bg-black hover:text-white transition-colors group font-bold text-xs sm:text-sm"
              >
                <span>About</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="#contact"
                className="flex items-center justify-between px-4 sm:px-6 py-3 hover:bg-black hover:text-white transition-colors group font-bold text-xs sm:text-sm"
              >
                <span>Contact</span>
                <ArrowUpRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </div>
          </div>
        </section>

        {/* 3. PROJECTS SECTION (DITHER PATTERN BACKGROUND) */}
        <section
          id="projects"
          className="w-full border-y-2 border-black bg-retro-dither py-12 sm:py-16"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-black mb-6 sm:mb-8">
              Projects
            </h2>

            {/* 2-Column Grid of Retro Window Cards */}
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8">
              {/* Project Card 1: Possimus */}
              <article className="border-2 border-black bg-white shadow-[4.5px_4.5px_0px_#000] overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5">
                {/* Window Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#E2E2E2]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                  </div>
                  <span className="font-mono text-xs font-bold text-black tracking-tight">
                    2020-04-08-project.html
                  </span>
                </div>

                {/* Grayscale Banner Photo (Coastal cliff landscape) */}
                <div className="border-b-2 border-black overflow-hidden bg-neutral-200 aspect-[16/9] relative">
                  <img
                    src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80"
                    alt="Seascape Coastal Cliff"
                    className="w-full h-full object-cover grayscale contrast-125 brightness-95"
                    loading="lazy"
                  />
                </div>

                {/* Card Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-heading font-black text-black mb-2">
                      Possimus
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      Officia sit numquam fugiat sint molestiae id. Est modi est at debitis
                      dolorem. Ut voluptate quod rem dolores sint molestiae maiores. Quaerat
                      consequatur quia libero voluptatem dolores vel. Non rerum esse voluptate
                      voluptatem et aliquam sapiente blanditiis. Voluptates aperiam suscipit.
                      Ut et
                    </p>
                  </div>

                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={() => setActiveModal('Possimus')}
                      className="px-4 py-2 border-2 border-black bg-white text-black font-bold text-xs shadow-[2.5px_2.5px_0px_#000] hover:bg-black hover:text-white active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      View project
                    </button>
                  </div>
                </div>
              </article>

              {/* Project Card 2: Dolorum Ullam Totam */}
              <article className="border-2 border-black bg-white shadow-[4.5px_4.5px_0px_#000] overflow-hidden flex flex-col transition-transform hover:-translate-y-0.5">
                {/* Window Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#E2E2E2]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                  </div>
                  <span className="font-mono text-xs font-bold text-black tracking-tight">
                    2020-04-08-project.html
                  </span>
                </div>

                {/* Grayscale Banner Photo (Live concert stage) */}
                <div className="border-b-2 border-black overflow-hidden bg-neutral-200 aspect-[16/9] relative">
                  <img
                    src="https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80"
                    alt="Live Concert Stage"
                    className="w-full h-full object-cover grayscale contrast-125 brightness-95"
                    loading="lazy"
                  />
                </div>

                {/* Card Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-heading font-black text-black mb-2">
                      Dolorum Ullam Totam
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      Consequatur consequatur et quisquam sit velit. Distinctio sint omnis.
                      Vitae et sint repellendus consequatur cumque eos atque. Eligendi cupiditate
                      praesentium est dolore qui minima architecto laudantium asperiores.
                    </p>
                  </div>

                  <div className="pt-5">
                    <button
                      type="button"
                      onClick={() => setActiveModal('Dolorum Ullam Totam')}
                      className="px-4 py-2 border-2 border-black bg-white text-black font-bold text-xs shadow-[2.5px_2.5px_0px_#000] hover:bg-black hover:text-white active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                    >
                      View project
                    </button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* 4. FROM THE BLOG SECTION (OVERLAPPING RETRO WINDOWS) */}
        <section id="blog" className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-black">
              From the blog
            </h2>
            <a
              href="#blog"
              onClick={(e) => {
                e.preventDefault();
                setActiveModal('all_posts');
              }}
              className="text-xs sm:text-sm font-bold text-black underline underline-offset-4 mt-1 inline-block hover:opacity-75"
            >
              View all blog posts
            </a>
          </div>

          {/* Overlapping Cascade Window Stack */}
          <div className="relative pt-2 pb-12">
            {/* Top Window: Fox (2020-04-07-blog.pdf) */}
            <div className="border-2 border-black bg-white shadow-[5px_5px_0px_#000] max-w-lg mb-6 transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#E2E2E2]">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                  <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                  <span className="h-3 w-3 rounded-full border border-black/80 bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                </div>
                <span className="font-mono text-xs font-bold text-black">
                  2020-04-07-blog.pdf
                </span>
              </div>
              <div className="h-56 sm:h-64 overflow-hidden border-b-2 border-black">
                <img
                  src="https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=800&q=80"
                  alt="Fox in wilderness"
                  className="w-full h-full object-cover grayscale contrast-125"
                />
              </div>
            </div>

            {/* Middle Window: City Aerial Feet (2020-04-06-blog.pdf) */}
            <div className="border-2 border-black bg-white shadow-[5px_5px_0px_#000] max-w-lg md:ml-48 -mt-16 sm:-mt-24 mb-6 z-10 relative transition-transform hover:-translate-y-1">
              <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#E2E2E2]">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                  <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                  <span className="h-3 w-3 rounded-full border border-black/80 bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                </div>
                <span className="font-mono text-xs font-bold text-black">
                  2020-04-06-blog.pdf
                </span>
              </div>
              <div className="h-56 sm:h-64 overflow-hidden border-b-2 border-black">
                <img
                  src="https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80"
                  alt="City rooftop feet looking down"
                  className="w-full h-full object-cover grayscale contrast-125"
                />
              </div>
            </div>

            {/* Bottom Window 1: Office Workspace (2020-04-06-blog.pdf) */}
            <div className="grid md:grid-cols-2 gap-6 -mt-8 sm:-mt-12 z-20 relative">
              <div className="border-2 border-black bg-white shadow-[5px_5px_0px_#000] transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#E2E2E2]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                  </div>
                  <span className="font-mono text-xs font-bold text-black">
                    2020-04-06-blog.pdf
                  </span>
                </div>
                <div className="h-48 overflow-hidden border-b-2 border-black">
                  <img
                    src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"
                    alt="Workspace interior"
                    className="w-full h-full object-cover grayscale contrast-125"
                  />
                </div>
              </div>

              {/* Bottom Window 2: Night City Bokeh (2020-04-06-blog.pdf) */}
              <div className="border-2 border-black bg-white shadow-[5px_5px_0px_#000] transition-transform hover:-translate-y-1">
                <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#E2E2E2]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                  </div>
                  <span className="font-mono text-xs font-bold text-black">
                    2020-04-06-blog.pdf
                  </span>
                </div>
                <div className="h-48 overflow-hidden border-b-2 border-black">
                  <img
                    src="https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80"
                    alt="Night city lights bokeh"
                    className="w-full h-full object-cover grayscale contrast-125"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. LEARN & CONTACT / INTEGRATION SECTION */}
        <section id="learn" className="w-full border-t-2 border-black bg-[#F5F5F5] py-12 sm:py-16">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <span className="inline-block px-2.5 py-0.5 border-2 border-black bg-white text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000] mb-3">
                  SIAJAR INTEGRATION
                </span>
                <h3 className="text-2xl sm:text-3xl font-heading font-black text-black mb-3">
                  Aesthetic retro design, modern power.
                </h3>
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed mb-6">
                  Website ini sepenuhnya mengadopsi tema retro Macintosh monokrom dengan kontras
                  tinggi, window controls ganda (○ ○), dan dither halftone texture. Terhubung
                  langsung dengan portal akademik SIAJAR.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="px-4 py-2 border-2 border-black bg-black text-white font-bold text-xs shadow-[3px_3px_0px_#000] hover:bg-white hover:text-black transition-all"
                  >
                    Buka Portal Kelas & Penilaian ↗
                  </Link>
                  <button
                    onClick={handleCopyLink}
                    className="px-4 py-2 border-2 border-black bg-white text-black font-bold text-xs shadow-[2.5px_2.5px_0px_#000] hover:bg-black hover:text-white transition-all inline-flex items-center gap-1.5"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'Tersalin!' : 'Bagikan Link'}</span>
                  </button>
                </div>
              </div>

              {/* Mini Window Preview */}
              <div className="border-2 border-black bg-white shadow-[4.5px_4.5px_0px_#000]">
                <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#E2E2E2]">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                    <span className="h-3 w-3 rounded-full border border-black/80 bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                  </div>
                  <span className="font-mono text-xs font-bold text-black">
                    siajar://system-status.log
                  </span>
                </div>
                <div className="p-4 font-mono text-xs text-gray-800 space-y-1.5">
                  <p className="font-bold text-black">✓ Theme: Retro Mac Monochrome (1984)</p>
                  <p>✓ Window frame: Dual circular controls (○ ○)</p>
                  <p>✓ Halftone Dither: Active on projects</p>
                  <p>✓ Academic Portal: Ready on /login</p>
                  <p className="text-gray-500 text-[11px] pt-2">
                    System ready. Memory 128K OK.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* -------------------- FOOTER / SYSTEM STATUS BAR -------------------- */}
      <footer id="contact" className="w-full border-t-2 border-black bg-[#E2E2E2] py-4">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono font-bold text-black">
          <div className="flex items-center gap-3">
            <span>Macintosh System 7.1</span>
            <span>•</span>
            <span>Theme: Mackenzie Child &quot;Hello. I&apos;m Mac.&quot;</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="underline hover:opacity-75">
              Portal SIAJAR
            </Link>
            <a
              href="https://webflow.com"
              target="_blank"
              rel="noreferrer"
              className="underline hover:opacity-75"
            >
              Webflow
            </a>
            <span className="text-gray-600">© 2026</span>
          </div>
        </div>
      </footer>

      {/* -------------------- INTERACTIVE MODAL -------------------- */}
      {activeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-md border-2 border-black bg-white shadow-[6px_6px_0px_#000] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b-2 border-black bg-[#E2E2E2]">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FF5F56] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                <span className="h-3 w-3 rounded-full border border-black/80 bg-[#FFBD2E] inline-block shadow-[0.5px_0.5px_0px_#000]" />
                <span className="h-3 w-3 rounded-full border border-black/80 bg-[#27C93F] inline-block shadow-[0.5px_0.5px_0px_#000]" />
              </div>
              <span className="font-mono text-xs font-bold text-black truncate max-w-[200px]">
                {activeModal === 'clone' ? 'clone-template.app' : `${activeModal}.detail`}
              </span>
              <button
                onClick={() => setActiveModal(null)}
                className="hover:opacity-75 focus:outline-none"
                aria-label="Tutup modal"
              >
                <X className="h-4 w-4 text-black" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4">
              {activeModal === 'clone' ? (
                <>
                  <h4 className="text-xl font-heading font-black text-black">
                    Clone me on Webflow
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Template desain retro ini terinspirasi langsung dari template Mackenzie Child
                    &quot;Hello. I&apos;m Mac.&quot; dengan gaya vintage Macintosh OS, halftone
                    dither texture, dan dual circle windows.
                  </p>
                  <div className="pt-2 flex flex-col gap-2">
                    <Link
                      href="/login"
                      className="w-full py-2 border-2 border-black bg-black text-white text-center font-bold text-xs shadow-[2.5px_2.5px_0px_#000] hover:bg-white hover:text-black transition-all"
                    >
                      Masuk ke Portal SIAJAR Sekarang
                    </Link>
                    <button
                      onClick={() => setActiveModal(null)}
                      className="w-full py-2 border-2 border-black bg-white text-black text-center font-bold text-xs shadow-[2.5px_2.5px_0px_#000] hover:bg-[#EAEAEA] transition-all"
                    >
                      Tutup Jendela
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h4 className="text-xl font-heading font-black text-black">
                    {activeModal}
                  </h4>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Dokumen retro ini siap dibuka dan ditinjau. Desain kartu menggunakan bingkai
                    jendela Mac klasik dengan drop shadow padat 4px.
                  </p>
                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      onClick={() => setActiveModal(null)}
                      className="px-4 py-2 border-2 border-black bg-white text-black font-bold text-xs shadow-[2.5px_2.5px_0px_#000] hover:bg-black hover:text-white transition-all"
                    >
                      Tutup
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
