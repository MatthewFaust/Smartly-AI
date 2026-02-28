// Clients page — sidebar list + full client profile, matches Figma Screen 2
import { useState, useEffect } from 'react';
import ClientSidebar from '@/components/ClientSidebar';
import ClientProfile from '@/components/ClientProfile';
import api from '@/lib/api';

export default function ClientsPage() {
  const [leads, setLeads] = useState([]);
  const [selected, setSelected] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [followUps, setFollowUps] = useState([]);

  useEffect(() => {
    api.get('/leads')
      .then(r => {
        const list = r.data.leads;
        setLeads(list);
        if (list.length > 0) selectLead(list[0]);
      })
      .catch(err => console.error('Clients: fetch error:', err.message));
  }, []);

  // Fetch full lead detail including communications and follow-ups
  async function selectLead(lead) {
    setSelected(lead);
    setCommunications([]);
    setFollowUps([]);
    try {
      const r = await api.get(`/leads/${lead.id}`);
      setSelected(r.data.lead);
      setCommunications(r.data.communications || []);
      setFollowUps(r.data.followUps || []);
    } catch (err) {
      console.error('Clients: fetch lead detail error:', err.message);
    }
  }

  function handleNotesUpdate(leadId, notes) {
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, notes } : l));
    setSelected(prev => prev?.id === leadId ? { ...prev, notes } : prev);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <ClientSidebar leads={leads} selectedId={selected?.id} onSelect={selectLead} />
      <ClientProfile
        lead={selected}
        communications={communications}
        followUps={followUps}
        onNotesUpdate={handleNotesUpdate}
      />
    </div>
  );
}
