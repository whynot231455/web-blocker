import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { BlockedSite } from '../../types/blockedSite';

interface UrlItemProps {
  site: BlockedSite;
  onDelete: (id: string) => void;
  onToggle: (id: string, currentStatus: boolean) => void;
}

export const UrlItem: React.FC<UrlItemProps> = ({ site, onDelete }) => {
  // Extract clean domain (strip leading www. for favicon lookup)
  const domain = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  // Display version always shows www.
  const displayUrl = domain.startsWith('www.') ? domain : `www.${domain}`;

  return (
    <div
      className="flex items-center justify-between px-2 py-3 hover:bg-gray-50 transition-colors"
      style={{ borderBottom: '1px solid #f0f0f0' }}
    >
      {/* Left: favicon + URL */}
      <div className="flex items-center gap-5">
        <div className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center shrink-0 bg-gray-50">
          <img
            src={faviconUrl}
            alt={domain}
            width={36}
            height={36}
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.onerror = null;
              target.src = `https://www.google.com/s2/favicons?domain=google.com&sz=64`;
            }}
          />
        </div>
        <span style={{ fontSize: '9px', letterSpacing: '0.05em', fontWeight: 'bold' }}>
          {displayUrl}
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-5">
        <button
          className="text-gray-700 hover:text-black transition-colors"
          aria-label="Edit"
        >
          <Pencil size={16} strokeWidth={2} />
        </button>
        <button
          onClick={() => onDelete(site.id)}
          className="text-gray-700 hover:text-red-600 transition-colors"
          aria-label="Delete"
        >
          <Trash2 size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
};

export default UrlItem;
