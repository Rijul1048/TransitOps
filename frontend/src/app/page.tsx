'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Truck, Users, Navigation, Wrench, Clock, UserCheck, CheckCircle2, Activity } from 'lucide-react';

export default function DashboardPage() {
  const [kpis, setKpis] = useState<any>(null);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      try {
        const [summaryRes, tripsRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/trips'),
        ]);
        setKpis(summaryRes.data.kpis);
        setRecentTrips((tripsRes.data || []).slice(0, 5));
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      }
    }
    loadStats();
  }, []);

  const statCards = kpis ? [
    { title: 'Total Fleet', value: kpis.total_vehicles, icon: Truck, color: 'text-amber-500', bg: 'bg-amber-950/50 border-amber-900' },
    { title: 'Available Vehicles', value: kpis.available_vehicles, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-950/50 border-emerald-900' },
    { title: 'In Maintenance', value: kpis.in_shop, icon: Wrench, color: 'text-rose-400', bg: 'bg-rose-950/50 border-rose-900' },
    { title: 'Active Trips', value: kpis.active_trips, icon: Navigation, color: 'text-sky-400', bg: 'bg-sky-950/50 border-sky-900' },
    { title: 'Pending Trips', value: kpis.pending_trips, icon: Clock, color: 'text-orange-400', bg: 'bg-orange-950/50 border-orange-900' },
    { title: 'Drivers On Duty', value: kpis.drivers_on_duty, icon: UserCheck, color: 'text-purple-400', bg: 'bg-purple-950/50 border-purple-900' },
    { title: 'Fleet Utilization', value: `${kpis.fleet_utilization_pct}%`, icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-950/50 border-cyan-900' },
  ] : [];

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-gray-800 text-gray-300 border-gray-700',
      DISPATCHED: 'bg-sky-950 text-sky-400 border-sky-800',
      COMPLETED: 'bg-emerald-950 text-emerald-400 border-emerald-800',
      CANCELLED: 'bg-rose-950 text-rose-400 border-rose-800',
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full font-medium border ${map[status] || 'bg-gray-800 text-gray-400'}`}>
        {status.charAt(0) + status.slice(1).toLowerCase()}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white">Executive Command Center</h2>
        <p className="text-xs text-gray-400 mt-1">Real-time operational overview of the TransitOps fleet</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className={`border rounded-lg p-4 flex flex-col gap-2 ${card.bg}`}>
              <div className={`p-2 rounded-lg bg-black/30 w-fit ${card.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{card.title}</p>
              </div>
            </div>
          );
        })}
        {!kpis && (
          <div className="col-span-full text-gray-600 text-sm">Loading metrics...</div>
        )}
      </div>

      {/* Recent Trips */}
      {recentTrips.length > 0 && (
        <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-300">Recent Trips</h3>
            <a href="/trips" className="text-xs text-amber-500 hover:underline">View all →</a>
          </div>
          <table className="w-full text-left text-sm text-gray-300">
            <thead className="text-gray-500 text-xs border-b border-gray-800">
              <tr>
                <th className="px-4 py-2">Trip Code</th>
                <th className="px-4 py-2">Route</th>
                <th className="px-4 py-2">Vehicle</th>
                <th className="px-4 py-2">Driver</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {recentTrips.map((t) => (
                <tr key={t.id} className="hover:bg-gray-900/30 transition">
                  <td className="px-4 py-2.5 font-mono text-amber-500 text-xs">{t.trip_code}</td>
                  <td className="px-4 py-2.5 text-xs">{t.source} → {t.destination}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{t.vehicle_reg ?? '—'}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{t.driver_name ?? '—'}</td>
                  <td className="px-4 py-2.5">{getStatusBadge(t.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}