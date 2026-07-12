'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function MaintenancePage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [form, setForm] = useState({ vehicle_id: '', service_type: '', cost: '', service_date: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/vehicles').then((res) => setVehicles(res.data));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/maintenance', {
        vehicle_id: Number(form.vehicle_id),
        service_type: form.service_type,
        cost: Number(form.cost),
        service_date: form.service_date,
      });
      setMsg('Maintenance logged! Vehicle status automatically updated to IN_SHOP.');
      setForm({ vehicle_id: '', service_type: '', cost: '', service_date: '' });
    } catch (err: any) {
      setMsg('Failed to log maintenance.');
    }
  };

  return (
    <div className="space-[#121212] space-y-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white">4. Maintenance Logging</h2>

      {msg && <div className="p-4 bg-amber-950/80 border border-amber-800 text-amber-300 rounded text-sm">{msg}</div>}

      <form onSubmit={handleSubmit} className="bg-[#121212] border border-gray-800 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Select Vehicle</label>
          <select
            required
            value={form.vehicle_id}
            onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
            className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
          >
            <option value="">-- Choose Vehicle --</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>{v.model_name} ({v.reg_no}) - Current: {v.status}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Service Type</label>
            <input
              required
              placeholder="Oil Change / Brake Pad Replacement"
              value={form.service_type}
              onChange={(e) => setForm({ ...form, service_type: e.target.value })}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Cost (₹)</label>
            <input
              type="number"
              required
              placeholder="4500"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Service Date</label>
          <input
            type="date"
            required
            value={form.service_date}
            onChange={(e) => setForm({ ...form, service_date: e.target.value })}
            className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
          />
        </div>

        <button type="submit" className="w-full bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 rounded text-sm transition">
          Log Maintenance (Auto-Set IN_SHOP)
        </button>
      </form>
    </div>
  );
}