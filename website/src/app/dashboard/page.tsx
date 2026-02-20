'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { UrlList } from '@/components/dashboard/UrlList';
import { AddUrlModal } from '@/components/dashboard/AddUrlModal';
import { useBlockedSites } from '@/hooks/useBlockedSites';

export default function DashboardPage() {
  const { sites, loading, addSite, deleteSite, toggleSite } = useBlockedSites();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Slim left sidebar — fixed width 60px */}
      <Sidebar />

      {/* Main content — pushed right of sidebar */}
      <div
        className="flex flex-col flex-1 min-h-screen"
        style={{ marginLeft: '60px' }}
      >
        {/* Centered branding header */}
        <Header />

        {/* URL List — centered in the remaining space */}
        <main className="flex-1 flex justify-center px-8 pb-12">
          <div className="w-full max-w-2xl">
            <UrlList
              sites={sites}
              isLoading={loading}
              onDelete={(id) => deleteSite(id)}
              onToggle={(id, status) => toggleSite(id, status)}
            />
          </div>
        </main>
      </div>

      <AddUrlModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={async (url) => { await addSite(url); }}
      />
    </div>
  );
}
