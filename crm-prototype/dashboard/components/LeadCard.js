// Card component for displaying a lead summary in the pipeline view
import { useRouter } from 'next/router';

function scoreColor(score) {
  if (score >= 70) return 'border-l-red-500 bg-red-50';
  if (score >= 40) return 'border-l-orange-400 bg-orange-50';
  return 'border-l-blue-400 bg-blue-50';
}

function scoreBadge(score) {
  if (score >= 70) return 'bg-red-100 text-red-700';
  if (score >= 40) return 'bg-orange-100 text-orange-700';
  return 'bg-blue-100 text-blue-700';
}

function scoreLabel(score) {
  if (score >= 70) return 'Hot';
  if (score >= 40) return 'Warm';
  return 'Cold';
}

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function LeadCard({ lead }) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/leads/${lead.id}`)}
      className={`border-l-4 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow ${scoreColor(lead.priority_score)}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 truncate">{lead.name || 'Unknown'}</span>
            {lead.duplicate_flag && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Duplicate</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500">
            {lead.location && <span>📍 {lead.location}</span>}
            {lead.source_channel && <span className="capitalize">via {lead.source_channel}</span>}
            {lead.status && (
              <span className="capitalize text-gray-400">{lead.status}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBadge(lead.priority_score)}`}>
            {scoreLabel(lead.priority_score)} · {lead.priority_score}
          </span>
          <span className="text-xs text-gray-400">
            {lead.last_contacted_at ? `Contacted ${formatDate(lead.last_contacted_at)}` : `Added ${formatDate(lead.created_at)}`}
          </span>
        </div>
      </div>
    </div>
  );
}
