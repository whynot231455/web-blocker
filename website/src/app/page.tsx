import React from 'react';
import Link from 'next/link';
import { Shield, Zap, Target, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Shield size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight font-mono">CTRL+BLCK</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it Works</a>
          <a href="#pricing" className="hover:text-blue-600 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="primary" className="rounded-full px-6">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold mb-6 animate-bounce">
              <Zap size={14} />
              NEW: SUPABASE SYNC NOW LIVE
            </div>
            <h1 className="text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
              Reclaim your focus. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Block distractions.
              </span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 leading-relaxed">
              The lightweight Chrome Extension that helps you stay productive by blocking distracting websites with a seamless, synced experience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/dashboard">
                <Button variant="primary" className="text-lg py-6 px-10 rounded-full shadow-xl shadow-blue-200">
                  Go to Dashboard <ArrowRight className="ml-2" />
                </Button>
              </Link>
              <Button variant="secondary" className="text-lg py-6 px-10 rounded-full">
                Install Extension
              </Button>
            </div>
            <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400 font-medium">
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Free forever</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Manifest V3 Ready</div>
              <div className="flex items-center gap-2"><CheckCircle size={16} className="text-green-500" /> Supabase Synced</div>
            </div>
          </div>
        </div>
        
        {/* Background blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-50 rounded-full blur-3xl opacity-50"></div>
      </section>

      {/* Features section */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to stay focused</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Built for developers and deep-work enthusiasts who value their time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'One-Click Blocking', description: 'Block any site instantly from our sleek popup interface.', icon: Zap, color: 'text-orange-500 bg-orange-100' },
              { title: 'Cloud Sync', description: 'Sync your blocked sites across all browsers and devices with Supabase.', icon: Shield, color: 'text-blue-500 bg-blue-100' },
              { title: 'Productivity Stats', description: 'Visualize your progress and reclaimed focus time in the dashboard.', icon: Target, color: 'text-purple-500 bg-purple-100' },
            ].map((feature) => (
              <div key={feature.title} className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.color}`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Shield size={20} />
            <span className="font-bold font-mono">CTRL+BLCK</span>
          </div>
          <p className="text-sm text-gray-400">&copy; 2026 CTRL+BLCK. Built with Next.js & Supabase.</p>
          <div className="flex gap-6 text-sm text-gray-400">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Github</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
