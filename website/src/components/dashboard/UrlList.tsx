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

export const UrlList: React.FC<UrlListProps> = ({ sites, isLoading, onDelete, onToggle, onOpenAddModal }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredSites = sites.filter(site =>
    site.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header row: "URL LIST:" + search bar + "ADD SITE +" button */}
      <div className="flex items-center gap-5 mb-6">
        <span style={{ fontSize: '15px', fontWeight: 'bold', whiteSpace: 'nowrap', letterSpacing: '0.05em' }}>
          URL LIST:
        </span>
        <div className="relative flex-1">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            strokeWidth={3}
          />
          <input
            type="text"
            placeholder="search to find distraction"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-md text-[10px] font-bold uppercase tracking-wider focus:ring-1 focus:ring-black transition-all placeholder:text-gray-300"
          />
        </div>
        {onOpenAddModal && (
          <button
            onClick={onOpenAddModal}
            className="text-[9px] font-bold text-gray-400 hover:text-black transition-colors uppercase tracking-[0.1em] px-2 py-1 rounded hover:bg-gray-100 whitespace-nowrap shrink-0"
            title="Add new website to block"
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
          {filteredSites.map((site) => (
            <UrlItem
              key={site.id}
              site={site}
              onDelete={onDelete}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UrlList;
