'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Navigation, 
  Wrench, 
  Fuel, 
  BarChart3, 
  Settings 
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Fleet', href: '/fleet', icon: Truck },
  { name: 'Drivers', href: '/drivers', icon: Users },
  { name: 'Trips', href: '/trips', icon: Navigation },
  { name: 'Maintenance', href: '/maintenance', icon: Wrench },
  { name: 'Fuel & Expenses', href: '/fuel-expenses', icon: Fuel },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[#121212] border-r border-gray-800 text-gray-300 min-h-screen flex flex-col p-4">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-white tracking-wide">TransitOps</h1>
        <p className="text-xs text-gray-500">Smart Transport Platform</p>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-600 text-white'
                  : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}