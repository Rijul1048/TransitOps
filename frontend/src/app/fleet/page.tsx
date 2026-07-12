'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Vehicle {
  id: number;
  reg_no: str;
  model_name: string;
  vehicle_type: string;
  max_capacity_kg: number;
  odometer_km: number;
  acquisition_cost: number;
  status: string;
}

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2 py-1 text-xs rounded font-medium bg-emerald-900/60 text-emerald-300 border border-emerald-700">Available</span>;
      case 'ON_TRIP':
        return <span className="px-2 py-1 text-xs rounded font-medium bg-sky-900/60 text-sky-300 border border-sky-700">On Trip</span>;
      case 'IN_SHOP':
        return <span className="px-2 py-1 text-xs rounded font-medium bg-amber-900/60 text-amber-300 border border-amber-700">In Shop</span>;
      default:
        return <span className="px-2 py-1 text-xs rounded font-medium bg-rose-900/60 text-rose-300 border border-rose-700">Retired</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">2. Vehicle Registry</h2>
        <button className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg font-medium text-sm transition">
          + Add Vehicle
        </button>
      </div>

      <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-4 py-3">Reg No. (Unique)</th>
              <th className="px-4 py-3">Name / Model</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Capacity</th>
              <th className="px-4 py-3">Odometer</th>
              <th className="px-4 py-3">Acq. Cost</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {vehicles.map((v) => (
              <tr key={v.id} className="hover:bg-gray-900/50">
                <td className="px-4 py-3 font-medium text-white">{v.reg_no}</td>
                <td className="px-4 py-3">{v.model_name}</td>
                <td className="px-4 py-3">{v.vehicle_type}</td>
                <td className="px-4 py-3">{v.max_capacity_kg} kg</td>
                <td className="px-4 py-3">{v.odometer_km.toLocaleString()} km</td>
                <td className="px-4 py-3">₹{v.acquisition_cost.toLocaleString()}</td>
                <td className="px-4 py-3">{getStatusBadge(v.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-amber-500 font-mono">
        Rule: Registration No. must be unique · Retired/In Shop vehicles are hidden from Trip Dispatcher
      </p>
    </div>
  );
}