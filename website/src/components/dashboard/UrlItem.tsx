import React from 'react';
import { Trash2, Pencil } from 'lucide-react';
import Image from 'next/image';
import { BlockedSite } from '../../types/blockedSite';

interface UrlItemProps {
  site: BlockedSite;
  onDelete: (id: string) => void;
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
    <div className="flex items-center justify-between px-2 py-5 hover:bg-gray-50/50 transition-all border-b border-gray-100 group">
      {/* Left: favicon + URL */}
      <div className="flex items-center gap-6">
        <div className="w-10 h-10 flex items-center justify-center shrink-0">
          {!iconError ? (
            <Image
              src={faviconUrl}
              alt={domain}
              width={32}
              height={32}
              className="w-8 h-8 object-contain transition-transform group-hover:scale-110"
              unoptimized
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
            <div className="w-8 h-8 flex items-center justify-center bg-black text-white text-[10px] font-black rounded-sm shadow-[2px_2px_0px_#FF4141]">
              {firstLetter}
            </div>
          )}
        </div>
        <span className="text-[10px] font-black tracking-tight text-black uppercase">
          {displayUrl}
        </span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-6 opacity-30 group-hover:opacity-100 transition-opacity">
        <button
          className="text-black hover:scale-110 transition-transform"
          aria-label="Edit"
        >
          <Pencil size={14} strokeWidth={3} />
        </button>
        <button
          onClick={() => onDelete(site.id)}
          className="text-black hover:text-[#FF4141] hover:scale-110 transition-all"
          aria-label="Delete"
        >
          <Trash2 size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};


