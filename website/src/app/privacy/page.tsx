import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How CTRL+BLCK handles your data: guest mode keeps everything in your browser, and the extension sends no browsing data to any server.',
  alternates: { canonical: '/privacy' },
};

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
        <Link href="/" className="flex items-center gap-2 text-[10px] hover:opacity-70 transition-opacity">
          <ArrowLeft size={12} /> BACK TO HOME
        </Link>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 sm:px-8 py-16">
        <h1 className="text-3xl font-black uppercase tracking-tight mb-10">Privacy Policy</h1>
        <div className="text-xs leading-[2.1] space-y-10 text-gray-900">
          <p><strong className="text-black">Last updated:</strong> October 8, 2026</p>

          <section>
            <h2 className="text-base font-black uppercase tracking-widest text-black mb-4">1. Information We Collect</h2>
            <p>CTRL+BLCK operates primarily in <strong>Guest Mode</strong> by default. All blocked-site lists, focus session data, and preferences are stored <strong>locally in your browser</strong> (localStorage). We do not collect, transmit, or store this data on any server unless you explicitly create an account.</p>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-widest text-black mb-4">2. Account Data</h2>
            <p>If you choose to create an account, whether with an email and password or by signing in with Google, your account details are handled by <strong>Supabase</strong> (our authentication provider). For email sign-ups, your email address and a hashed password are stored there. When you sign in, your blocked-site list, including any block windows you set, is also stored in your account so it can sync across your browsers and devices. Supabase handles data in compliance with industry standards. Your email will never be shared with third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-widest text-black mb-4">3. Chrome Extension</h2>
            <p>The Chrome extension runs entirely client-side. It reads the URL of the current tab to compare against your block list. No browsing data is sent to external servers.</p>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-widest text-black mb-4">4. Third-Party Services</h2>
            <p>We use <strong>Supabase</strong> for authentication and account sync. Supabase&apos;s privacy policy applies to any data stored on their platform. We do not use analytics trackers, ads, or cookies beyond what is strictly necessary for the extension to function.</p>
          </section>

          <section>
            <h2 className="text-base font-black uppercase tracking-widest text-black mb-4">5. Contact</h2>
            <p>For privacy-related inquiries, open an issue on our <a href="https://github.com/whynot231455/web-blocker" className="text-black underline hover:opacity-70">GitHub repository</a>.</p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-12 border-t-2 border-black">
        <div className="max-w-3xl mx-auto px-8 text-center">
          <p className="text-[9px] text-gray-600 uppercase tracking-widest">&copy; 2026 CTRL + BLCK. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
