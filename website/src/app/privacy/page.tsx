import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div
      className="theme-static-light min-h-screen bg-white text-black font-mono"
      style={{ fontFamily: "'Press Start 2P', cursive" }}
    >
      {/* Simple nav */}
      <nav className="flex items-center justify-between px-8 py-8 border-b-2 border-black">
        <div className="flex items-center gap-4">
          <Image src="/icons/logopic1-48.png" alt="Logo" width={36} height={36} className="object-contain" unoptimized />
          <span className="text-lg font-bold tracking-tighter uppercase">CTRL + BLCK</span>
        </div>
        <Link href="/" className="flex items-center gap-2 text-[8px] hover:opacity-70 transition-opacity">
          <ArrowLeft size={12} /> BACK TO HOME
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-8 py-16">
        <h1 className="text-2xl font-black uppercase tracking-tight mb-8">Privacy Policy</h1>
        <div className="text-[9px] leading-loose space-y-6 text-gray-700" style={{ fontFamily: "'Courier New', monospace" }}>
          <p><strong className="text-black">Last updated:</strong> 2026</p>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-black mb-3">1. Information We Collect</h2>
            <p>CTRL+BLCK operates primarily in <strong>Guest Mode</strong> by default. All blocked-site lists, focus session data, and preferences are stored <strong>locally in your browser</strong> (localStorage). We do not collect, transmit, or store this data on any server unless you explicitly create an account.</p>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-black mb-3">2. Account Data</h2>
            <p>When account creation becomes available, users who choose to register will have their email address and hashed password stored via <strong>Supabase</strong> (our authentication provider). Supabase handles data in compliance with industry standards. We never share your email with third parties.</p>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-black mb-3">3. Chrome Extension</h2>
            <p>The Chrome extension runs entirely client-side. It reads the URL of the current tab to compare against your block list. No browsing data is sent to external servers.</p>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-black mb-3">4. Third-Party Services</h2>
            <p>We use <strong>Supabase</strong> for authentication when accounts launch. Supabase's privacy policy applies to any data stored on their platform. We do not use analytics trackers, ads, or cookies beyond what is strictly necessary for the extension to function.</p>
          </section>

          <section>
            <h2 className="text-sm font-black uppercase tracking-widest text-black mb-3">5. Contact</h2>
            <p>For privacy-related inquiries, open an issue on our <a href="https://github.com/whynot231455/web-blocker" className="text-black underline hover:opacity-70">GitHub repository</a>.</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t-2 border-black">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <p className="text-[7px] text-gray-500 uppercase tracking-widest">&copy; 2026 CTRL + BLCK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
