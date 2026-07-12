'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useSearch } from '@/contexts/SearchContext';
import { matchesSearch } from '@/lib/search';
import { Plus, X, Fuel } from 'lucide-react';

export default function FuelExpensesPage() {
  const { query } = useSearch();
  const [logs, setLogs] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [trips, setTrips] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    vehicle_id: '',
    trip_id: '',
    date: new Date().toISOString().slice(0, 10),
    liters: '',
    cost: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [lRes, vRes, tRes] = await Promise.all([
        api.get('/fuel-logs'),
        api.get('/vehicles'),
        api.get('/trips'),
      ]);
      setLogs(lRes.data);
      setVehicles(vRes.data);
      setTrips(tRes.data.filter((t: any) => t.status === 'DISPATCHED' || t.status === 'COMPLETED'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');
    try {
      await api.post('/fuel-logs', {
        vehicle_id: Number(form.vehicle_id),
        trip_id: form.trip_id ? Number(form.trip_id) : null,
        date: form.date,
        liters: Number(form.liters),
        cost: Number(form.cost),
      });
      setMsg('Fuel log recorded successfully.');
      setIsModalOpen(false);
      setForm({ vehicle_id: '', trip_id: '', date: new Date().toISOString().slice(0, 10), liters: '', cost: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to record fuel log.');
    }
  };

  const totalLiters = logs.reduce((s, l) => s + l.liters, 0);
  const totalCost = logs.reduce((s, l) => s + l.cost, 0);

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) =>
        matchesSearch(query, log.vehicle_reg, log.vehicle_model, log.trip_code, log.date)
      ),
    [logs, query]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Fuel & Expense Tracking</h2>
          <p className="text-xs text-gray-400 mt-1">Record fuel logs and track operational costs per vehicle</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Log Fuel Entry
        </button>
      </div>

      {msg && <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-lg text-sm font-medium">{msg}</div>}
      {error && <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-sm font-medium">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121212] border border-gray-800 rounded-lg p-5">
          <p className="text-xs text-gray-400">Total Fuel Entries</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{logs.length}</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 rounded-lg p-5">
          <p className="text-xs text-gray-400">Total Liters Consumed</p>
          <p className="text-3xl font-bold text-sky-400 mt-1">{totalLiters.toFixed(1)} L</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 rounded-lg p-5">
          <p className="text-xs text-gray-400">Total Fuel Cost</p>
          <p className="text-3xl font-bold text-rose-400 mt-1">₹{totalCost.toLocaleString()}</p>
        </div>
      </div>

      {/* Fuel Logs Table */}
      <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs border-b border-gray-800 font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Trip</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Liters</th>
              <th className="px-4 py-3">Cost (₹)</th>
              <th className="px-4 py-3">Cost/Liter</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  {query ? `No fuel logs match "${query}".` : 'No fuel logs found. Add your first entry.'}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-900/50 transition">
                  <td className="px-4 py-3 font-medium text-white">{log.vehicle_model} <span className="font-mono text-amber-500 text-xs">({log.vehicle_reg})</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-sky-400">{log.trip_code ?? <span className="text-gray-600 italic">Standalone</span>}</td>
                  <td className="px-4 py-3 text-gray-400">{log.date}</td>
                  <td className="px-4 py-3 font-bold text-sky-300">{log.liters.toFixed(1)} L</td>
                  <td className="px-4 py-3 text-rose-400">₹{log.cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {log.liters > 0 ? `₹${(log.cost / log.liters).toFixed(2)}` : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Fuel Log Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-gray-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2"><Fuel className="w-5 h-5 text-amber-500" /> Log Fuel Entry</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Vehicle *</label>
                <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500">
                  <option value="">-- Select Vehicle --</option>
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>{v.model_name} ({v.reg_no})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Link to Trip <span className="text-gray-600">(optional)</span></label>
                <select value={form.trip_id} onChange={(e) => setForm({ ...form, trip_id: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500">
                  <option value="">-- Standalone / No Trip --</option>
                  {trips.map((t) => (
                    <option key={t.id} value={t.id}>{t.trip_code} ({t.source} → {t.destination})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Date *</label>
                  <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Liters *</label>
                  <input type="number" step="0.1" required value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Total Cost (₹) *</label>
                  <input type="number" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500" />
                </div>
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded-lg text-sm font-medium">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
