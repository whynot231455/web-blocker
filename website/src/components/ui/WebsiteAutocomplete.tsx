import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { Input } from './Input';
import { commonSites } from '@/data/commonSites';

interface WebsiteAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (domain: string) => void;
  error?: string;
}

export const WebsiteAutocomplete: React.FC<WebsiteAutocompleteProps> = ({
  value,
  onChange,
  onSelect,
  error,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = React.useMemo(() => {
    if (value.trim().length > 0) {
      return commonSites.filter(
        (site) =>
          site.name.toLowerCase().includes(value.toLowerCase()) ||
          site.domain.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 15);
    }
    return [];
  }, [value]);

  useEffect(() => {
    if (value.trim().length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
    setSelectedIndex(-1);
  }, [value, suggestions.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      onSelect(suggestions[selectedIndex].domain);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        label="Website URL"
        placeholder="Search or type e.g. facebook.com"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => value.trim().length > 0 && setShowSuggestions(true)}
        error={error}
        icon={<Search size={18} />}
        autoFocus
        autoComplete="off"
      />

      {showSuggestions && (
        <div className="relative z-10 w-full mt-4 bg-white border-2 border-black shadow-[6px_6px_0px_#000]">
          <div className="bg-black text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest flex justify-between items-center">
            <span>Suggestions</span>
            <span className="text-[6px] opacity-70">Scroll to see more</span>
          </div>
          <ul className="divide-y-2 divide-black max-h-[220px] overflow-y-auto custom-scrollbar">
            {suggestions.map((site, index) => (
              <li
                key={site.domain}
                className={`
                  flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                  ${selectedIndex === index ? 'bg-yellow-300' : 'hover:bg-gray-100'}
                `}
                onClick={() => {
                  onSelect(site.domain);
                  setShowSuggestions(false);
                }}
              >
                <div className="w-8 h-8 flex-shrink-0 border-2 border-black bg-white flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${site.domain}&sz=32`}
                    alt={site.name}
                    className="w-5 h-5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIj48L2NpcmNsZT48bGluZSB4MT0iMiIgeTE9IjEyIiB4Mj0iMjIiIHkyPSIxMiI+PC9saW5lPjxwYXRoIGQ9Ik0xMiAyYy00IDAtNy40MyA0LjM3LTcgMTBzMy4zNCAxMCA3IDEwIDcuNDMtNC4zNyA3LTEwLTMuMzQtMTAtNy0xMHoiPjwvcGF0aD48L3N2Zz4=';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase truncate">{site.name}</p>
                  <p className="text-[8px] font-bold text-gray-500 truncate">{site.domain}</p>
                </div>
                <ChevronRight size={14} className="text-black" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
