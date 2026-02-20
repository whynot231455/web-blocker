import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Shield, Zap, Target, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-black font-mono">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-8 border-b-2 border-black sticky top-0 bg-white z-50">
        <div className="flex items-center gap-4">
          <Image
            src="/icons/logopic1-48.png"
            alt="CTRL+BLCK Logo"
            width={48}
            height={48}
            className="object-contain"
            unoptimized
          />
          <span className="text-xl font-bold tracking-tighter uppercase">CTRL + BLCK</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest">
          <a href="#features" className="hover:underline">Features</a>
          <a href="#how-it-works" className="hover:underline">How it Works</a>
          <a href="#pricing" className="hover:underline">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <button className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 hover:bg-gray-100 transition-colors">Login</button>
          </Link>
          <Link href="/dashboard">
            <button className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-6 py-3 border-2 border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 border-b-2 border-black overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-3 px-4 py-2 border-2 border-black bg-white mb-8 animate-pulse shadow-[4px_4px_0px_#000]">
              <Zap size={14} />
              <span className="text-[8px] font-bold uppercase">NEW: SUPABASE SYNC NOW LIVE</span>
            </div>
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
              <Link href="/dashboard">
                <button className="text-[12px] font-bold uppercase tracking-widest bg-black text-white px-10 py-6 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.2)] hover:shadow-[8px_8px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-3">
                  Go to Dashboard <ArrowRight size={20} />
                </button>
              </Link>
              <button className="text-[12px] font-bold uppercase tracking-widest bg-white text-black px-10 py-6 border-2 border-black shadow-[8px_8px_0px_rgba(0,0,0,0.1)] hover:shadow-[8px_8px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all">
                Install Extension
              </button>
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
              unoptimized
            />
            <span className="text-sm font-black uppercase tracking-widest">CTRL + BLCK</span>
          </div>
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest text-center">
            &copy; 2026 CTRL + BLCK. Built with Next.js & Supabase.
          </p>
          <div className="flex gap-8 text-[8px] font-bold uppercase tracking-widest text-gray-500">
            <a href="#" className="hover:text-black transition-colors">Privacy</a>
            <a href="#" className="hover:text-black transition-colors">Terms</a>
            <a href="#" className="hover:text-black transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
