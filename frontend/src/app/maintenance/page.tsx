'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useSearch } from '@/contexts/SearchContext';
import { matchesSearch } from '@/lib/search';
import { Wrench, CheckCircle2 } from 'lucide-react';

export default function MaintenancePage() {
  const { query } = useSearch();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [form, setForm] = useState({ vehicle_id: '', service_type: '', cost: '', service_date: '' });
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vRes, mRes] = await Promise.all([
        api.get('/vehicles'),
        api.get('/maintenance')
      ]);
      setVehicles(vRes.data);
      setLogs(mRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    setError('');

    try {
      await api.post('/maintenance', {
        vehicle_id: Number(form.vehicle_id),
        service_type: form.service_type,
        cost: Number(form.cost),
        service_date: form.service_date,
      });
      setMsg('Maintenance logged! Vehicle status automatically changed to IN_SHOP.');
      setForm({ vehicle_id: '', service_type: '', cost: '', service_date: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to log maintenance.');
    }
  };

  const handleCompleteMaintenance = async (logId: number) => {
    setMsg('');
    setError('');

    try {
      const res = await api.patch(`/maintenance/${logId}/complete`);
      setMsg(res.data.message);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to complete maintenance.');
    }
  };

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) =>
        matchesSearch(query, log.vehicle_reg, log.vehicle_model, log.service_type, log.status)
      ),
    [logs, query]
  );

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-white">4. Maintenance & Service Logs</h2>
        <p className="text-xs text-gray-400 mt-1">Log vehicle servicing and restore repaired assets to Available status</p>
      </div>

      {msg && <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-lg text-sm font-medium">{msg}</div>}
      {error && <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-sm font-medium">{error}</div>}

      {/* Log Form */}
      <form onSubmit={handleSubmit} className="bg-[#121212] border border-gray-800 rounded-lg p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Log New Service Entry</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Select Vehicle *</label>
            <select
              required
              value={form.vehicle_id}
              onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Choose Vehicle --</option>
              {vehicles.map((v) => {
                const isDisabled = v.status === 'ON_TRIP' || v.status === 'RETIRED';
                let label = `${v.model_name} (${v.reg_no}) - Current: ${v.status}`;
                if (v.status === 'ON_TRIP') label = `${v.model_name} (${v.reg_no}) - Currently On Trip (Unavailable)`;
                if (v.status === 'RETIRED') label = `${v.model_name} (${v.reg_no}) - Retired (Unavailable)`;
                
                return (
                  <option key={v.id} value={v.id} disabled={isDisabled}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Service Type *</label>
            <input
              required
              placeholder="e.g. Engine Oil Change, Brake Overhaul"
              value={form.service_type}
              onChange={(e) => setForm({ ...form, service_type: e.target.value })}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Service Cost (₹) *</label>
            <input
              type="number"
              required
              placeholder="4500"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Service Date *</label>
            <input
              type="date"
              required
              value={form.service_date}
              onChange={(e) => setForm({ ...form, service_date: e.target.value })}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-5 py-2.5 rounded-lg text-sm transition flex items-center gap-2"
        >
          <Wrench className="w-4 h-4" /> Log Maintenance (Auto-Set IN_SHOP)
        </button>
      </form>

      {/* Maintenance Logs Table */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-300">Active & Past Maintenance Logs</h3>
        <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs border-b border-gray-800 font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Service Type</th>
                <th className="px-4 py-3">Cost</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    {query ? `No maintenance records match "${query}".` : 'No maintenance records found.'}
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-900/50 transition">
                    <td className="px-4 py-3 font-medium text-white">{log.vehicle_model} ({log.vehicle_reg})</td>
                    <td className="px-4 py-3">{log.service_type}</td>
                    <td className="px-4 py-3">₹{log.cost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400">{log.service_date}</td>
                    <td className="px-4 py-3">
                      {log.status === 'IN_SHOP' ? (
                        <span className="px-2.5 py-1 text-xs rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-medium">In Shop</span>
                      ) : (
                        <span className="px-2.5 py-1 text-xs rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">Completed</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.status === 'IN_SHOP' && (
                        <button
                          onClick={() => handleCompleteMaintenance(log.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded transition flex items-center gap-1.5 ml-auto"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed (Restore)
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}