// Left panel client list — "Recent Clients" with active row highlight
export default function ClientSidebar({ leads, selectedId, onSelect }) {
  return (
    <div className="w-56 flex-shrink-0 bg-[#F0EEF8] h-full flex flex-col overflow-hidden">
      <div className="px-5 py-5 flex-shrink-0">
        <h2 className="text-base font-bold text-[#1A1A2E]">Recent Clients</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {leads.map(lead => (
          <button
            key={lead.id}
            onClick={() => onSelect(lead)}
            className={`w-full text-left px-5 py-2.5 text-[15px] transition-colors ${
              selectedId === lead.id
                ? 'bg-[#DDD8F0] text-[#6B4EFF] font-medium'
                : 'text-[#1A1A2E] hover:bg-[#E8E4F2]'
            }`}
          >
            {lead.name || 'Unknown'}
          </button>
        ))}
      </div>
    </div>
  );
}
