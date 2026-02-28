// Dashboard homepage — stats overview, new lead intake, recent leads list
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-3xl p-5 flex-1 ${accent ? 'bg-[#6B4EFF]' : 'bg-[#EEEAF6]'}`}>
      <p className={`text-4xl font-bold leading-none ${accent ? 'text-white' : 'text-[#1A1A2E]'}`}>
        {value}
      </p>
      <p className={`text-sm mt-2 ${accent ? 'text-purple-200' : 'text-gray-500'}`}>{label}</p>
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [leads, setLeads] = useState([]);
  const [properties, setProperties] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [content, setContent] = useState('');
  const [channel, setChannel] = useState('email');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('currentUser');
    if (!stored) { router.replace('/login'); return; }
    setUser(JSON.parse(stored));

    Promise.all([
      api.get('/leads').then(r => r.data.leads),
      api.get('/properties').then(r => r.data.properties),
      api.get('/followups?status=pending').then(r => r.data.followUps),
    ]).then(([l, p, f]) => {
      setLeads(l);
      setProperties(p);
      setFollowUps(f);
    }).catch(err => console.error('Dashboard fetch error:', err.message));
  }, []);

  async function processLead() {
    if (!content.trim()) return;
    setProcessing(true);
    setResult(null);
    try {
      const res = await api.post('/test/extract', { content, channel });
      setResult(res.data);
      setContent('');
      // Refresh leads
      const r = await api.get('/leads');
      setLeads(r.data.leads);
    } catch (err) {
      console.error('processLead error:', err.message);
    } finally {
      setProcessing(false);
    }
  }

  const hot = leads.filter(l => l.priority_score >= 70);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left panel */}
      <div className="w-56 flex-shrink-0 bg-[#F0EEF8] h-full overflow-y-auto p-5 flex flex-col gap-6">
        {/* Agent card */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6B4EFF] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
            {user?.name?.charAt(0) || 'A'}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-[#1A1A2E] text-sm truncate">{user?.name || 'Agent'}</p>
            <p className="text-xs text-gray-400">{user?.role || 'Agent'}</p>
          </div>
        </div>

        {/* Hot leads */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Hot Leads</p>
          {hot.length === 0 && <p className="text-xs text-gray-400">None yet</p>}
          {hot.slice(0, 4).map(l => (
            <div key={l.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-[#1A1A2E] truncate">{l.name}</span>
              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium ml-1 flex-shrink-0">
                {l.priority_score}
              </span>
            </div>
          ))}
        </div>

        {/* Pending */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">Pending</p>
          <p className="text-sm text-[#1A1A2E]">
            {followUps.length} follow-up{followUps.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-white px-10 py-8">
        <h1 className="text-2xl font-bold text-[#1A1A2E] mb-6">Dashboard</h1>

        {/* Stat cards */}
        <div className="flex gap-4 mb-8">
          <StatCard label="Total Leads"       value={leads.length}      />
          <StatCard label="Hot Leads"         value={hot.length}        accent />
          <StatCard label="Pending Follow-ups" value={followUps.length} />
          <StatCard label="Properties"        value={properties.length} />
        </div>

        {/* Process new lead */}
        <div className="bg-[#EEEAF6] rounded-3xl p-7 mb-8">
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-3">Add New Lead</h2>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Paste email, SMS, or call transcript here..."
            className="w-full bg-white rounded-2xl p-4 text-sm text-gray-700 h-28 resize-none outline-none border border-transparent focus:border-[#6B4EFF] transition-colors"
          />

          {/* Channel toggle */}
          <div className="flex gap-2 mt-3 mb-4">
            {['email', 'sms', 'call'].map(c => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
                  channel === c
                    ? 'bg-[#6B4EFF] text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-100'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <button
            onClick={processLead}
            disabled={!content.trim() || processing}
            className="px-6 py-2.5 bg-[#6B4EFF] text-white rounded-2xl text-sm font-medium hover:bg-[#5A3FE0] disabled:opacity-40 transition-colors"
          >
            {processing ? 'Extracting…' : 'Extract Lead with AI'}
          </button>

          {result?.lead && (
            <div className="mt-4 bg-white rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1A1A2E]">
                  {result.lead.name || 'Lead'} extracted
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Score: {result.lead.priority_score} · {result.lead.location || '—'} · {result.lead.role || '—'}
                </p>
              </div>
              <button
                onClick={() => router.push('/clients')}
                className="text-xs text-[#6B4EFF] font-medium hover:underline"
              >
                View in Clients →
              </button>
            </div>
          )}
        </div>

        {/* Recent leads table */}
        <h2 className="text-base font-semibold text-[#1A1A2E] mb-3">Recent Leads</h2>
        <div className="space-y-2">
          {leads.slice(0, 8).map(l => (
            <button
              key={l.id}
              onClick={() => router.push('/clients')}
              className="w-full flex items-center justify-between bg-[#EEEAF6] rounded-2xl px-5 py-3 hover:bg-[#E4DFF2] transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-[#1A1A2E] truncate">{l.name}</span>
                <span className="text-xs text-gray-400 capitalize flex-shrink-0">
                  {l.role || '—'} · {l.source_channel}
                </span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                l.priority_score >= 70 ? 'bg-red-100 text-red-600' :
                l.priority_score >= 40 ? 'bg-orange-100 text-orange-600' :
                'bg-blue-100 text-blue-500'
              }`}>
                {l.priority_score}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
