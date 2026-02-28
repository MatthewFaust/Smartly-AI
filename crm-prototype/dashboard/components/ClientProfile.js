// Client detail panel — avatar, name/role/icons, bullet info, overview card, notes
import { useState, useEffect, useCallback } from 'react';
import { Phone, Mail, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

// Consistent color per client name
const AVATAR_COLORS = [
  '#6B4EFF', '#E05A5A', '#3BAABB', '#4CAF82',
  '#D4904E', '#9C59D1', '#E0875A', '#5A8FE0',
];
function avatarColor(name) {
  let h = 0;
  for (const c of (name || '')) h = c.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function InitialAvatar({ name }) {
  return (
    <div
      className="flex-shrink-0 rounded-full flex items-center justify-center"
      style={{ width: 120, height: 120, background: avatarColor(name) }}
    >
      <span className="text-white font-bold" style={{ fontSize: 48 }}>
        {(name || '?').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}

function fmt(n) { return n ? `$${Number(n).toLocaleString()}` : null; }
function budget(min, max) {
  if (fmt(min) && fmt(max)) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(max) || fmt(min) || null;
}

const CHANNEL_COLORS = { email: 'bg-blue-100 text-blue-600', sms: 'bg-green-100 text-green-600', call: 'bg-orange-100 text-orange-600' };

export default function ClientProfile({ lead, communications = [], followUps = [], onNotesUpdate }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Sync notes when selected lead changes
  useEffect(() => {
    setNotes(lead?.notes || '');
  }, [lead?.id]);

  const saveNotes = useCallback(async () => {
    if (!lead) return;
    setSaving(true);
    try {
      await api.patch(`/leads/${lead.id}`, { notes });
      if (onNotesUpdate) onNotesUpdate(lead.id, notes);
    } catch (err) {
      console.error('ClientProfile: save notes error:', err.message);
    } finally {
      setSaving(false);
    }
  }, [lead, notes]);

  if (!lead) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-300 text-sm bg-white">
        Select a client to view their profile
      </div>
    );
  }

  const budgetStr = budget(lead.budget_min, lead.budget_max);
  const preferredContact = lead.email
    ? `Email — ${lead.email}`
    : lead.phone
    ? `Phone — ${lead.phone}`
    : '—';

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* ── Top section: avatar + info + bullet list ── */}
      <div className="flex items-start gap-8 px-10 py-8">
        {/* Avatar */}
        <InitialAvatar name={lead.name} />

        {/* Name, role, contact icons */}
        <div className="flex flex-col justify-center">
          <h1 className="text-[28px] font-bold text-[#1A1A2E] leading-tight">{lead.name}</h1>
          <p className="text-base text-gray-400 mt-0.5">{lead.role || 'Client'}</p>
          <div className="flex items-center gap-5 mt-3">
            <button className="text-gray-500 hover:text-[#6B4EFF] transition-colors">
              <Phone size={22} strokeWidth={1.5} />
            </button>
            <button className="text-gray-500 hover:text-[#6B4EFF] transition-colors">
              <Mail size={22} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => router.push('/mail')}
              className="text-gray-500 hover:text-[#6B4EFF] transition-colors"
            >
              <MessageSquare size={22} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Bullet info list */}
        <ul className="flex-1 ml-4 space-y-2 text-[15px] text-[#1A1A2E]">
          <li>• <span className="text-gray-400">Preferred contact</span> {preferredContact}</li>
          <li>• <span className="text-gray-400">Notes</span> {lead.notes ? lead.notes.slice(0, 70) + (lead.notes.length > 70 ? '…' : '') : '—'}</li>
          <li>• <span className="text-gray-400">Last communicated</span> {lead.last_contacted_at ? new Date(lead.last_contacted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}</li>
          <li>• <span className="text-gray-400">Properties interested in</span> {lead.property_type || '—'}</li>
          <li>• <span className="text-gray-400">AI Summary</span> {lead.location ? `Seeking ${lead.property_type || 'property'} in ${lead.location}${budgetStr ? `, budget ${budgetStr}` : ''}` : 'No summary yet'}</li>
        </ul>
      </div>

      {/* ── Bottom two-column card section ── */}
      <div className="flex gap-4 px-10 pb-10">
        {/* Left: Client Overview card */}
        <div className="flex-1 bg-[#EEEAF6] rounded-3xl p-8 min-h-[420px]">
          <h2 className="text-[32px] font-bold text-[#1A1A2E] mb-6">Client Overview</h2>
          <div className="space-y-3 text-[15px] text-[#1A1A2E]">
            {budgetStr && <p><span className="text-gray-400">Budget</span> — {budgetStr}</p>}
            {lead.location && <p><span className="text-gray-400">Location</span> — {lead.location}</p>}
            {lead.property_type && <p><span className="text-gray-400">Property type</span> — {lead.property_type}</p>}
            {lead.timeline && <p><span className="text-gray-400">Timeline</span> — {lead.timeline}</p>}
            <p>
              <span className="text-gray-400">Pre-approved</span> —{' '}
              {lead.pre_approved === true ? 'Yes' : lead.pre_approved === false ? 'No' : 'Unknown'}
            </p>
            <p><span className="text-gray-400">Priority score</span> — {lead.priority_score}/100</p>
            {lead.source_channel && (
              <p><span className="text-gray-400">Source</span> — <span className="capitalize">{lead.source_channel}</span></p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4" style={{ width: '42%' }}>
          {/* Top card — communication history */}
          <div className="flex-1 bg-[#EEEAF6] rounded-3xl p-6 min-h-[240px] overflow-y-auto">
            <h3 className="text-2xl font-bold text-[#1A1A2E] mb-3">Communications</h3>
            {communications.length === 0 ? (
              <p className="text-sm text-gray-400">No communications yet</p>
            ) : (
              <div className="space-y-3">
                {communications.slice(0, 6).map(c => (
                  <div key={c.id} className="bg-white rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CHANNEL_COLORS[c.channel] || 'bg-gray-100 text-gray-500'}`}>
                        {c.channel}
                      </span>
                      <span className="text-xs text-gray-400 capitalize">{c.direction}</span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-[#1A1A2E] leading-snug line-clamp-2">
                      {c.summary || c.raw_content?.slice(0, 120) || '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes card */}
          <div className="bg-[#EEEAF6] rounded-3xl p-6">
            <h3 className="text-2xl font-bold text-[#1A1A2E] mb-3">
              Notes{' '}
              {saving && <span className="text-sm font-normal text-gray-400">saving…</span>}
            </h3>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              onBlur={saveNotes}
              placeholder={'• Add notes\n• About this client'}
              className="w-full bg-transparent text-[15px] text-[#1A1A2E] outline-none resize-none min-h-[80px] placeholder-gray-300 leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
