// Leads index — sidebar list of all leads with click-through to full profile
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

function scoreBadge(score) {
  if (score >= 70) return 'bg-red-100 text-red-600';
  if (score >= 40) return 'bg-orange-100 text-orange-600';
  return 'bg-blue-100 text-blue-500';
}

export default function LeadsIndex() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    api.get('/leads')
      .then(res => setLeads(res.data.leads))
      .catch(err => console.error('LeadsIndex: failed to fetch leads:', err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Lead list */}
      <div className="w-72 border-r border-gray-200 bg-white overflow-y-auto">
        <div className="px-4 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">All Leads</h2>
          <p className="text-xs text-gray-400 mt-0.5">{leads.length} total</p>
        </div>
        {loading && <p className="text-xs text-gray-400 px-4 py-3">Loading...</p>}
        {!loading && leads.length === 0 && (
          <p className="text-xs text-gray-400 px-4 py-3">No leads yet.</p>
        )}
        {leads.map(lead => (
          <div
            key={lead.id}
            onClick={() => router.push(`/leads/${lead.id}`)}
            className="px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-purple-50 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-800 truncate">
                {lead.name || 'Unknown'}
              </span>
              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded shrink-0 ${scoreBadge(lead.priority_score)}`}>
                {lead.priority_score}
              </span>
            </div>
            <span className="text-xs text-gray-400 capitalize">{lead.status}</span>
          </div>
        ))}
      </div>

      {/* Empty state for right panel */}
      <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
        Select a lead to view their profile
      </div>
    </div>
  );
}
