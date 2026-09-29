import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Search, MapPin, Building, FlaskConical, BookOpen, Coffee, Heart, ShieldCheck } from 'lucide-react';
import { campusAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';

const typeIcon: Record<string, React.ReactNode> = {
  classroom: <Building size={16} className="text-blue-600" />,
  lab:       <FlaskConical size={16} className="text-violet-600" />,
  library:   <BookOpen size={16} className="text-green-600" />,
  cafeteria: <Coffee size={16} className="text-orange-600" />,
  medical:   <Heart size={16} className="text-red-600" />,
  office:    <Building size={16} className="text-gray-600" />,
  auditorium:<Building size={16} className="text-indigo-600" />,
  server:    <ShieldCheck size={16} className="text-teal-600" />,
};

const typeColor: Record<string, string> = {
  classroom: 'bg-blue-50 dark:bg-blue-900/20',
  lab:       'bg-violet-50 dark:bg-violet-900/20',
  library:   'bg-green-50 dark:bg-green-900/20',
  cafeteria: 'bg-orange-50 dark:bg-orange-900/20',
  medical:   'bg-red-50 dark:bg-red-900/20',
  office:    'bg-gray-50 dark:bg-gray-800',
  auditorium:'bg-indigo-50 dark:bg-indigo-900/20',
};

const CampusMapPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selected, setSelected] = useState<Record<string, unknown> | null>(null);

  const { data, isLoading } = useQuery(
    ['locations', search, typeFilter],
    () => campusAPI.getLocations({ search: search || undefined, type: typeFilter || undefined })
  );
  const locations = data?.data?.data || [];

  // Group by block
  const byBlock: Record<string, typeof locations> = {};
  locations.forEach((l: { block?: string }) => {
    const block = l.block || 'Other';
    if (!byBlock[block]) byBlock[block] = [];
    byBlock[block].push(l);
  });

  const types = ['classroom', 'lab', 'library', 'cafeteria', 'medical', 'office', 'auditorium', 'outdoor'];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Campus Map" subtitle="Find buildings, rooms, labs, and facilities" />

      {/* Search & Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search: CSE Lab 2, Library, Cafeteria..."
            className="input pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option value="">All Types</option>
          {types.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Location List */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-4"><div className="skeleton h-24 rounded" /></div>
            ))
          ) : Object.entries(byBlock).map(([block, locs]) => (
            <div key={block} className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  {block === 'Other' ? 'General' : `Block ${block}`}
                </h3>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {locs.map((l: {
                  id: string; name: string; code: string; type: string;
                  floor?: number; capacity?: number; description?: string;
                }) => (
                  <div
                    key={l.id}
                    className="px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => setSelected(l as Record<string, unknown>)}
                  >
                    <div className={`p-2 rounded-lg flex-shrink-0 ${typeColor[l.type] || 'bg-gray-50'}`}>
                      {typeIcon[l.type] || <MapPin size={16} className="text-gray-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{l.name}</p>
                      <p className="text-xs text-gray-500">
                        {l.code}
                        {l.floor !== undefined && ` · Floor ${l.floor}`}
                        {l.capacity && ` · Capacity: ${l.capacity}`}
                      </p>
                    </div>
                    <Badge variant="gray">{l.type}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!isLoading && locations.length === 0 && (
            <div className="card p-12 text-center">
              <MapPin size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No locations found for "{search}"</p>
            </div>
          )}
        </div>

        {/* Detail Panel */}
        <div className="card p-5 h-fit">
          {selected ? (
            <div>
              <div className={`p-3 rounded-xl mb-4 flex items-center gap-2 ${typeColor[(selected.type as string)] || 'bg-gray-50'}`}>
                {typeIcon[selected.type as string] || <MapPin size={20} className="text-gray-500" />}
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selected.type as string}</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{selected.name as string}</h3>
              <p className="text-xs text-gray-500 mt-1">{selected.code as string}</p>

              <div className="mt-4 space-y-2">
                {selected.block && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Block</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selected.block as string}</span>
                  </div>
                )}
                {selected.floor !== undefined && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Floor</span>
                    <span className="font-medium">{selected.floor === 0 ? 'Ground' : `${selected.floor}`}</span>
                  </div>
                )}
                {selected.capacity && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Capacity</span>
                    <span className="font-medium">{selected.capacity as number}</span>
                  </div>
                )}
                {selected.description && (
                  <p className="text-xs text-gray-500 mt-3 border-t pt-3 dark:border-gray-800">
                    {selected.description as string}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <MapPin size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Select a location to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusMapPage;
