'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  FolderOpen, 
  Chrome, 
  Copy, 
  Check, 
  CheckCircle, 
  AlertTriangle,
  ArrowRight,
  LogIn
} from 'lucide-react';
import { useExtensionDetected } from '@/hooks/useExtensionDetected';

export default function InstallPage() {
  const { status } = useExtensionDetected();
  const router = useRouter();

  const [isDownloading, setIsDownloading] = useState(false);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(3);

  // Auto-redirect if extension is detected
  useEffect(() => {
    if (status === 'installed') {
      const interval = setInterval(() => {
        setRedirectCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Handle redirect side effect when countdown reaches 0
  useEffect(() => {
    if (status === 'installed' && redirectCountdown === 0) {
      router.push('/dashboard');
    }
  }, [status, redirectCountdown, router]);

  const handleDownload = () => {
    setIsDownloading(true);
    
    // Trigger download
    const link = document.createElement('a');
    link.href = '/api/download-extension';
    link.download = 'ctrl-blck-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Mock completion transition for UX feel
    setTimeout(() => {
      setIsDownloading(false);
      setHasDownloaded(true);
    }, 1500);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText('chrome://extensions');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="theme-static-light min-h-screen bg-white text-black py-12 px-4 flex flex-col items-center justify-center font-mono">
      {/* Back Link */}
      <div className="w-full max-w-2xl mb-8 flex justify-start">
        <Link href="/" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black hover:opacity-75 transition-opacity">
          <ArrowLeft size={14} className="stroke-[3px]" /> Back to Home
        </Link>
      </div>

      {/* Main card */}
      <div className="w-full max-w-2xl bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_#000] relative">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 border-b-4 border-black pb-8">
          <Image
            src="/icons/logopic1-48.png"
            alt="CTRL+BLCK Logo"
            width={48}
            height={48}
            className="mb-4 object-contain"
            unoptimized
          />
          <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight mb-2">
            INSTALL CTRL+BLCK
          </h1>
          <p className="text-[9px] md:text-[10px] font-bold text-gray-600 uppercase tracking-widest leading-relaxed">
            Follow these steps to activate the web blocker in your browser
          </p>
        </div>

        {/* Live Detector Panel */}
        <div className="mb-10 border-4 border-black p-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className={`w-3 h-3 border border-black rounded-full ${
              status === 'installed' ? 'bg-[#10B981] animate-pulse' : 'bg-[#FF9F1C] animate-pulse'
            }`} />
            <h4 className="text-[10px] font-black uppercase tracking-widest">
              Live Detector
            </h4>
          </div>

          {status === 'checking' && (
            <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">
              PROBING EXTENSION STATUS...
            </p>
          )}

          {status === 'not_installed' && (
            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">
              WAITING FOR LOADED UNPACKED EXTENSION...
            </p>
          )}

          {status === 'installed' && (
            <div className="space-y-4">
              <div className="bg-[#D1FAE5] border-2 border-black text-[#065F46] p-4 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000]">
                <CheckCircle size={16} />
                You have already installed the extension
              </div>
              <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">
                Redirecting to the main dashboard now
              </p>
              <Link href="/dashboard" className="block w-full">
                <button className="w-full py-4 text-[10px] font-bold uppercase tracking-widest bg-black text-white border-2 border-black shadow-[4px_4px_0px_#000] hover:bg-gray-800 cursor-pointer">
                  Go to Dashboard Now
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Step 0: Download Zip */}
        <div className="mb-10 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest mb-4">
            Click the button below to download the latest extension files from GitHub
          </p>
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full py-6 text-[12px] font-bold uppercase tracking-widest bg-[#FF4141] text-white border-4 border-black shadow-[8px_8px_0px_#000] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3 cursor-pointer"
          >
            <Download size={18} className="stroke-[3px]" />
            {isDownloading ? 'Downloading...' : hasDownloaded ? 'Download Again' : 'Download Extension ZIP'}
          </button>
        </div>

        {/* Step Guide List */}
        <div className={`space-y-8 transition-opacity duration-300 ${hasDownloaded ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <h2 className="text-[12px] font-black uppercase tracking-widest border-b-2 border-black pb-2 mb-4">
            Installation Steps {hasDownloaded ? '🔓' : '🔒 (Download First)'}
          </h2>

          {/* Step 1 */}
          <div className="flex gap-6 items-start border-2 border-black p-6 bg-gray-50 shadow-[4px_4px_0px_#000]">
            <div className="w-12 h-12 shrink-0 bg-black text-white border-2 border-black flex items-center justify-center font-bold text-sm">
              01
            </div>
            <div className="space-y-2">
              <h3 className="text-[11px] font-black uppercase tracking-tight flex items-center gap-2">
                <FolderOpen size={16} /> Extract the ZIP File
              </h3>
              <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-wider">
                Find the downloaded <span className="underline">ctrl-blck-extension.zip</span> and extract it. Keep the extracted folder in a safe place (like your Documents folder). Do not delete or rename it, as Chrome reads from it directly.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-6 items-start border-2 border-black p-6 bg-gray-50 shadow-[4px_4px_0px_#000]">
            <div className="w-12 h-12 shrink-0 bg-black text-white border-2 border-black flex items-center justify-center font-bold text-sm">
              02
            </div>
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <h3 className="text-[11px] font-black uppercase tracking-tight flex items-center gap-2">
                  <Chrome size={16} /> Load Unpacked in Chrome
                </h3>
                <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-wider">
                  Open a new tab and go to <code className="bg-gray-200 px-1 border border-black font-mono lowercase">chrome://extensions</code> or copy the URL to paste it in your browser bar:
                </p>
              </div>

              {/* Copy URL Helper */}
              <button
                onClick={handleCopy}
                className="py-3 px-6 text-[9px] font-bold uppercase tracking-widest bg-white text-black border-2 border-black shadow-[4px_4px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
              >
                {copied ? <Check size={12} className="stroke-[3px]" /> : <Copy size={12} className="stroke-[3px]" />}
                {copied ? 'Copied!' : 'Copy chrome://extensions'}
              </button>

              <div className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-wider space-y-2">
                <p>1. Enable <span className="font-black text-black">"Developer mode"</span> toggle switch in the top-right corner.</p>
                <p>2. Click <span className="font-black text-black">"Load unpacked"</span> button in the top-left corner.</p>
                <p>3. Select the extracted <span className="font-black text-black">ctrl-blck-extension</span> folder.</p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-6 items-start border-2 border-black p-6 bg-gray-50 shadow-[4px_4px_0px_#000]">
            <div className="w-12 h-12 shrink-0 bg-black text-white border-2 border-black flex items-center justify-center font-bold text-sm">
              03
            </div>
            <div className="space-y-4 flex-1">
              <div className="space-y-2">
                <h3 className="text-[11px] font-black uppercase tracking-tight flex items-center gap-2">
                  <LogIn size={16} /> Login or Continue
                </h3>
                <p className="text-[9px] font-bold text-gray-600 leading-relaxed uppercase tracking-wider">
                  Once loaded, pin CTRL+BLCK to your extensions toolbar. Click on the extension icon to login with your account or continue as Guest Mode to start blocking immediately!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login" className="flex-1">
                  <button className="w-full py-4 text-[9px] font-bold uppercase tracking-widest bg-black text-white border-2 border-black shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:bg-gray-800 flex items-center justify-center gap-2 cursor-pointer">
                    Login / Continue as Guest <ArrowRight size={12} />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
