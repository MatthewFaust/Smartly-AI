// Approvals page — pending follow-up drafts for agent review
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import api from '@/lib/api';

const CHANNEL_COLORS = {
  email: 'bg-blue-100 text-blue-600',
  sms:   'bg-green-100 text-green-600',
  call:  'bg-orange-100 text-orange-600',
};

export default function ApprovalsPage() {
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState(null); // id of row being approved/rejected

  useEffect(() => {
    api.get('/followups?status=pending')
      .then(res => setFollowUps(res.data.followUps))
      .catch(err => console.error('Approvals: load error:', err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id, status) {
    setActing(id);
    try {
      await api.patch(`/followups/${id}`, { status });
      setFollowUps(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      console.error('Approvals: action error:', err.message);
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <div className="w-56 flex-shrink-0 bg-[#F0EEF8] h-full p-5">
        <h2 className="text-base font-bold text-[#1A1A2E] mb-3">Approvals</h2>
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Pending</p>
          <p className="text-2xl font-bold text-[#6B4EFF]">{followUps.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">follow-up{followUps.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-white px-10 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-2">Pending Approvals</h1>
        <p className="text-sm text-gray-400 mb-8">Review AI-drafted follow-ups before they are sent.</p>

        {/* Follow-up section */}
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Follow-ups
        </h2>

        {loading && <p className="text-sm text-gray-400">Loading…</p>}

        {!loading && followUps.length === 0 && (
          <div className="bg-[#EEEAF6] rounded-3xl px-8 py-10 text-center text-sm text-gray-400">
            No pending follow-ups. Draft one from a lead profile.
          </div>
        )}

        {!loading && followUps.length > 0 && (
          <div className="space-y-4 mb-12">
            {followUps.map(fu => (
              <div key={fu.id} className="bg-[#EEEAF6] rounded-3xl px-7 py-6">
                {/* Header row */}
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-base font-semibold text-[#1A1A2E]">
                    {fu.lead_name || 'Lead'}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${CHANNEL_COLORS[fu.channel] || 'bg-gray-100 text-gray-500'}`}>
                    {fu.channel}
                  </span>
                  {fu.scheduled_for && (
                    <span className="text-xs text-gray-400 ml-auto">
                      Scheduled {new Date(fu.scheduled_for).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>

                {/* Draft content */}
                <p className="text-[15px] text-[#1A1A2E] leading-relaxed whitespace-pre-wrap mb-5">
                  {fu.draft_content}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(fu.id, 'approved')}
                    disabled={acting === fu.id}
                    className="flex items-center gap-2 px-5 py-2 bg-[#6B4EFF] text-white rounded-2xl text-sm font-medium hover:bg-[#5A3FE0] disabled:opacity-40 transition-colors"
                  >
                    <CheckCircle size={16} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(fu.id, 'rejected')}
                    disabled={acting === fu.id}
                    className="flex items-center gap-2 px-5 py-2 bg-white text-gray-500 rounded-2xl text-sm font-medium hover:bg-gray-100 disabled:opacity-40 transition-colors"
                  >
                    <XCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Social posts placeholder */}
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
          Social Media Posts
        </h2>
        <div className="bg-[#EEEAF6] rounded-3xl px-8 py-10 text-center text-sm text-gray-400">
          Social post generation coming soon — Buffer + Canva integration
        </div>
      </div>
    </div>
  );
}
