'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Clock, Settings, CircleUser } from 'lucide-react';
import Image from 'next/image';

export const Sidebar: React.FC = () => {
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { icon: <LayoutDashboard size={22} />, label: 'Dashboard', href: '/dashboard' },
    { icon: <Clock size={22} />, label: 'Sessions', href: '/sessions' },
    { icon: <Settings size={22} />, label: 'Settings', href: '/settings' },
    { icon: <CircleUser size={22} />, label: 'Account', href: '/account' },
  ];

  const isExpanded = isPinned || isHovered;

  return (
    <aside
      className="fixed top-0 left-0 h-full bg-white border-r-4 border-black transition-all duration-300 z-50 flex flex-col"
      style={{ width: isExpanded ? '260px' : '84px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hamburger */}
      <div className="flex items-center px-5 h-20 border-b-4 border-black">
        <button
          onClick={() => setIsPinned(!isPinned)}
          className="w-11 h-11 flex items-center justify-center border-2 border-black bg-white hover:bg-black shadow-[3px_3px_0px_#000] active:shadow-none active:translate-x-[1.5px] active:translate-y-[1.5px] transition-all shrink-0 overflow-hidden"
          aria-label="Toggle menu"
        >
          <Image src="/icons/logopic1-48.png" alt="Control Block Logo" width={32} height={32} className="object-contain" unoptimized />
        </button>
        {isExpanded && (
          <span className="ml-4 text-[12px] font-black tracking-widest whitespace-nowrap overflow-hidden">
            CTRL+BLCK
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col justify-center gap-6 px-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 p-3 transition-all border-2 ${
                isActive
                  ? 'bg-[#FF4141] text-white border-black shadow-[4px_4px_0px_#000]'
                  : 'text-black border-transparent hover:border-black hover:bg-gray-50'
              }`}
            >
              <div className="shrink-0 flex items-center justify-center w-6 h-6">
                {item.icon}
              </div>
              {isExpanded && (
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};


