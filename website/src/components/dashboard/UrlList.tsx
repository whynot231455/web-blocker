import React from 'react';
import { UrlItem } from './UrlItem';
import { BlockedSite } from '../../types/blockedSite';
import { Search } from 'lucide-react';

interface UrlListProps {
  sites: BlockedSite[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  onToggle: (id: string, currentStatus: boolean) => void;
  onOpenAddModal?: () => void;
}

export const UrlList: React.FC<UrlListProps> = ({ sites, isLoading, onDelete, onOpenAddModal }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredSites = sites.filter(site =>
    site.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header row: "URL LIST:" + search bar + "ADD SITE +" button */}
      <div className="flex items-center gap-6 mb-10">
        <h2 className="text-[13px] font-black uppercase tracking-widest whitespace-nowrap">
          URL LIST:
        </h2>
        <div className="relative flex-1">
          <Search
            size={12}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            strokeWidth={4}
          />
          <input
            type="text"
            placeholder="SEARCH TO FIND DISTRACTION"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-100/60 border-none rounded-lg text-[9px] font-bold uppercase tracking-widest focus:ring-2 focus:ring-black/5 transition-all placeholder:text-gray-300 outline-none"
          />
        </div>
        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="text-[9px] font-black text-gray-400 hover:text-black transition-all uppercase tracking-[0.2em] whitespace-nowrap shrink-0"
          >
            + ADD SITE
          </button>
        )}
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="text-center py-20">
          <p style={{ fontSize: '8px', color: '#aaa', letterSpacing: '0.1em' }}>NO DISTRACTIONS FOUND.</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {filteredSites.map((site, index) => (
            <UrlItem
              key={`${site.id}-${index}`}
              site={site}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};


