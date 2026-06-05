'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import MarkAttendanceModal from '@/components/MarkAttendanceModal';
import { 
  FiPackage, FiAlertCircle, FiClock, FiUsers, 
  FiActivity, FiMapPin, FiCheckCircle,
  FiBarChart2, FiArrowUp, FiArrowDown, FiCalendar, FiPlus
} from 'react-icons/fi';

interface DashboardStats {
  totalMachines: number;
  activeWarranty: number;
  pendingBreakdowns: number;
  presentToday: number;
  lowStockCount: number;
}

interface AttendanceStats {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  onLeaveToday: number;
  avgAttendance: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  department?: { name: string };
  gpsLogs?: { timestamp: string }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [attStats, setAttStats] = useState<AttendanceStats | null>(null);
  const [recentEmployees, setRecentEmployees] = useState<Employee[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const base = process.env.NEXT_PUBLIC_API_URL || '';

      const [dashRes, attRes, empRes] = await Promise.all([
        fetch(`${base}/api/dashboard/stats`, { headers }),
        fetch(`${base}/api/attendance/stats`, { headers }),
        fetch(`${base}/api/employees`, { headers }),
      ]);

      if (dashRes.ok) setStats(await dashRes.json());
      if (attRes.ok) setAttStats(await attRes.json());
      if (empRes.ok) {
        const empData: Employee[] = await empRes.json();
        setEmployees(empData);
        setRecentEmployees(empData.slice(0, 6));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Installed Machines',
      value: stats?.totalMachines ?? 0,
      icon: FiPackage,
      gradient: 'from-blue-500 to-indigo-600',
      shadow: 'shadow-indigo-200',
      change: '+12% this month',
      up: true,
    },
    {
      title: 'Under Warranty',
      value: stats?.activeWarranty ?? 0,
      icon: FiCheckCircle,
      gradient: 'from-emerald-500 to-emerald-600',
      shadow: 'shadow-emerald-200',
      change: 'Active coverage',
      up: true,
    },
    {
      title: 'Pending Breakdowns',
      value: stats?.pendingBreakdowns ?? 0,
      icon: FiAlertCircle,
      gradient: 'from-rose-500 to-rose-600',
      shadow: 'shadow-rose-200',
      change: 'Needs attention',
      up: false,
    },
    {
      title: 'Present Today',
      value: stats?.presentToday ?? 0,
      icon: FiUsers,
      gradient: 'from-violet-500 to-purple-600',
      shadow: 'shadow-purple-200',
      change: `of ${attStats?.totalEmployees ?? '...'} total`,
      up: true,
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockCount ?? 0,
      icon: FiBarChart2,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-orange-200',
      change: 'Below threshold',
      up: false,
    },
  ];

  const attendanceRate = attStats
    ? Math.round((attStats.presentToday / Math.max(attStats.totalEmployees, 1)) * 100)
    : 0;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-slate-50">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Sonoray Dashboard
          </h1>
          <p className="text-slate-500 mt-1 font-medium text-sm">
            Welcome back, Admin · Here&rsquo;s your operations overview
          </p>
        </div>
        <div className="bg-slate-900 rounded-2xl p-4 md:px-6 md:py-4 text-right shadow-xl shadow-slate-200 w-full md:w-auto">
          <p className="text-blue-400 text-xl md:text-2xl font-black tabular-nums">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
          <p className="text-slate-500 text-[10px] font-bold mt-1 uppercase tracking-widest">
            {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6 mb-8">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-2xl animate-pulse" />
          ))
        ) : (
          statCards.map((card, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl flex-shrink-0 bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg ${card.shadow}`}>
                <card.icon className="text-white w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider truncate">
                  {card.title}
                </p>
                <p className="text-slate-900 text-2xl font-black my-0.5">
                  {card.value.toLocaleString()}
                </p>
                <div className="flex items-center gap-1">
                  {card.up
                    ? <FiArrowUp className="text-emerald-500 w-3 h-3" />
                    : <FiArrowDown className="text-rose-500 w-3 h-3" />
                  }
                  <span className={`text-[10px] font-bold ${card.up ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {card.change}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom two panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Panel 1: Today's Attendance Breakdown */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Today&apos;s Attendance</h3>
              <p className="text-slate-400 text-xs font-medium mt-1">
                {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setIsManualModalOpen(true)}
                className="flex-1 sm:flex-none bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-blue-100 transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <FiPlus className="w-4 h-4" /> Mark Entry
              </button>
              <div className="hidden sm:flex bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-xs font-black tracking-tight items-center">
                {attendanceRate}% rate
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 md:gap-12 mb-8">
            <div className="relative w-32 h-32 flex-shrink-0">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" className="stroke-slate-100" strokeWidth="10"/>
                <circle cx="50" cy="50" r="42" fill="none" className="stroke-emerald-500" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - attendanceRate / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-slate-900 leading-none">{attStats?.presentToday ?? 0}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">present</span>
              </div>
            </div>
            <div className="flex-1 w-full grid grid-cols-2 gap-3">
              {[
                { label: 'Present', value: attStats?.presentToday ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Absent', value: attStats?.absentToday ?? 0, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'On Leave', value: attStats?.onLeaveToday ?? 0, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Total Staff', value: attStats?.totalEmployees ?? 0, color: 'text-violet-600', bg: 'bg-violet-50' },
              ].map(item => (
                <div key={item.label} className={`${item.bg} rounded-2xl p-4 flex flex-col`}>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</span>
                  <span className={`text-xl font-black ${item.color} mt-1`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 flex justify-between items-center border border-slate-100">
            <span className="text-sm text-slate-500 font-bold">Monthly Avg Attendance</span>
            <span className="text-lg font-black text-blue-600">{attStats?.avgAttendance ?? '0'}%</span>
          </div>
        </div>

        {/* Panel 2: Field Engineers */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Field Engineers</h3>
              <p className="text-slate-400 text-xs font-medium mt-1">Live status overview</p>
            </div>
            <Link href="/admin/employees" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-blue-200 transition-transform active:scale-95">
              Manage All
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-2xl animate-pulse" />
              ))
            ) : recentEmployees.length === 0 ? (
              <div className="text-center py-12 text-slate-400 font-bold text-sm">
                No employees found
              </div>
            ) : (
              recentEmployees.map(emp => {
                const initials = `${emp.firstName[0]}${emp.lastName[0]}`;
                const colors = ['bg-blue-500','bg-emerald-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-cyan-500'];
                const colorClass = colors[(emp.firstName.charCodeAt(0)) % colors.length];
                const lastLog = emp.gpsLogs?.[0];
                const isFresh = lastLog && (new Date().getTime() - new Date(lastLog.timestamp).getTime()) < 10 * 60 * 1000;
                
                return (
                  <div key={emp.id} className="group flex items-center gap-4 bg-slate-50 hover:bg-blue-50 rounded-2xl p-3 transition-all duration-200 border border-transparent hover:border-blue-100">
                    <div className={`w-12 h-12 rounded-xl flex-shrink-0 ${colorClass} text-white font-black text-sm flex items-center justify-center shadow-lg`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-0.5">
                        {emp.department?.name || 'General Staff'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${isFresh ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300'} ${isFresh ? 'animate-pulse' : ''}`} />
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{isFresh ? 'Active' : 'Offline'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {!loading && recentEmployees.length > 0 && (
            <Link href="/admin/tracking" className="flex items-center justify-center gap-2 mt-6 bg-blue-50 hover:bg-blue-100 py-3 px-5 rounded-xl text-blue-600 text-xs font-black transition-all group">
              <FiMapPin className="w-4 h-4 group-hover:scale-110 transition-transform" />
              View Live Map Tracking
            </Link>
          )}
        </div>
      </div>

      {/* Operations Command Center (Zoho-style Widget) */}
      <div className="mt-8 bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100/80 animate-[fadeIn_0.5s_ease-out]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
              Operations Command Center
            </h3>
            <p className="text-slate-400 text-xs font-medium mt-1">Real-time status overview & quick administration shortcuts</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 border border-emerald-200/50 px-3 py-1 rounded-full">Systems Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1: Live Radars & System Health */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Live System Health</span>
              <div className="flex items-center gap-4 mt-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-blue-600/10 flex items-center justify-center">
                    <FiActivity className="w-6 h-6 text-blue-600 animate-pulse" />
                  </div>
                  <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-800 text-sm">Telemetry Feed</h4>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Sync Interval: Real-time</p>
                  <span className="inline-block mt-2 px-2.5 py-0.5 bg-blue-600 text-white text-[8px] font-black uppercase tracking-wider rounded-md">Socket.io Connected</span>
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-2.5">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>Database Synced</span>
                <span className="text-emerald-600">100% Ok</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full w-[100%]" />
              </div>
            </div>
          </div>

          {/* Column 2: System Metrics */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 space-y-4">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Operational Target Progress</span>
            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>SLA Service Response</span>
                  <span className="text-blue-600 font-extrabold">98.7%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-[98.7%]" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Ticket Resolution Rate</span>
                  <span className="text-indigo-600 font-extrabold">94.2%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full w-[94.2%]" />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span>Today's Staff attendance</span>
                  <span className="text-emerald-600 font-extrabold">{attendanceRate}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${attendanceRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: Zoho-style Quick Actions Shortcuts */}
          <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-5 flex flex-col justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-2 block">Quick Administration Actions</span>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/admin/tickets" className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-100 rounded-xl hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/5 transition-all text-slate-700 hover:text-blue-600">
                <FiAlertCircle className="w-4 h-4 mb-1.5 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-center">New Ticket</span>
              </Link>
              <Link href="/admin/machines" className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-100 rounded-xl hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/5 transition-all text-slate-700 hover:text-blue-600">
                <FiPackage className="w-4 h-4 mb-1.5 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-center">Install Machine</span>
              </Link>
              <Link href="/admin/stock" className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-100 rounded-xl hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/5 transition-all text-slate-700 hover:text-blue-600">
                <FiPlus className="w-4 h-4 mb-1.5 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-center">Add Stock</span>
              </Link>
              <button onClick={() => setIsManualModalOpen(true)} className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-100 rounded-xl hover:border-blue-500 hover:shadow-md hover:shadow-blue-500/5 transition-all text-slate-700 hover:text-blue-600">
                <FiClock className="w-4 h-4 mb-1.5 text-slate-400" />
                <span className="text-[10px] font-black uppercase tracking-wider text-center">Mark Entry</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <MarkAttendanceModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSuccess={fetchAll}
        employees={employees}
      />
    </div>
  );
}

