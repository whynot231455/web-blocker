'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';
import { Shield, Bell, Moon, Sliders } from 'lucide-react';

export default function SettingsPage() {
  const sections = [
    { title: 'Privacy & Security', icon: Shield, description: 'Manage your data and account security.' },
    { title: 'Notifications', icon: Bell, description: 'Configure how you want to be alerted.' },
    { title: 'Appearance', icon: Moon, description: 'Switch between light and dark modes.' },
    { title: 'Advanced', icon: Sliders, description: 'Fine-tune your blocking algorithms.' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 font-mono">Settings</h2>
            <p className="text-gray-500">Configure CTRL+BLCK to suit your workflow.</p>
          </div>

          <div className="space-y-6">
            {sections.map((section) => (
              <div key={section.title} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                    <section.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{section.title}</h3>
                    <p className="text-sm text-gray-400">{section.description}</p>
                  </div>
                </div>
                <Button variant="ghost">Manage</Button>
              </div>
            ))}
          </div>

          <div className="mt-10 p-6 bg-blue-600 rounded-xl text-white shadow-lg overflow-hidden relative">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Sync with Chrome Extension</h3>
              <p className="max-w-md text-blue-100 mb-4 text-sm">
                Ensure your blocked sites are synced across all your devices using our seamless Supabase integration.
              </p>
              <Button variant="secondary" className="text-blue-600 font-bold border-none shadow-md">
                View Sync Status
              </Button>
            </div>
            <div className="absolute right-[-20px] top-[-20px] opacity-10">
              <Zap size={150} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const Zap = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);
