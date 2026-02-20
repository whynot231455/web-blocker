'use client';

import React from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { User, Mail, Shield, Award } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function AccountPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="p-8 max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 font-mono">My Account</h2>
            <p className="text-gray-500">Manage your profile and subscription.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-4 border-white shadow-md mx-auto mb-4 text-3xl">
                  S
                </div>
                <h3 className="text-lg font-bold text-gray-900">Shibu</h3>
                <p className="text-sm text-gray-500">Free Account</p>
                <Button className="w-full mt-6" variant="primary">Edit Profile</Button>
              </div>

              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h4 className="font-semibold text-gray-800 mb-4">Quick Stats</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2"><Clock size={14} /> Total Focus</span>
                    <span className="font-medium">124h</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-2"><Shield size={14} /> Sites Blocked</span>
                    <span className="font-medium">42</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                  <User size={20} className="text-blue-500" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Full Name</label>
                    <p className="text-gray-900 font-medium pb-2 border-b">Shibu User</p>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">Email Address</label>
                    <p className="text-gray-900 font-medium pb-2 border-b">shibu@example.com</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900">
                  <Award size={20} className="text-purple-500" />
                  Subscription Plan
                </h3>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div>
                    <h4 className="font-bold text-purple-900">Free Plan</h4>
                    <p className="text-sm text-purple-700">Basic blocking features included.</p>
                  </div>
                  <Button variant="secondary" className="bg-white hover:bg-white/90 border-purple-200 text-purple-600">Upgrade to Pro</Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const Clock = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);
