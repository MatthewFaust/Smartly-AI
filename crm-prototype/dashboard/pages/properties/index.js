// Properties page — sidebar list + detail view, matches Figma Screen 1
import { useState, useEffect } from 'react';
import PropertySidebar from '@/components/PropertySidebar';
import PropertyDetail from '@/components/PropertyDetail';
import api from '@/lib/api';

export default function PropertiesPage() {
  const [properties, setProperties] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/properties')
      .then(r => {
        const list = r.data.properties;
        setProperties(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(err => console.error('Properties: fetch error:', err.message));
  }, []);

  function handleNotesUpdate(id, notes) {
    setProperties(prev => prev.map(p => p.id === id ? { ...p, notes } : p));
    setSelected(prev => prev?.id === id ? { ...prev, notes } : prev);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <PropertySidebar
        properties={properties}
        selectedId={selected?.id}
        onSelect={setSelected}
      />
      <PropertyDetail property={selected} onNotesUpdate={handleNotesUpdate} />
    </div>
  );
}
