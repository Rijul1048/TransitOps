'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { useSearch } from '@/contexts/SearchContext';
import { matchesSearch } from '@/lib/search';
import { Download } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';

export default function AnalyticsPage() {
  const { query } = useSearch();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/analytics/summary').then((res) => setData(res.data)).catch(console.error);
  }, []);

  const downloadCSV = () => {
    if (!data?.vehicle_financials) return;
    const headers = ['Vehicle ID,Registration,Model,Revenue,Fuel Cost,Maintenance Cost,Fuel Efficiency (km/L),ROI (%)'];
    const rows = data.vehicle_financials.map((v: any) =>
      `${v.id},"${v.reg_no}","${v.model_name}",${v.revenue},${v.fuel_cost},${v.maintenance_cost},${v.fuel_efficiency_km_l},${v.roi_percent}%`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `TransitOps_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const financials = useMemo(() => {
    if (!data?.vehicle_financials) return [];
    return data.vehicle_financials.filter((v: any) =>
      matchesSearch(query, v.reg_no, v.model_name, v.status, ...(v.trip_codes || []))
    );
  }, [data, query]);

  const recentTrips = useMemo(() => {
    if (!data?.recent_trips) return [];
    return data.recent_trips.filter((t: any) =>
      matchesSearch(query, t.trip_code, t.vehicle_reg, t.status)
    );
  }, [data, query]);

  const recentFuelLogs = useMemo(() => {
    if (!data?.recent_fuel_logs) return [];
    return data.recent_fuel_logs.filter((log: any) =>
      matchesSearch(query, log.vehicle_reg, log.trip_code)
    );
  }, [data, query]);

  if (!data) return <div className="text-gray-400 text-sm animate-pulse">Loading analytics...</div>;

  const roiChartData = financials.map((v: any) => ({
    name: v.reg_no,
    ROI: v.roi_percent,
    Revenue: v.revenue,
    'Op. Cost': v.fuel_cost + v.maintenance_cost,
  }));

  const fuelChartData = financials
    .filter((v: any) => v.fuel_liters > 0)
    .map((v: any) => ({
      name: v.reg_no,
      'km/L': v.fuel_efficiency_km_l,
      Liters: v.fuel_liters,
    }));

  const customTooltipStyle = {
    backgroundColor: '#1a1a1a',
    border: '1px solid #374151',
    borderRadius: '8px',
    color: '#e5e7eb',
    fontSize: '12px',
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Analytics & Reports</h2>
          <p className="text-xs text-gray-400 mt-1">Fleet performance, ROI, and fuel efficiency metrics</p>
        </div>
        <button
          onClick={downloadCSV}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-bold text-gray-300">Latest Trips</h3>
          </div>
          <table className="w-full text-left text-sm text-gray-300">
            <tbody className="divide-y divide-gray-800">
              {recentTrips.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-4 text-center text-gray-500 text-xs">{query ? `No trips match "${query}".` : 'No recent trips.'}</td></tr>
              ) : recentTrips.map((t: any, i: number) => (
                <tr key={i} className="hover:bg-gray-900/30">
                  <td className="px-4 py-2 font-mono text-amber-500 text-xs">{t.trip_code}</td>
                  <td className="px-4 py-2 text-xs">{t.vehicle_reg ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-bold text-gray-300">Latest Fuel Logs</h3>
          </div>
          <table className="w-full text-left text-sm text-gray-300">
            <tbody className="divide-y divide-gray-800">
              {recentFuelLogs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-500 text-xs">{query ? `No fuel logs match "${query}".` : 'No recent fuel logs.'}</td></tr>
              ) : recentFuelLogs.map((log: any, i: number) => (
                <tr key={i} className="hover:bg-gray-900/30">
                  <td className="px-4 py-2 font-mono text-amber-500 text-xs">{log.vehicle_reg}</td>
                  <td className="px-4 py-2 text-xs">{log.trip_code ?? 'Standalone'}</td>
                  <td className="px-4 py-2 text-xs text-sky-400">{log.liters} L</td>
                  <td className="px-4 py-2 text-xs text-rose-400">₹{log.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Fleet Utilization', value: `${data.kpis.fleet_utilization_pct}%`, color: 'text-amber-500' },
          { label: 'Active Trips', value: data.kpis.active_trips, color: 'text-sky-400' },
          { label: 'Vehicles In Shop', value: data.kpis.in_shop, color: 'text-rose-400' },
          { label: 'Available Vehicles', value: data.kpis.available_vehicles, color: 'text-emerald-400' },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#121212] border border-gray-800 p-5 rounded-lg">
            <p className="text-xs text-gray-400">{kpi.label}</p>
            <p className={`text-3xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-[#121212] border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-bold text-gray-300 mb-4">Revenue vs. Operational Cost by Vehicle</h3>
          {roiChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={roiChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                <Bar dataKey="Revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Op. Cost" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-600 text-sm">
              {query ? `No data matches "${query}".` : 'No completed trips yet'}
            </div>
          )}
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-lg p-5">
          <h3 className="text-sm font-bold text-gray-300 mb-4">Fuel Efficiency by Vehicle (km/L)</h3>
          {fuelChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={fuelChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }} />
                <Bar dataKey="km/L" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Liters" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-60 flex items-center justify-center text-gray-600 text-sm">No fuel logs yet</div>
          )}
        </div>

        <div className="bg-[#121212] border border-gray-800 rounded-lg p-5 xl:col-span-2">
          <h3 className="text-sm font-bold text-gray-300 mb-4">Vehicle ROI % <span className="text-gray-600 font-normal">(Revenue - Costs) / Acquisition Cost</span></h3>
          {roiChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={roiChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={customTooltipStyle} formatter={(v: any) => [`${v}%`, 'ROI']} />
                <Line type="monotone" dataKey="ROI" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-600 text-sm">No data to display</div>
          )}
        </div>
      </div>

      {/* Financial Table */}
      <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800">
          <h3 className="text-sm font-bold text-gray-300">Per-Vehicle Financial Breakdown <span className="text-gray-600 font-normal">(sorted by latest activity)</span></h3>
        </div>
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs border-b border-gray-800 font-semibold tracking-wider">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Revenue (₹)</th>
              <th className="px-4 py-3">Fuel Cost (₹)</th>
              <th className="px-4 py-3">Maintenance (₹)</th>
              <th className="px-4 py-3">Fuel Eff.</th>
              <th className="px-4 py-3">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {financials.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">{query ? `No data matches "${query}".` : 'No vehicle data available.'}</td></tr>
            ) : (
              financials.map((v: any) => (
                <tr key={v.id} className="hover:bg-gray-900/50 transition">
                  <td className="px-4 py-3 font-medium text-white">{v.model_name} <span className="text-amber-500 font-mono text-xs">({v.reg_no})</span></td>
                  <td className="px-4 py-3 text-emerald-400 font-bold">₹{v.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-300">₹{v.fuel_cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-rose-400">₹{v.maintenance_cost.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sky-400 font-mono">
                    {v.fuel_efficiency_km_l > 0 ? `${v.fuel_efficiency_km_l} km/L` : <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${v.roi_percent >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {v.roi_percent}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
