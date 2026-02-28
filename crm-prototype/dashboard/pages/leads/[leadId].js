// Lead detail page — full profile, communication history, follow-up history, notes
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  });
}

function formatBudget(min, max) {
  const fmt = n => n ? `$${Number(n).toLocaleString()}` : null;
  if (fmt(min) && fmt(max)) return `${fmt(min)} – ${fmt(max)}`;
  if (fmt(max)) return `Up to ${fmt(max)}`;
  if (fmt(min)) return `From ${fmt(min)}`;
  return '—';
}

function ScoreBar({ score }) {
  const color = score >= 70 ? 'bg-red-500' : score >= 40 ? 'bg-orange-400' : 'bg-blue-400';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-600">{score}/100</span>
    </div>
  );
}

export default function LeadDetail() {
  const router = useRouter();
  const { leadId } = router.query;

  const [lead, setLead] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [draftingFollowUp, setDraftingFollowUp] = useState(false);

  useEffect(() => {
    if (!leadId) return;
    api.get(`/leads/${leadId}`)
      .then(res => {
        setLead(res.data.lead);
        setCommunications(res.data.communications);
        setFollowUps(res.data.followUps);
        setNotes(res.data.lead.notes || '');
      })
      .catch(err => console.error('LeadDetail: failed to fetch lead:', err.message))
      .finally(() => setLoading(false));
  }, [leadId]);

  const saveNotes = useCallback(async () => {
    if (!leadId) return;
    setSavingNotes(true);
    try {
      await api.patch(`/leads/${leadId}`, { notes });
    } catch (err) {
      console.error('LeadDetail: failed to save notes:', err.message);
    } finally {
      setSavingNotes(false);
    }
  }, [leadId, notes]);

  async function handleDraftFollowUp() {
    setDraftingFollowUp(true);
    try {
      const res = await api.post(`/test/draft/${leadId}`);
      setFollowUps(prev => [res.data.followUp, ...prev]);
    } catch (err) {
      console.error('LeadDetail: failed to draft follow-up:', err.message);
    } finally {
      setDraftingFollowUp(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-sm text-gray-400">Loading lead...</div>;
  }

  if (!lead) {
    return <div className="p-8 text-sm text-red-500">Lead not found.</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{lead.name || 'Unknown'}</h1>
            {lead.duplicate_flag && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">
                Possible Duplicate
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {lead.source_channel} lead · {lead.status}
          </p>
        </div>
        <button
          onClick={handleDraftFollowUp}
          disabled={draftingFollowUp}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          {draftingFollowUp ? 'Drafting...' : '+ Draft Follow-up'}
        </button>
      </div>

      {/* Priority score */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Priority Score</p>
        <ScoreBar score={lead.priority_score || 0} />
      </div>

      {/* Profile grid */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Profile</p>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <Field label="Email" value={lead.email} />
          <Field label="Phone" value={lead.phone} />
          <Field label="Budget" value={formatBudget(lead.budget_min, lead.budget_max)} />
          <Field label="Location" value={lead.location} />
          <Field label="Property Type" value={lead.property_type} />
          <Field label="Timeline" value={lead.timeline} />
          <Field label="Pre-approved" value={lead.pre_approved === true ? 'Yes' : lead.pre_approved === false ? 'No' : '—'} />
          <Field label="Last Contacted" value={formatDate(lead.last_contacted_at)} />
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
          Notes {savingNotes && <span className="text-purple-400 normal-case font-normal">saving...</span>}
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="Add notes about this lead..."
          className="w-full text-sm text-gray-700 border-none outline-none resize-none min-h-[80px] placeholder-gray-300"
        />
      </div>

      {/* Follow-up history */}
      {followUps.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Follow-up History</p>
          <div className="space-y-3">
            {followUps.map(fu => (
              <div key={fu.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 capitalize">via {fu.channel} · {formatDate(fu.created_at)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                    fu.status === 'approved' ? 'bg-green-100 text-green-700' :
                    fu.status === 'rejected' ? 'bg-red-100 text-red-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{fu.status}</span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{fu.draft_content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Communication history */}
      {communications.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Communications</p>
          <div className="space-y-2">
            {communications.map(c => (
              <div key={c.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-500 capitalize">{c.direction} · {c.channel}</span>
                  <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                </div>
                <p className="text-sm text-gray-600">{c.summary}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-gray-800 font-medium">{value || '—'}</dd>
    </div>
  );
}
