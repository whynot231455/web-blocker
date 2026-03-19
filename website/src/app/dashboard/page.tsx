'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { UrlList } from '@/components/dashboard/UrlList';
import { AddUrlModal } from '@/components/dashboard/AddUrlModal';
import { useBlockedSites } from '@/hooks/useBlockedSites';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, isGuest, loading: authLoading } = useAuth();
  const { sites, loading: sitesLoading, addSite, deleteSite, toggleSite } = useBlockedSites();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();

  // Redirect to login if not authenticated and not a guest
  useEffect(() => {
    if (!authLoading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, isGuest, authLoading, router]);

  if (authLoading || (!user && !isGuest)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

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
              isLoading={sitesLoading}
              onDelete={(id) => deleteSite(id)}
              onToggle={(id, status) => toggleSite(id, status)}
              onOpenAddModal={() => setIsAddModalOpen(true)}
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
