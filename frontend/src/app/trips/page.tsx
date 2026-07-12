'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function TripsPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [form, setForm] = useState({
    trip_code: '',
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight_kg: '',
    planned_distance_km: '',
    revenue: '',
  });

  useEffect(() => {
    async function loadDispatchData() {
      try {
        const [vRes, dRes] = await Promise.all([
          api.get('/vehicles/dispatch-pool'),
          api.get('/drivers'),
        ]);
        setVehicles(vRes.data);
        setDrivers(dRes.data);
      } catch (err) {
        console.error(err);
      }
    }
    loadDispatchData();
  }, []);

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        trip_code: form.trip_code,
        source: form.source,
        destination: form.destination,
        vehicle_id: form.vehicle_id ? Number(form.vehicle_id) : null,
        driver_id: form.driver_id ? Number(form.driver_id) : null,
        cargo_weight_kg: Number(form.cargo_weight_kg),
        planned_distance_km: Number(form.planned_distance_km),
        revenue: Number(form.revenue || 0),
      };

      const res = await api.post('/trips', payload);
      setSuccessMsg(`Trip ${res.data.trip_code} created successfully!`);
      setForm({
        trip_code: '',
        source: '',
        destination: '',
        vehicle_id: '',
        driver_id: '',
        cargo_weight_kg: '',
        planned_distance_km: '',
        revenue: '',
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create trip.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-xl font-bold text-white">3. Trip Dispatcher</h2>

      {errorMsg && (
        <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-4 rounded-lg text-sm font-medium">
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-800 text-emerald-300 p-4 rounded-lg text-sm font-medium">
          ✅ {successMsg}
        </div>
      )}

      <form onSubmit={handleCreateTrip} className="bg-[#121212] border border-gray-800 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Trip Code</label>
            <input
              required
              value={form.trip_code}
              onChange={(e) => setForm({ ...form, trip_code: e.target.value })}
              placeholder="TRIP-1001"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Source</label>
            <input
              required
              value={form.source}
              onChange={(e) => setForm({ ...form, source: e.target.value })}
              placeholder="Mumbai"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Destination</label>
            <input
              required
              value={form.destination}
              onChange={(e) => setForm({ ...form, destination: e.target.value })}
              placeholder="Pune"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Vehicle</label>
            <select
              value={form.vehicle_id}
              onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
            >
              <option value="">-- Select Available Vehicle --</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.model_name} ({v.reg_no}) - Max Cap: {v.max_capacity_kg}kg
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Driver</label>
            <select
              value={form.driver_id}
              onChange={(e) => setForm({ ...form, driver_id: e.target.value })}
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
            >
              <option value="">-- Select Driver --</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Cargo Weight (kg)</label>
            <input
              type="number"
              required
              value={form.cargo_weight_kg}
              onChange={(e) => setForm({ ...form, cargo_weight_kg: e.target.value })}
              placeholder="1500"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Distance (km)</label>
            <input
              type="number"
              required
              value={form.planned_distance_km}
              onChange={(e) => setForm({ ...form, planned_distance_km: e.target.value })}
              placeholder="180"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Revenue (₹)</label>
            <input
              type="number"
              value={form.revenue}
              onChange={(e) => setForm({ ...form, revenue: e.target.value })}
              placeholder="25000"
              className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-6 py-2.5 rounded-lg text-sm transition w-full"
        >
          Create & Validate Trip
        </button>
      </form>
    </div>
  );
}