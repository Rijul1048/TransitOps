'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useSearch } from '@/contexts/SearchContext';
import { matchesSearch } from '@/lib/search';
import { Plus, X, AlertCircle } from 'lucide-react';

interface Vehicle {
  id: number;
  reg_no: string;
  model_name: string;
  vehicle_type: string;
  max_capacity_kg: number;
  odometer_km: number;
  acquisition_cost: number;
  status: string;
  region: string;
}

export default function FleetPage() {
  const { query } = useSearch();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    reg_no: '',
    model_name: '',
    vehicle_type: 'Truck',
    max_capacity_kg: '',
    odometer_km: '0',
    acquisition_cost: '',
    region: 'Default',
  });

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const payload = {
        reg_no: form.reg_no,
        model_name: form.model_name,
        vehicle_type: form.vehicle_type,
        max_capacity_kg: Number(form.max_capacity_kg),
        odometer_km: Number(form.odometer_km || 0),
        acquisition_cost: Number(form.acquisition_cost),
        region: form.region || 'Default',
      };

      const res = await api.post('/vehicles', payload);
      setVehicles([res.data, ...vehicles]);
      setIsModalOpen(false);
      setForm({
        reg_no: '',
        model_name: '',
        vehicle_type: 'Truck',
        max_capacity_kg: '',
        odometer_km: '0',
        acquisition_cost: '',
        region: 'Default',
      });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to add vehicle. Ensure registration number is unique.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredVehicles = useMemo(
    () =>
      vehicles.filter((v) =>
        matchesSearch(query, v.reg_no, v.model_name, v.vehicle_type, v.status, v.region)
      ),
    [vehicles, query]
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-emerald-950 text-emerald-400 border border-emerald-800">Available</span>;
      case 'ON_TRIP':
        return <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-sky-950 text-sky-400 border border-sky-800">On Trip</span>;
      case 'IN_SHOP':
        return <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-amber-950 text-amber-400 border border-amber-800">In Shop</span>;
      default:
        return <span className="px-2.5 py-1 text-xs rounded-full font-medium bg-rose-950 text-rose-400 border border-rose-800">Retired</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">2. Vehicle Registry</h2>
          <p className="text-xs text-gray-400 mt-1">Manage fleet assets, load capacities, and lifecycle status</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition flex items-center gap-2 shadow-lg shadow-amber-950/20"
        >
          <Plus className="w-4 h-4" /> Add Vehicle
        </button>
      </div>

      {/* Vehicle Table */}
      <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs border-b border-gray-800 font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3">Reg No. (Unique)</th>
              <th className="px-4 py-3">Name / Model</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Max Capacity</th>
              <th className="px-4 py-3">Odometer</th>
              <th className="px-4 py-3">Acq. Cost</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Loading vehicles...
                </td>
              </tr>
            ) : filteredVehicles.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  {query ? `No vehicles match "${query}".` : 'No vehicles registered yet. Click "+ Add Vehicle" to register one.'}
                </td>
              </tr>
            ) : (
              filteredVehicles.map((v) => (
                <tr key={v.id} className="hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-amber-400">{v.reg_no}</td>
                  <td className="px-4 py-3 font-medium text-white">{v.model_name}</td>
                  <td className="px-4 py-3 text-gray-400">{v.vehicle_type}</td>
                  <td className="px-4 py-3">{v.max_capacity_kg.toLocaleString()} kg</td>
                  <td className="px-4 py-3 font-mono">{v.odometer_km.toLocaleString()} km</td>
                  <td className="px-4 py-3">₹{v.acquisition_cost.toLocaleString()}</td>
                  <td className="px-4 py-3">{getStatusBadge(v.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-amber-500/80 font-mono">
        Mandatory Business Rules: Registration No. must be unique · Retired/In Shop vehicles automatically hidden from Trip Dispatcher.
      </p>

      {/* --- ADD VEHICLE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-gray-800 rounded-xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Register New Vehicle</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-lg text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleCreateVehicle} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Registration No. *</label>
                  <input
                    required
                    placeholder="e.g. MH-12-AB-1234"
                    value={form.reg_no}
                    onChange={(e) => setForm({ ...form, reg_no: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Vehicle Name / Model *</label>
                  <input
                    required
                    placeholder="e.g. Tata Prima 3530"
                    value={form.model_name}
                    onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Vehicle Type *</label>
                  <select
                    value={form.vehicle_type}
                    onChange={(e) => setForm({ ...form, vehicle_type: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Truck">Truck</option>
                    <option value="Van">Van</option>
                    <option value="Mini Truck">Mini Truck</option>
                    <option value="Container">Container</option>
                    <option value="Trailer">Trailer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Max Capacity (kg) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5000"
                    value={form.max_capacity_kg}
                    onChange={(e) => setForm({ ...form, max_capacity_kg: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Initial Odometer (km)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={form.odometer_km}
                    onChange={(e) => setForm({ ...form, odometer_km: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Acquisition Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2500000"
                    value={form.acquisition_cost}
                    onChange={(e) => setForm({ ...form, acquisition_cost: e.target.value })}
                    className="w-full bg-[#1e1e1e] border border-gray-700 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
                >
                  {submitting ? 'Registering...' : 'Save & Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}