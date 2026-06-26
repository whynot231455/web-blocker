import Link from 'next/link';
import Image from 'next/image';
import { Shield, Zap, Target, ArrowRight, CheckCircle, XCircle, Clock } from 'lucide-react';


export default function LandingPage() {
  return (
    <div className="theme-static-light min-h-screen bg-white text-black font-mono">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-8 border-b-2 border-black sticky top-0 bg-white z-50 transform-gpu">
        <div className="flex items-center gap-4 flex-1">
          <Image
            src="/icons/logopic1-48.png"
            alt="CTRL+BLCK Logo"
            width={48}
            height={48}
            className="object-contain"
          />
          <span className="text-xl font-bold tracking-tighter uppercase">CTRL + BLCK</span>
        </div>
        <div className="hidden md:flex items-center justify-center gap-8 text-[10px] font-bold uppercase tracking-widest absolute left-1/2 transform -translate-x-1/2">
          <a href="#features" className="hover:underline">Features</a>
          <a href="#how-it-works" className="hover:underline">How it Works</a>
        </div>
        <div className="flex items-center justify-end gap-4 flex-1">
          <Link href="/login">
            <button className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-gray-100 transition-colors">Login</button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 border-b-2 border-black bg-white">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight leading-tight mb-8">
              Reclaim your focus. <br />
              <span className="bg-black text-white px-4 py-2 inline-block mt-2">
                Block distractions.
              </span>
            </h1>
            <p className="text-xs md:text-sm font-bold text-gray-700 mb-12 leading-relaxed uppercase tracking-wider max-w-2xl mx-auto">
              The lightweight Chrome Extension that helps you stay productive by blocking distracting websites with a seamless, synced experience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/login">
                <button className="text-[12px] font-bold uppercase tracking-widest bg-black text-white px-10 py-6 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.2)] hover:shadow-[8px_8px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-transform transition-shadow duration-200 flex items-center gap-3">
                  Get Started <ArrowRight size={20} />
                </button>
              </Link>
              <Link
                href="/install"
                className="text-[12px] font-bold uppercase tracking-widest bg-white text-black px-10 py-6 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-transform transition-shadow duration-200 inline-block text-center"
              >
                Install Extension
              </Link>
            </div>
            <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-[8px] font-bold uppercase tracking-widest text-gray-500">
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-black" /> Free forever</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-black" /> Manifest V3 Ready</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-black" /> Supabase Synced</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
      <section id="features" className="py-32 bg-gray-50 border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6">Everything you need to focus</h2>
            <p className="text-[10px] font-bold text-gray-600 max-w-lg mx-auto uppercase tracking-widest leading-loose">Built for developers and deep-work enthusiasts who value their time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: 'One-Click Blocking', description: 'Block any site instantly from our sleek pixel-perfect interface.', icon: Zap },
              { title: 'Cloud Sync', description: 'Sync your blocked sites across all browsers and devices with Supabase.', icon: Shield },
              { title: 'Productivity Stats', description: 'Visualize your progress and reclaimed focus time in the dashboard.', icon: Target },
            ].map((feature) => (
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
      <section id="how-it-works" className="py-32 bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-24">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-6">How It Works</h2>
            <p className="text-[10px] font-bold text-gray-600 max-w-lg mx-auto uppercase tracking-widest leading-loose">
              A simple, silent background process that keeps you locked in.
            </p>
          </div>

          {/* Timeline / Flowchart */}
          <div className="relative mb-32 mt-12 md:mt-0">
            {/* Connecting line (hidden on mobile, visible on md+) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-2 bg-black -translate-y-1/2 z-0 border-y-2 border-black"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 relative z-10">
              {/* Step 1 */}
              <div className="bg-white p-10 border-2 border-black shadow-[8px_8px_0px_#000] relative group hover:-translate-y-2 transition-transform">
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-black text-white font-black text-xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_#ccc]">
                  01
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter mb-4 mt-2">Set Boundaries</h3>
                <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">
                  Install the extension and add your most distracting sites to the blocklist.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-10 border-2 border-black shadow-[8px_8px_0px_#000] relative group hover:-translate-y-2 transition-transform">
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-black text-white font-black text-xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_#ccc]">
                  02
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter mb-4 mt-2">Silent Intercept</h3>
                <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">
                  The tool runs silently in the background, blocking distractions before they load.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-10 border-2 border-black shadow-[8px_8px_0px_#000] relative group hover:-translate-y-2 transition-transform">
                <div className="absolute -top-6 -left-6 w-12 h-12 bg-black text-white font-black text-xl flex items-center justify-center border-2 border-black shadow-[4px_4px_0px_#ccc]">
                  03
                </div>
                <h3 className="text-lg font-black uppercase tracking-tighter mb-4 mt-2">Deep Work</h3>
                <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">
                  Your data syncs securely to the cloud, giving you actionable productivity stats.
                </p>
              </div>
            </div>
          </div>

          {/* Time Savings Comparison */}
          <div className="mt-20">
            <div className="text-center mb-12">
              <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-4">The Cost of Distraction</h3>
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
                  <h4 className="text-lg font-black uppercase tracking-tighter">Without CTRL+BLCK</h4>
                </div>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <Clock className="text-gray-400 shrink-0 mt-1" size={20} />
                    <span className="text-[10px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">2+ hours lost daily to doomscrolling</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <Zap className="text-gray-400 shrink-0 mt-1" size={20} />
                    <span className="text-[10px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">Shattered focus and fragmented attention span</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <Target className="text-gray-400 shrink-0 mt-1" size={20} />
                    <span className="text-[10px] font-bold text-gray-600 leading-relaxed uppercase tracking-widest">Missed deadlines and prolonged anxiety</span>
                  </li>
                </ul>
              </div>

              {/* With CTRL+BLCK */}
              <div className="bg-black text-white p-8 md:p-12 border-2 border-black shadow-[8px_8px_0px_#ccc] relative">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-white text-black flex items-center justify-center border-2 border-black">
                    <CheckCircle size={24} />
                  </div>
                  <h4 className="text-lg font-black uppercase tracking-tighter">With CTRL+BLCK</h4>
                </div>
                <ul className="space-y-6">
                  <li className="flex items-start gap-4">
                    <Clock className="text-gray-300 shrink-0 mt-1" size={20} />
                    <span className="text-[10px] font-bold text-gray-300 leading-relaxed uppercase tracking-widest">Hours of reclaimed free time every week</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <Zap className="text-gray-300 shrink-0 mt-1" size={20} />
                    <span className="text-[10px] font-bold text-gray-300 leading-relaxed uppercase tracking-widest">Uninterrupted deep work sessions</span>
                  </li>
                  <li className="flex items-start gap-4">
                    <Target className="text-gray-300 shrink-0 mt-1" size={20} />
                    <span className="text-[10px] font-bold text-gray-300 leading-relaxed uppercase tracking-widest">Tasks finished early and goals achieved</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-3">
            <Image
              src="/icons/logopic1-48.png"
              alt="CTRL+BLCK Logo"
              width={32}
              height={32}
              className="object-contain"
            />
            <span className="text-sm font-black uppercase tracking-widest">CTRL + BLCK</span>
          </div>
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest text-center">
            &copy; 2026 CTRL + BLCK.
          </p>
          <div className="flex gap-8 text-[8px] font-bold uppercase tracking-widest text-gray-500">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="https://github.com/whynot231455/web-blocker" className="hover:text-black transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
