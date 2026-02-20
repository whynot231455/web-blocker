'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, LayoutDashboard, Clock, Settings, CircleUser } from 'lucide-react';

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
      className="fixed top-0 left-0 h-full bg-white border-r border-gray-200 transition-all duration-200 z-50 flex flex-col"
      style={{ width: isExpanded ? '200px' : '60px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hamburger */}
      <div className="flex items-center p-4 h-16 border-b border-gray-100">
        <button
          onClick={() => setIsPinned(!isPinned)}
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded transition-colors shrink-0"
          aria-label="Toggle menu"
        >
          <Menu size={22} strokeWidth={2.5} />
        </button>
        {isExpanded && (
          <span className="ml-3 text-[10px] font-bold whitespace-nowrap overflow-hidden">
            CTRL+BLCK
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col justify-center gap-2 px-3">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded transition-colors ${
                isActive
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-gray-100'
              }`}
            >
              <span className="shrink-0">{item.icon}</span>
              {isExpanded && (
                <span className="text-[10px] font-bold uppercase whitespace-nowrap">
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

export default Sidebar;
