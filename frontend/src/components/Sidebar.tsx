'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import TransparentLogo from '@/components/TransparentLogo';
import { 
  FiHome, FiPackage, FiTruck, FiUsers, 
  FiClipboard, FiMapPin, FiLogOut, FiSettings, FiActivity, FiCalendar, FiUser, FiMenu, FiX, FiTag
} from 'react-icons/fi';

const adminLinks = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Live Tracking', href: '/admin/tracking', icon: FiMapPin },
  { name: 'Field Updates', href: '/admin/social', icon: FiActivity },
  { name: 'Tickets', href: '/admin/tickets', icon: FiTag },
  { name: 'Installations', href: '/admin/machines', icon: FiPackage },
  { name: 'Inventory', href: '/admin/stock', icon: FiTruck },
  { name: 'Attendance', href: '/admin/attendance', icon: FiClipboard },
  { name: 'Employees', href: '/admin/employees', icon: FiUsers },
];

const employeeLinks = [
  { name: 'My Attendance', href: '/employee/attendance', icon: FiClipboard },
  { name: 'Field Updates', href: '/admin/social', icon: FiActivity },
  { name: 'My Tickets', href: '/employee/tickets', icon: FiTag },
  { name: 'Installations', href: '/employee/installations', icon: FiPackage },
  { name: 'Tracking', href: '/employee/tracking', icon: FiMapPin },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>({});
  const [links, setLinks] = useState<any[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [isOpen, setIsOpen] = useState(false); // Mobile state

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
    <>
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-[100] p-2.5 bg-[#121c2c] border border-[#1e2d42] rounded-xl shadow-lg text-white"
        title="Toggle Menu"
      >
        {isOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
      </button>

      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="md:hidden fixed inset-0 bg-[#070c14]/65 backdrop-blur-sm z-[80]"
        />
      )}

      {/* Main Sidebar Wrapper */}
      <div className={`
        w-64 bg-[#121c2c] h-screen border-r border-[#1e2d42] flex flex-col fixed left-0 top-0 shadow-xl no-print z-[90]
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header Branding Container */}
        <div className="bg-[#0b121f] px-6 py-5 border-b border-[#1e2d42] flex flex-col items-center gap-2">
          <div className="flex items-center justify-center p-1 bg-white/5 rounded-xl border border-white/10">
            <TransparentLogo src="/logo.jpg" alt="Sonoray Logo" style={{ height: '32px', width: 'auto' }} />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-300 tracking-wider uppercase">Sonoray ERP</span>
            <span className="px-2 py-0.5 mt-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {!mounted ? '...' : (role === 'ADMIN' || role === 'SUPER_ADMIN' ? 'Administrator' : 'Field Engineer')}
            </span>
          </div>
        </div>

        {/* Scrollable Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800" onClick={() => setIsOpen(false)}>
          {links.map((link) => {
            if (link.name === 'Attendance') {
              return (
                <div key="Attendance-Group" className="space-y-1">
                  <div className="flex items-center gap-2 px-4 py-2.5 text-slate-500 text-[9px] font-black uppercase tracking-widest mt-3">
                    <FiClipboard className="w-3.5 h-3.5" />
                    <span>Attendance Records</span>
                  </div>
                  <div className="pl-3 ml-4 border-l border-[#1e2d42] space-y-1">
                    {years.map(year => {
                      const isYearActive = pathname === `/admin/attendance/${year}`;
                      return (
                        <Link 
                          key={year} 
                          href={`/admin/attendance/${year}`}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 ${
                            isYearActive
                              ? 'text-blue-400 font-semibold' 
                              : 'text-slate-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          <FiCalendar className="w-3.5 h-3.5" />
                          <span>Year {year}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            return (
              <Link 
                key={link.name} 
                href={link.href}
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border-l-4 ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border-blue-500 font-bold' 
                    : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white hover:border-slate-700/60'
                }`}
              >
                <link.icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-115 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}

          {/* User Records section if admin has an employee ID */}
          {(role === 'ADMIN' || role === 'SUPER_ADMIN') && hasEmployeeRecord && (
            <div className="pt-4 space-y-1">
              <div className="flex items-center gap-2 px-4 py-2.5 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                <FiUser className="w-3.5 h-3.5" />
                <span>My Profile</span>
              </div>
              <Link 
                href="/employee/attendance"
                className={`group flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all duration-200 border-l-4 ${
                  pathname === '/employee/attendance'
                    ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500 font-bold' 
                    : 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white hover:border-slate-700/60'
                }`}
              >
                <FiUser className="w-4 h-4 transition-transform duration-200 group-hover:scale-115 text-slate-400 group-hover:text-white" />
                <span>My Attendance</span>
              </Link>
            </div>
          )}
        </nav>

        {/* Footer Area with Settings and Logout */}
        <div className="p-3 bg-[#0b121f]/60 border-t border-[#1e2d42] space-y-2">
          <div className="flex gap-2">
            <Link 
              href="/employee/profile"
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-200 ${
                pathname === '/employee/profile'
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#182232] text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <FiSettings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider bg-rose-600/10 text-rose-400 border border-rose-500/20 hover:bg-rose-600 hover:text-white transition-all duration-200"
            >
              <FiLogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

          {/* Developer Credit Signature */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-[#182232] to-[#0b121f] border border-[#1e2d42] flex flex-col gap-1">
            <span className="text-[7px] font-black text-blue-400 uppercase tracking-widest">ERP Developer</span>
            <span className="text-xs font-black text-white leading-none">YUGESH ELUMALAI</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[7px] font-black uppercase tracking-widest rounded-full leading-none">
                System Architect
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[7px] font-bold text-slate-500">Live</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
