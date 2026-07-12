'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useSearch } from '@/contexts/SearchContext';
import { matchesSearch } from '@/lib/search';
import { Plus, X, UserCheck, AlertTriangle } from 'lucide-react';

interface Driver {
  id: number;
  name: string;
  license_no: string;
  license_category: string;
  license_expiry: string;
  contact: string;
  safety_score: number;
  status: string;
}

export default function DriversPage() {
  const { query } = useSearch();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    name: '',
    license_no: '',
    license_category: 'HMV',
    license_expiry: '',
    contact: '',
  });

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await api.post('/drivers', form);
      setDrivers([res.data, ...drivers]);
      setIsModalOpen(false);
      setForm({ name: '', license_no: '', license_category: 'HMV', license_expiry: '', contact: '' });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create driver.');
    }
  };

  const toggleDriverStatus = async (driverId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'SUSPENDED' ? 'AVAILABLE' : 'SUSPENDED';
    try {
      const res = await api.patch(`/drivers/${driverId}/status?status=${newStatus}`);
      setDrivers(drivers.map((d) => (d.id === driverId ? res.data : d)));
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDrivers = useMemo(
    () =>
      drivers.filter((d) =>
        matchesSearch(query, d.name, d.license_no, d.license_category, d.contact, d.status)
      ),
    [drivers, query]
  );

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Driver Management</h2>
          <p className="text-xs text-gray-400 mt-1">Track licenses, compliance, and driver duty states</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Driver
        </button>
      </div>

      <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs border-b border-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Driver Name</th>
              <th className="px-4 py-3">License No.</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">License Expiry</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Safety Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredDrivers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                  {query ? `No drivers match "${query}".` : 'No drivers registered yet.'}
                </td>
              </tr>
            ) : (
              filteredDrivers.map((d) => {
              const expired = isExpired(d.license_expiry);
              return (
                <tr key={d.id} className="hover:bg-gray-900/50 transition">
                  <td className="px-4 py-3 font-medium text-white">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-amber-400">{d.license_no}</td>
                  <td className="px-4 py-3">{d.license_category}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-1.5 font-mono ${expired ? 'text-rose-400 font-bold' : 'text-gray-300'}`}>
                      {expired && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                      {d.license_expiry}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-gray-400">{d.contact}</td>
                  <td className="px-4 py-3 font-bold text-emerald-400">{d.safety_score}/100</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      d.status === 'AVAILABLE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      d.status === 'ON_TRIP' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                      d.status === 'SUSPENDED' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {d.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => toggleDriverStatus(d.id, d.status)}
                      className={`text-xs px-3 py-1 rounded transition font-medium ${
                        d.status === 'SUSPENDED'
                          ? 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300'
                          : 'bg-rose-900/60 hover:bg-rose-800 text-rose-300'
                      }`}
                    >
                      {d.status === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Driver Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Register Driver</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {errorMsg && <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded">{errorMsg}</div>}

            <form onSubmit={handleCreateDriver} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Full Name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">License No. *</label>
                  <input required value={form.license_no} onChange={(e) => setForm({ ...form, license_no: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm font-mono text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Category *</label>
                  <select value={form.license_category} onChange={(e) => setForm({ ...form, license_category: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white">
                    <option value="HMV">HMV (Heavy Motor)</option>
                    <option value="LMV">LMV (Light Motor)</option>
                    <option value="Trailer">Trailer</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">License Expiry *</label>
                  <input type="date" required value={form.license_expiry} onChange={(e) => setForm({ ...form, license_expiry: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Contact Number *</label>
                  <input required value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white" />
                </div>
              </div>

              <div className="pt-3 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded text-sm font-medium">Save Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
