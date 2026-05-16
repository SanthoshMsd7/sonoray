'use client';

import { FiUsers, FiClock, FiCalendar, FiActivity } from 'react-icons/fi';

interface AnalyticsProps {
  stats: {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    onLeaveToday: number;
    avgAttendance: string;
  };
}

export default function AttendanceAnalytics({ stats }: AnalyticsProps) {
  const cards = [
    { title: 'Total Employees', value: stats.totalEmployees, icon: FiUsers, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Present Today', value: stats.presentToday, icon: FiClock, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'On Leave', value: stats.onLeaveToday, icon: FiCalendar, color: 'text-amber-600', bg: 'bg-amber-50' },
    { title: 'Avg. Attendance', value: `${stats.avgAttendance}%`, icon: FiActivity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-4 hover:shadow-md transition-all">
          <div className={`${card.bg} p-4 rounded-2xl`}>
            <card.icon className={`w-6 h-6 ${card.color}`} />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{card.title}</p>
            <p className="text-2xl font-black text-slate-900">{card.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
