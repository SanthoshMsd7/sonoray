'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, FiPackage, FiTruck, FiUsers, 
  FiClipboard, FiMapPin, FiLogOut, FiSettings, FiActivity, FiCalendar, FiUser
} from 'react-icons/fi';

import { useState, useEffect } from 'react';

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Live Tracking', href: '/admin/tracking', icon: FiMapPin },
  { name: 'Field Updates', href: '/admin/social', icon: FiActivity },
  { name: 'Installations', href: '/admin/machines', icon: FiPackage },
  { name: 'Inventory', href: '/admin/stock', icon: FiTruck },
  { name: 'Attendance', href: '/admin/attendance', icon: FiClipboard },
  { name: 'Employees', href: '/admin/employees', icon: FiUsers },
];

const employeeLinks = [
  { name: 'My Attendance', href: '/employee/attendance', icon: FiClipboard },
  { name: 'Field Updates', href: '/admin/social', icon: FiActivity },
  { name: 'My Tickets', href: '/employee/tickets', icon: FiPackage },
  { name: 'Tracking', href: '/employee/tracking', icon: FiMapPin },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>({});
  const [links, setLinks] = useState<any[]>([]);
  const [years, setYears] = useState<number[]>([]);

  const role = user.role;
  const hasEmployeeRecord = !!user.employeeId;

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(savedUser);
    const userRole = savedUser.role;
    setLinks(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' ? adminLinks : employeeLinks);
    setYears(Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i));
    setMounted(true);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div className="w-64 bg-white h-screen border-r border-slate-100 flex flex-col fixed left-0 top-0 shadow-sm">
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-black text-blue-600 tracking-tight">UltaServe<span className="text-slate-400">ERP</span></h1>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
          {!mounted ? '...' : (role === 'ADMIN' || role === 'SUPER_ADMIN' ? 'Administrator' : 'Field Engineer')}
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {links.map((link) => {
          if (link.name === 'Attendance') {
            return (
              <div key="Attendance-Group" className="space-y-1">
                <div className="flex items-center gap-3 px-4 py-3 text-slate-400 text-[10px] font-black uppercase tracking-widest mt-4">
                  Attendance Years
                </div>
                {years.map(year => (
                  <Link 
                    key={year} 
                    href={`/admin/attendance/${year}`}
                    className={`flex items-center gap-3 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      pathname === `/admin/attendance/${year}`
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <FiCalendar className="w-4 h-4" />
                    {year}
                  </Link>
                ))}
              </div>
            );
          }
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link 
              key={link.name} 
              href={link.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-blue-50 text-blue-600 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <link.icon className="w-5 h-5" />
              {link.name}
            </Link>
          );
        })}

        {/* If admin has an employee record, show "My Attendance" link */}
        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && hasEmployeeRecord && (
          <div className="pt-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 pb-2">
              My Records
            </div>
            <Link 
              href="/employee/attendance"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                pathname === '/employee/attendance'
                  ? 'bg-emerald-50 text-emerald-600 font-semibold' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
              }`}
            >
              <FiUser className="w-5 h-5" />
              My Attendance
            </Link>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-50 space-y-1">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-all">
          <FiSettings className="w-5 h-5" />
          Settings
        </button>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
        >
          <FiLogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
