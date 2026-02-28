// Property detail panel — overview card + image placeholder + notes, matches Figma Screen 1
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

function fmtPrice(p) {
  return p ? `$${Number(p).toLocaleString()}` : '—';
}

export default function PropertyDetail({ property, onNotesUpdate }) {
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync notes when selected property changes
  useEffect(() => {
    setNotes(property?.notes || '');
  }, [property?.id]);

  const saveNotes = useCallback(async () => {
    if (!property) return;
    setSaving(true);
    try {
      await api.patch(`/properties/${property.id}`, { notes });
      if (onNotesUpdate) onNotesUpdate(property.id, notes);
    } catch (err) {
      console.error('PropertyDetail: save notes error:', err.message);
    } finally {
      setSaving(false);
    }
  }, [property, notes]);

  if (!property) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-300 text-sm bg-white">
        Select a property to view details
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-white">
      {/* Two-column card layout — matches Figma Screen 1 */}
      <div className="flex gap-4 px-10 py-10 min-h-full">
        {/* Left: Property Overview */}
        <div className="flex-1 bg-[#EEEAF6] rounded-3xl p-8 min-h-[480px]">
          <h2 className="text-[32px] font-bold text-[#1A1A2E] mb-6">Property Overview</h2>
          <div className="space-y-3 text-[15px] text-[#1A1A2E]">
            <p><span className="text-gray-400">Address</span> — {property.address}</p>
            <p><span className="text-gray-400">Price</span> — {fmtPrice(property.price)}</p>
            <p><span className="text-gray-400">Type</span> — {property.type || '—'}</p>
            <p>
              <span className="text-gray-400">Status</span> —{' '}
              <span className="capitalize">{property.status || '—'}</span>
            </p>
            {property.bedrooms && (
              <p><span className="text-gray-400">Bedrooms</span> — {property.bedrooms}</p>
            )}
            {property.bathrooms && (
              <p><span className="text-gray-400">Bathrooms</span> — {property.bathrooms}</p>
            )}
            {property.sqft && (
              <p><span className="text-gray-400">Sqft</span> — {property.sqft.toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4" style={{ width: '42%' }}>
          {/* Top card — image or placeholder */}
          <div className="flex-1 bg-[#EEEAF6] rounded-3xl min-h-[280px] overflow-hidden">
            {property.image_url ? (
              <img
                src={property.image_url}
                alt={property.address}
                className="w-full h-full object-cover"
              />
            ) : null}
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
              placeholder={'• Add property notes'}
              className="w-full bg-transparent text-[15px] text-[#1A1A2E] outline-none resize-none min-h-[80px] placeholder-gray-300 leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
