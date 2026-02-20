'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Clock, History, Calendar } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';

export default function SessionsPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 font-mono">Focus Sessions</h2>
            <p className="text-gray-500">Keep track of your dedicated work time.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StatsCard title="Total Sessions" value="15" icon={History} color="blue" />
            <StatsCard title="Focus Time" value="24h 30m" icon={Clock} color="purple" />
            <StatsCard title="Last Active" value="Today" icon={Calendar} color="green" />
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="font-semibold text-gray-800">Recent Sessions</h3>
            </div>
            <div className="divide-y divide-gray-100 italic text-gray-400 p-8 text-center">
              No sessions recorded yet. Start a focus mode to see your data here!
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
