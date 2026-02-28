// Property list sidebar — search input with purple focus border, scrollable address list
import { useState } from 'react';
import { Search, X } from 'lucide-react';

export default function PropertySidebar({ properties, selectedId, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = properties.filter(p =>
    !search || (p.address || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-56 flex-shrink-0 bg-white border-r border-gray-100 h-full flex flex-col">
      {/* Search input — purple border on focus/active, matches Figma */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <p className="text-xs text-gray-400 mb-1.5">Label</p>
        <div
          className={`flex items-center gap-2 border rounded-xl px-3 py-2 transition-colors ${
            search ? 'border-[#6B4EFF]' : 'border-gray-200 focus-within:border-[#6B4EFF]'
          }`}
        >
          <Search size={14} className="text-gray-400 flex-shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Input"
            className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-300 min-w-0 bg-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="flex-shrink-0">
              <X size={14} className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Property list */}
      <div className="flex-1 overflow-y-auto">
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(p)}
            className={`w-full text-left px-5 py-3 text-[15px] transition-colors ${
              selectedId === p.id
                ? 'bg-[#F0EEF8] text-[#6B4EFF] font-medium'
                : 'text-[#1A1A2E] hover:bg-gray-50'
            }`}
          >
            {/* Show just the street part to keep it short */}
            {(p.address || 'Unknown Property').split(',')[0]}
          </button>
        ))}
      </div>
    </div>
  );
}
