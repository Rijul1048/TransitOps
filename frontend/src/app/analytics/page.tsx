'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Download } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/analytics/summary').then((res) => setData(res.data));
  }, []);

  const downloadCSV = () => {
    if (!data?.vehicle_financials) return;
    
    const headers = ['Vehicle ID, Registration, Model, Revenue, Fuel Cost, Maintenance Cost, ROI (%)'];
    const rows = data.vehicle_financials.map((v: any) => 
      `${v.id},"${v.reg_no}","${v.model_name}",${v.revenue},${v.fuel_cost},${v.maintenance_cost},${v.roi_percent}%`
    );

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TransitOps_Financial_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!data) return <div className="text-gray-400 text-sm">Loading analytics...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">5. Financial & ROI Analytics</h2>
        <button
          onClick={downloadCSV}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#121212] border border-gray-800 p-5 rounded-lg">
          <p className="text-xs text-gray-400">Fleet Utilization</p>
          <p className="text-3xl font-bold text-amber-500 mt-1">{data.kpis.fleet_utilization_pct}%</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 p-5 rounded-lg">
          <p className="text-xs text-gray-400">Vehicles In Shop</p>
          <p className="text-3xl font-bold text-rose-500 mt-1">{data.kpis.in_shop}</p>
        </div>
        <div className="bg-[#121212] border border-gray-800 p-5 rounded-lg">
          <p className="text-xs text-gray-400">Active Trips</p>
          <p className="text-3xl font-bold text-sky-500 mt-1">{data.kpis.active_trips}</p>
        </div>
      </div>

      <div className="bg-[#121212] border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-[#1a1a1a] text-gray-400 uppercase text-xs border-b border-gray-800">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Revenue (₹)</th>
              <th className="px-4 py-3">Fuel Cost (₹)</th>
              <th className="px-4 py-3">Maintenance (₹)</th>
              <th className="px-4 py-3">Calculated ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {data.vehicle_financials.map((v: any) => (
              <tr key={v.id} className="hover:bg-gray-900/50">
                <td className="px-4 py-3 font-medium text-white">{v.model_name} ({v.reg_no})</td>
                <td className="px-4 py-3 text-emerald-400">₹{v.revenue.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-300">₹{v.fuel_cost.toLocaleString()}</td>
                <td className="px-4 py-3 text-rose-400">₹{v.maintenance_cost.toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-amber-500">{v.roi_percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}