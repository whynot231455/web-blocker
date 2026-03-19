import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import { BlockedSite } from '../../types/blockedSite';

interface UrlItemProps {
  site: BlockedSite;
  onDelete: (id: string) => void;
  onToggle: (id: string, currentStatus: boolean) => void;
}

export const UrlItem: React.FC<UrlItemProps> = ({ site, onDelete }) => {
  const [iconError, setIconError] = React.useState(false);
  
  // Extract clean domain (strip leading www. for favicon lookup)
  const cleanDomain = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '');
  const domain = site.url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${cleanDomain}&sz=128`;
  const alternateFaviconUrl = `https://icon.horse/icon/${cleanDomain}`;
  
  // Display version always shows www.
  const displayUrl = domain.startsWith('www.') ? domain : `www.${domain}`;
  
  // Get first letter for fallback icon
  const firstLetter = cleanDomain.charAt(0).toUpperCase();

  return (
    <div
      className="flex items-center justify-between px-2 py-3 hover:bg-gray-50 transition-colors"
      style={{ borderBottom: '1px solid #f0f0f0' }}
    >
      {/* Left: favicon + URL */}
      <div className="flex items-center gap-5">
        <div className="w-10 h-10 rounded-md overflow-hidden flex items-center justify-center shrink-0 bg-gray-50 border border-gray-100">
          {!iconError ? (
            <img
              src={faviconUrl}
              alt={domain}
              width={32}
              height={32}
              className="object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src === faviconUrl) {
                  target.src = alternateFaviconUrl;
                } else {
                  setIconError(true);
                }
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black text-white text-[14px] font-bold">
              {firstLetter}
            </div>
          )}
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
