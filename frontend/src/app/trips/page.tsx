'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Plus, X, Play, CheckCircle2, Ban, MapPin } from 'lucide-react';

interface Trip {
  id: number;
  trip_code: string;
  source: string;
  destination: string;
  status: string;
  cargo_weight_kg: number;
  planned_distance_km: number;
  revenue: number;
  created_at: string;
  vehicle_id: number | null;
  vehicle_reg: string | null;
  vehicle_model: string | null;
  vehicle_odometer: number | null;
  driver_id: number | null;
  driver_name: string | null;
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [completeTrip, setCompleteTrip] = useState<Trip | null>(null);
  const [completeModalError, setCompleteModalError] = useState('');
  
  // Form States
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
  const [completeForm, setCompleteForm] = useState({
    final_odometer: '',
    fuel_consumed: '',
  });
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, vRes, dRes] = await Promise.all([
        api.get('/trips'),
        api.get('/vehicles/dispatch-pool'),
        api.get('/drivers')
      ]);
      setTrips(tRes.data);
      setVehicles(vRes.data);
      // Only available drivers for dispatch
      setDrivers(dRes.data.filter((d: any) => d.status === 'AVAILABLE' && new Date(d.license_expiry) >= new Date()));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      setSuccessMsg(`Trip ${res.data.trip_code} created successfully.`);
      setIsCreateModalOpen(false);
      setForm({ trip_code: '', source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight_kg: '', planned_distance_km: '', revenue: '' });
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to create trip.');
    }
  };

  const handleDispatch = async (tripId: number) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/trips/${tripId}/dispatch`);
      setSuccessMsg(res.data.detail);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to dispatch trip.');
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeTrip) return;
    setCompleteModalError('');
    setSuccessMsg('');

    try {
      const res = await api.post(`/trips/${completeTrip.id}/complete`, {
        final_odometer: Number(completeForm.final_odometer),
        fuel_consumed: Number(completeForm.fuel_consumed),
      });
      setSuccessMsg(res.data.detail);
      setCompleteTrip(null);
      setCompleteModalError('');
      setCompleteForm({ final_odometer: '', fuel_consumed: '' });
      fetchData();
    } catch (err: any) {
      // Display error inline in modal — do NOT close
      setCompleteModalError(err.response?.data?.detail || 'Failed to complete trip.');
    }
  };

  const handleCancel = async (tripId: number) => {
    if (!confirm('Are you sure you want to cancel this trip?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await api.post(`/trips/${tripId}/cancel`);
      setSuccessMsg(res.data.detail);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to cancel trip.');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-gray-800 text-gray-300 border border-gray-700">Draft</span>;
      case 'DISPATCHED':
        return <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-sky-950 text-sky-400 border border-sky-800">Dispatched</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-rose-950 text-rose-400 border border-rose-800">Cancelled</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Trip Management & Dispatch</h2>
          <p className="text-xs text-gray-400 mt-1">Manage lifecycle from draft to completion</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Trip
        </button>
      </div>

      {successMsg && <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-lg text-sm font-medium">{successMsg}</div>}
      {errorMsg && <div className="p-3 bg-rose-950/80 border border-rose-800 text-rose-300 rounded-lg text-sm font-medium">{errorMsg}</div>}

      <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs border-b border-gray-800 font-semibold">
            <tr>
              <th className="px-4 py-3">Trip Code</th>
              <th className="px-4 py-3">Route</th>
              <th className="px-4 py-3">Assignment</th>
              <th className="px-4 py-3">Cargo/Dist</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {trips.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No trips found.</td>
              </tr>
            ) : (
              trips.map((t) => (
                <tr key={t.id} className="hover:bg-gray-900/50 transition">
                  <td className="px-4 py-3 font-mono font-bold text-amber-500">{t.trip_code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-white">{t.source}</span>
                      <MapPin className="w-3 h-3 text-gray-500" />
                      <span className="font-medium text-white">{t.destination}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs">
                      <div className="text-gray-300">{t.vehicle_reg ? `${t.vehicle_model} (${t.vehicle_reg})` : <span className="text-amber-600/80 italic">Unassigned Vehicle</span>}</div>
                      <div className="text-gray-500">{t.driver_name ? t.driver_name : <span className="text-amber-600/80 italic">Unassigned Driver</span>}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <div>{t.cargo_weight_kg} kg</div>
                    <div className="text-gray-500">{t.planned_distance_km} km</div>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(t.status)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      {t.status === 'DRAFT' && (
                        <>
                          <button onClick={() => handleDispatch(t.id)} className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-2.5 py-1 rounded flex items-center gap-1 transition">
                            <Play className="w-3.5 h-3.5" /> Dispatch
                          </button>
                          <button onClick={() => handleCancel(t.id)} className="bg-rose-900 hover:bg-rose-800 text-rose-300 text-xs px-2.5 py-1 rounded flex items-center gap-1 transition">
                            <Ban className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </>
                      )}
                      {t.status === 'DISPATCHED' && (
                        <>
                          <button onClick={() => { setCompleteTrip(t); setCompleteModalError(''); setCompleteForm({ final_odometer: '', fuel_consumed: '' }); }} className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5 py-1 rounded flex items-center gap-1 transition">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                          </button>
                          <button onClick={() => handleCancel(t.id)} className="bg-rose-900 hover:bg-rose-800 text-rose-300 text-xs px-2.5 py-1 rounded flex items-center gap-1 transition">
                            <Ban className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Trip Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-gray-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Create New Trip</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-400 mb-1">Trip Code *</label>
                  <input required placeholder="TRP-1001" value={form.trip_code} onChange={(e) => setForm({ ...form, trip_code: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm font-mono text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Source Location *</label>
                  <input required value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Destination *</label>
                  <input required value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Assign Vehicle</label>
                  <select value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white">
                    <option value="">-- No Vehicle Assigned --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>{v.model_name} ({v.reg_no}) - Max {v.max_capacity_kg}kg</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Assign Driver</label>
                  <select value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white">
                    <option value="">-- No Driver Assigned --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>{d.name} ({d.license_category})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Cargo Weight (kg) *</label>
                  <input type="number" required value={form.cargo_weight_kg} onChange={(e) => setForm({ ...form, cargo_weight_kg: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Distance (km) *</label>
                  <input type="number" required value={form.planned_distance_km} onChange={(e) => setForm({ ...form, planned_distance_km: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Expected Revenue (₹)</label>
                  <input type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white" />
                </div>
              </div>

              <div className="pt-3 flex gap-3 justify-end">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
                <button type="submit" className="bg-amber-600 hover:bg-amber-500 text-white px-5 py-2 rounded text-sm font-medium">Create Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {completeTrip && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#121212] border border-gray-800 rounded-xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Complete Trip: <span className="font-mono text-amber-500">{completeTrip.trip_code}</span></h3>
            <p className="text-xs text-gray-400">Enter the final readings to close this trip and restore the vehicle and driver.</p>

            {/* Contextual helper */}
            {completeTrip.vehicle_odometer !== null && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 space-y-0.5">
                <div>Starting Odometer: <span className="font-mono font-bold text-amber-400">{completeTrip.vehicle_odometer.toLocaleString()} km</span></div>
                <div>Planned Distance: <span className="font-mono font-bold text-sky-400">{completeTrip.planned_distance_km} km</span></div>
                <div>Expected Final: <span className="font-mono font-bold text-emerald-400">~{(completeTrip.vehicle_odometer + completeTrip.planned_distance_km).toLocaleString()} km</span></div>
              </div>
            )}

            {/* Inline error — modal stays open */}
            {completeModalError && (
              <div className="p-3 bg-rose-950 border border-rose-800 text-rose-300 text-xs rounded-lg font-medium">{completeModalError}</div>
            )}
            
            <form onSubmit={handleComplete} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Final Odometer Reading (km) *</label>
                <input
                  type="number"
                  required
                  min={completeTrip.vehicle_odometer ?? 0}
                  value={completeForm.final_odometer}
                  onChange={(e) => setCompleteForm({ ...completeForm, final_odometer: e.target.value })}
                  className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Fuel Consumed (Liters) *</label>
                <input type="number" step="0.1" required value={completeForm.fuel_consumed} onChange={(e) => setCompleteForm({ ...completeForm, fuel_consumed: e.target.value })} className="w-full bg-[#1e1e1e] border border-gray-700 rounded p-2 text-sm text-white" />
              </div>

              <div className="pt-3 flex gap-3 justify-end">
                <button type="button" onClick={() => { setCompleteTrip(null); setCompleteModalError(''); }} className="px-4 py-2 text-sm text-gray-400">Cancel</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded text-sm font-medium">Complete Trip</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}