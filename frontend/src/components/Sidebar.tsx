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
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Role = 'FLEET_MANAGER' | 'DISPATCHER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST';

const navItems: { name: string; href: string; icon: React.ElementType; roles: Role[] }[] = [
  { 
    name: 'Dashboard', href: '/', icon: LayoutDashboard, 
    roles: ['FLEET_MANAGER', 'DISPATCHER', 'SAFETY_OFFICER', 'FINANCIAL_ANALYST'],
  },
  { 
    name: 'Fleet', href: '/fleet', icon: Truck, 
    roles: ['FLEET_MANAGER', 'DISPATCHER'],
  },
  { 
    name: 'Drivers', href: '/drivers', icon: Users, 
    roles: ['FLEET_MANAGER', 'SAFETY_OFFICER'],
  },
  { 
    name: 'Trips', href: '/trips', icon: Navigation, 
    roles: ['FLEET_MANAGER', 'DISPATCHER'],
  },
  { 
    name: 'Maintenance', href: '/maintenance', icon: Wrench, 
    roles: ['FLEET_MANAGER'],
  },
  { 
    name: 'Fuel & Expenses', href: '/fuel-expenses', icon: Fuel, 
    roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'],
  },
  { 
    name: 'Analytics', href: '/analytics', icon: BarChart3, 
    roles: ['FLEET_MANAGER', 'FINANCIAL_ANALYST'],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const userRole = user?.role as Role | undefined;

  const visibleItems = userRole
    ? navItems.filter((item) => item.roles.includes(userRole))
    : navItems;

  return (
    <aside className="w-64 bg-[#121212] border-r border-gray-800 text-gray-300 min-h-screen flex flex-col p-4">
      <div className="mb-8 px-2">
        <h1 className="text-xl font-bold text-white tracking-wide">TransitOps</h1>
        <p className="text-xs text-gray-500">Smart Transport Platform</p>
      </div>

      <nav className="space-y-1 flex-1">
        {visibleItems.map((item) => {
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