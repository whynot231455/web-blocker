import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle,
  Clock,
  Cloud,
  Lock,
  Target,
  Timer,
  UserCheck,
  XCircle,
  Zap,
} from 'lucide-react';
import { LandingHeaderCta } from '@/components/layout/LandingHeaderCta';
import { GITHUB_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/config/site';
import { LANDING_FAQ } from '@/data/landing-faq';
import { jsonLd } from '@/lib/seo';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const FEATURES = [
  {
    title: 'One-click website blocking',
    description: 'Add any distracting site to your block list and it stops loading in your browser.',
    icon: Zap,
  },
  {
    title: 'Schedule by time and day',
    description: 'Block a site only during set hours on the days you pick, such as weekdays from 9 to 5.',
    icon: CalendarClock,
  },
  {
    title: 'Works without an account',
    description: 'Guest mode needs no sign-up. Your block list stays in your browser.',
    icon: UserCheck,
  },
  {
    title: 'Optional cloud sync',
    description: 'Create an account to keep your blocked sites in sync across browsers and devices.',
    icon: Cloud,
  },
  {
    title: 'Focus sessions and stats',
    description: 'Track your focus time and see your progress on the dashboard.',
    icon: Timer,
  },
  {
    title: 'Private by design',
    description: 'No ads and no analytics trackers. The extension never sends your browsing data to a server.',
    icon: Lock,
  },
];

const STRUCTURED_DATA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    applicationCategory: 'BrowserApplication',
    operatingSystem: 'Chrome, Microsoft Edge, Brave',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: FEATURES.map((feature) => feature.title),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: LANDING_FAQ.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  },
];

export default function LandingPage() {
  return (
    <div className="theme-static-light min-h-screen bg-white text-black font-mono overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(STRUCTURED_DATA) }} />

      {/* Navbar */}
      <header className="flex items-center justify-between px-4 sm:px-8 py-6 sm:py-8 border-b-2 border-black sticky top-0 bg-white z-50 transform-gpu">
        <div className="flex items-center gap-4 flex-1">
          <Image
            src="/icons/logopic1-48.png"
            alt="CTRL+BLCK logo"
            width={48}
            height={48}
            className="object-contain"
          />
          <span className="text-xl font-bold tracking-tighter uppercase">CTRL + BLCK</span>
        </div>
        <nav aria-label="Primary" className="hidden md:flex items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-widest absolute left-1/2 transform -translate-x-1/2">
          <a href="#features" className="hover:underline">Features</a>
          <a href="#how-it-works" className="hover:underline">How it Works</a>
          <a href="#faq" className="hover:underline">FAQ</a>
        </nav>
        <div className="flex items-center justify-end gap-4 flex-1">
          <LandingHeaderCta />
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-16 sm:pt-24 sm:pb-32 border-b-2 border-black bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tight leading-tight mb-8">
                Block distracting websites. <br />
                <span className="bg-black text-white px-3 py-2 sm:px-4 inline-block mt-2 max-w-full">
                  Stay in deep focus.
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm font-bold text-gray-700 mb-12 leading-relaxed uppercase tracking-wider max-w-2xl mx-auto">
                The free website blocker for Chrome. Shut out distractions all day.
              </p>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-4 sm:gap-6 w-full max-w-xl mx-auto">
                <Link href="/login">
                  <button className="w-full sm:w-auto text-[11px] sm:text-[12px] font-bold uppercase tracking-widest bg-black text-white px-6 sm:px-10 py-5 sm:py-6 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.2)] hover:shadow-[8px_8px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-transform transition-shadow duration-200 flex items-center justify-center gap-3">
                    Get Started <ArrowRight size={20} />
                  </button>
                </Link>
                <Link
                  href="/install"
                  className="w-full sm:w-auto text-[11px] sm:text-[12px] font-bold uppercase tracking-widest bg-white text-black px-6 sm:px-10 py-5 sm:py-6 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-transform transition-shadow duration-200 inline-flex items-center justify-center text-center"
                >
                  Install Extension
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features section */}
        <section id="features" className="py-20 sm:py-32 bg-gray-50 border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="text-center mb-20">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6">A website blocker built for focus</h2>
              <p className="text-[10px] font-bold text-gray-600 max-w-lg mx-auto uppercase tracking-widest leading-loose">Block social media, video and news sites on your terms, built for developers, students and deep-work enthusiasts.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="bg-white p-10 border-2 border-black shadow-[8px_8px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 transition-transform">
                  <div className="w-16 h-16 bg-black text-white flex items-center justify-center mb-8 border-2 border-black">
                    <feature.icon size={32} />
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-4">{feature.title}</h3>
                  <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works section */}
        <section id="how-it-works" className="py-20 sm:py-32 bg-white border-b-2 border-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="text-center mb-24">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6">How to block websites in Chrome</h2>
              <p className="text-[10px] font-bold text-gray-600 max-w-lg mx-auto uppercase tracking-widest leading-loose">
                Three steps, then it runs quietly in the background.
              </p>
            </div>

            {/* Timeline / Flowchart */}
            <div className="relative mb-32 mt-12 md:mt-0">
              {/* Connecting line (hidden on mobile, visible on md+) */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-2 bg-black -translate-y-1/2 z-0 border-y-2 border-black"></div>

              <ol className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 relative z-10">
                {/* Step 1 */}
                <li className="bg-white p-10 border-2 border-black shadow-[8px_8px_0px_#000] relative group hover:-translate-y-2 transition-transform">
                  <div className="absolute -top-6 -left-3 sm:-left-6 w-12 h-12 bg-black text-white font-black text-xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_#ccc]">
                    01
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-4 mt-2">Install and add sites</h3>
                  <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">
                    Install the extension, then add the distracting websites you want to block to your list.
                  </p>
                </li>

                {/* Step 2 */}
                <li className="bg-white p-10 border-2 border-black shadow-[8px_8px_0px_#000] relative group hover:-translate-y-2 transition-transform">
                  <div className="absolute -top-6 -left-3 sm:-left-6 w-12 h-12 bg-black text-white font-black text-xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_#ccc]">
                    02
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-4 mt-2">Choose when to block</h3>
                  <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">
                    Block a site all day, or set a window with start and end times on the days of the week you pick.
                  </p>
                </li>

                {/* Step 3 */}
                <li className="bg-white p-10 border-2 border-black shadow-[8px_8px_0px_#000] relative group hover:-translate-y-2 transition-transform">
                  <div className="absolute -top-6 -left-3 sm:-left-6 w-12 h-12 bg-black text-white font-black text-xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_#ccc]">
                    03
                  </div>
                  <h3 className="text-lg font-black uppercase tracking-tighter mb-4 mt-2">Get into deep work</h3>
                  <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">
                    Blocked sites show a block page instead of loading. Sign in if you want your list and stats synced to the cloud.
                  </p>
                </li>
              </ol>
            </div>

            {/* Time Savings Comparison */}
            <div className="mt-20">
              <div className="text-center mb-12">
                <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-4">Why block distracting websites?</h2>
                <p className="text-[9px] font-bold text-gray-500 max-w-lg mx-auto uppercase tracking-widest">
                  See the difference when you take back control of your browser.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
                {/* Without CTRL+BLCK */}
                <div className="bg-gray-50 p-8 md:p-12 border-2 border-black shadow-[8px_8px_0px_#000]">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-black text-white flex items-center justify-center border-2 border-black">
                      <XCircle size={24} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tighter">Without CTRL+BLCK</h3>
                  </div>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <Clock className="text-gray-400 shrink-0 mt-1" size={20} />
                      <span className="text-[10px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">Hours slip away to social feeds and video sites</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <Zap className="text-gray-400 shrink-0 mt-1" size={20} />
                      <span className="text-[10px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">Constant tab switching breaks your concentration</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <Target className="text-gray-400 shrink-0 mt-1" size={20} />
                      <span className="text-[10px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">Deadlines get tighter and work piles up</span>
                    </li>
                  </ul>
                </div>

                {/* With CTRL+BLCK */}
                <div className="bg-black text-white p-8 md:p-12 border-2 border-black shadow-[8px_8px_0px_#ccc] relative">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-white text-black flex items-center justify-center border-2 border-black">
                      <CheckCircle size={24} />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tighter">With CTRL+BLCK</h3>
                  </div>
                  <ul className="space-y-6">
                    <li className="flex items-start gap-4">
                      <Clock className="text-gray-300 shrink-0 mt-1" size={20} />
                      <span className="text-[10px] font-bold text-gray-300 leading-relaxed uppercase tracking-widest">Distracting sites blocked automatically, all day or on a schedule</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <Zap className="text-gray-300 shrink-0 mt-1" size={20} />
                      <span className="text-[10px] font-bold text-gray-300 leading-relaxed uppercase tracking-widest">Uninterrupted deep work sessions</span>
                    </li>
                    <li className="flex items-start gap-4">
                      <Target className="text-gray-300 shrink-0 mt-1" size={20} />
                      <span className="text-[10px] font-bold text-gray-300 leading-relaxed uppercase tracking-widest">Clear focus stats so you can see your progress</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ section */}
        <section id="faq" className="py-20 sm:py-32 bg-gray-50 border-b-2 border-black">
          <div className="max-w-3xl mx-auto px-4 sm:px-8">
            <div className="text-center mb-16">
              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6">Frequently asked questions</h2>
              <p className="text-[10px] font-bold text-gray-600 max-w-lg mx-auto uppercase tracking-widest leading-loose">
                Quick answers about blocking websites with CTRL+BLCK.
              </p>
            </div>

            <div className="space-y-6">
              {LANDING_FAQ.map((item) => (
                <details key={item.question} className="group bg-white border-2 border-black shadow-[6px_6px_0px_#000]">
                  <summary className="cursor-pointer list-none p-6 flex items-center justify-between gap-4 text-xs font-black uppercase tracking-widest leading-relaxed">
                    <h3 className="text-xs font-black uppercase tracking-widest leading-relaxed">{item.question}</h3>
                    <span aria-hidden="true" className="shrink-0 text-lg group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="px-6 pb-6 text-xs font-bold text-gray-900 leading-[2]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/logopic1-48.png"
              alt="CTRL+BLCK logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-sm font-black uppercase tracking-widest">CTRL + BLCK</span>
          </div>
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest text-center">
            &copy; 2026 CTRL + BLCK.
          </p>
          <nav aria-label="Footer" className="flex gap-8 text-[8px] font-bold uppercase tracking-widest text-gray-500">
            <Link href="/install" className="hover:text-black transition-colors">Install</Link>
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy</Link>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">Github</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
