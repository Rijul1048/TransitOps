'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Truck, Users, Navigation, Wrench } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeDrivers: 0,
    ongoingTrips: 0,
    inShop: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [vRes, dRes, tRes] = await Promise.all([
          api.get('/vehicles'),
          api.get('/drivers'),
          api.get('/trips'),
        ]);

        const vehicles = vRes.data || [];
        const drivers = dRes.data || [];
        const trips = tRes.data || [];

        setStats({
          totalVehicles: vehicles.length,
          activeDrivers: drivers.filter((d: any) => d.status === 'AVAILABLE' || d.status === 'ON_TRIP').length,
          ongoingTrips: trips.filter((t: any) => t.status === 'DISPATCHED').length,
          inShop: vehicles.filter((v: any) => v.status === 'IN_SHOP').length,
        });
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      }
    }
    loadStats();
  }, []);

  const statCards = [
    { title: 'Total Fleet', value: stats.totalVehicles, icon: Truck, color: 'text-amber-500' },
    { title: 'Active Drivers', value: stats.activeDrivers, icon: Users, color: 'text-emerald-500' },
    { title: 'Ongoing Trips', value: stats.ongoingTrips, icon: Navigation, color: 'text-sky-500' },
    { title: 'In Maintenance', value: stats.inShop, icon: Wrench, color: 'text-rose-500' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white">1. Executive Command Center</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="bg-[#121212] border border-gray-800 rounded-lg p-5 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-3 bg-gray-900 rounded-lg ${card.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}