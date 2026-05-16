'use client';

import { useEffect, useState } from 'react';
import { 
  FiPackage, FiAlertCircle, FiClock, FiUsers, 
  FiTrendingUp, FiActivity, FiMapPin, FiCheckCircle,
  FiBarChart2, FiArrowUp, FiArrowDown, FiCalendar
} from 'react-icons/fi';

interface DashboardStats {
  totalMachines: number;
  activeWarranty: number;
  pendingBreakdowns: number;
  presentToday: number;
  lowStockCount: number;
  totalRevenue: number;
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
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

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
      gradient: 'linear-gradient(135deg, #3b82f6, #6366f1)',
      shadow: 'rgba(99,102,241,0.3)',
      change: '+12% this month',
      up: true,
    },
    {
      title: 'Under Warranty',
      value: stats?.activeWarranty ?? 0,
      icon: FiCheckCircle,
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
      shadow: 'rgba(16,185,129,0.3)',
      change: 'Active coverage',
      up: true,
    },
    {
      title: 'Pending Breakdowns',
      value: stats?.pendingBreakdowns ?? 0,
      icon: FiAlertCircle,
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      shadow: 'rgba(239,68,68,0.3)',
      change: 'Needs attention',
      up: false,
    },
    {
      title: 'Present Today',
      value: stats?.presentToday ?? 0,
      icon: FiUsers,
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      shadow: 'rgba(139,92,246,0.3)',
      change: `of ${attStats?.totalEmployees ?? '...'} total`,
      up: true,
    },
    {
      title: 'Low Stock Items',
      value: stats?.lowStockCount ?? 0,
      icon: FiBarChart2,
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      shadow: 'rgba(245,158,11,0.3)',
      change: 'Below threshold',
      up: false,
    },
    {
      title: 'Total Revenue',
      value: stats?.totalRevenue ? `₹${(stats.totalRevenue / 100000).toFixed(1)}L` : '₹0',
      icon: FiTrendingUp,
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
      shadow: 'rgba(6,182,212,0.3)',
      change: 'Lifetime installs',
      up: true,
      isText: true,
    },
  ];

  const attendanceRate = attStats
    ? Math.round((attStats.presentToday / Math.max(attStats.totalEmployees, 1)) * 100)
    : 0;

  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.5px' }}>
            UltaServe Dashboard
          </h1>
          <p style={{ color: '#64748b', marginTop: '6px', fontWeight: 500, fontSize: '14px' }}>
            Welcome back, Admin · Here&rsquo;s your operations overview
          </p>
        </div>
        <div style={{
          background: 'linear-gradient(135deg, #1e3a5f, #0f172a)',
          borderRadius: '16px', padding: '14px 20px', textAlign: 'right',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        }}>
          <p style={{ color: '#60a5fa', fontSize: '20px', fontWeight: 800, margin: 0 }}>
            {time.toLocaleTimeString()}
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', fontWeight: 700, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{ height: '140px', background: '#e2e8f0', borderRadius: '20px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
          {statCards.map((card, idx) => (
            <div key={idx} style={{
              background: '#fff', borderRadius: '20px', padding: '24px',
              boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
              display: 'flex', alignItems: 'center', gap: '18px',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 12px 40px ${card.shadow}`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 20px rgba(0,0,0,0.06)'; }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px', flexShrink: 0,
                background: card.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 8px 24px ${card.shadow}`,
              }}>
                <card.icon style={{ color: 'white', width: '24px', height: '24px' }} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {card.title}
                </p>
                <p style={{ color: '#0f172a', fontSize: '28px', fontWeight: 800, margin: '4px 0', lineHeight: 1 }}>
                  {card.isText ? card.value : card.value.toLocaleString()}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {card.up
                    ? <FiArrowUp style={{ color: '#10b981', width: '12px', height: '12px' }} />
                    : <FiArrowDown style={{ color: '#ef4444', width: '12px', height: '12px' }} />
                  }
                  <span style={{ fontSize: '11px', color: card.up ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                    {card.change}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bottom two panels — REAL DATA */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Panel 1: Today's Attendance Breakdown */}
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '28px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '16px' }}>Today's Attendance</h3>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0', fontWeight: 500 }}>
                {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div style={{
              background: '#f0fdf4', borderRadius: '12px', padding: '8px 14px',
              color: '#16a34a', fontWeight: 800, fontSize: '13px',
            }}>
              {attendanceRate}% rate
            </div>
          </div>

          {/* Big radial indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '28px', marginBottom: '24px' }}>
            <div style={{ position: 'relative', width: '100px', height: '100px', flexShrink: 0 }}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="#f1f5f9" strokeWidth="10"/>
                <circle cx="50" cy="50" r="42" fill="none" stroke="#10b981" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - attendanceRate / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '22px', color: '#0f172a', lineHeight: 1 }}>{attStats?.presentToday ?? 0}</span>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>present</span>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { label: 'Present', value: attStats?.presentToday ?? 0, color: '#10b981', bg: '#f0fdf4' },
                { label: 'Absent', value: attStats?.absentToday ?? 0, color: '#ef4444', bg: '#fef2f2' },
                { label: 'On Leave', value: attStats?.onLeaveToday ?? 0, color: '#3b82f6', bg: '#eff6ff' },
                { label: 'Total Staff', value: attStats?.totalEmployees ?? 0, color: '#8b5cf6', bg: '#f5f3ff' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: item.bg, borderRadius: '10px', padding: '8px 14px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#374151' }}>{item.label}</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Monthly Avg Attendance</span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#3b82f6' }}>{attStats?.avgAttendance ?? '0'}%</span>
          </div>
        </div>

        {/* Panel 2: Active Field Engineers */}
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '28px',
          boxShadow: '0 2px 20px rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontWeight: 800, color: '#0f172a', margin: 0, fontSize: '16px' }}>Field Engineers</h3>
              <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0', fontWeight: 500 }}>Team directory overview</p>
            </div>
            <a href="/admin/employees" style={{
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#fff',
              borderRadius: '10px', padding: '8px 14px', fontSize: '12px', fontWeight: 700,
              textDecoration: 'none', display: 'inline-block',
            }}>
              Manage All
            </a>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <div key={i} style={{ height: '52px', background: '#f1f5f9', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))
            ) : recentEmployees.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontWeight: 700, fontSize: '13px' }}>
                No employees found
              </div>
            ) : (
              recentEmployees.map(emp => {
                const initials = `${emp.firstName[0]}${emp.lastName[0]}`;
                const colors = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#06b6d4'];
                const color = colors[(emp.firstName.charCodeAt(0)) % colors.length];
                return (
                  <div key={emp.id} style={{
                    display: 'flex', alignItems: 'center', gap: '14px',
                    background: '#f8fafc', borderRadius: '14px', padding: '12px 14px',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = '#f0f4ff'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = '#f8fafc'}
                  >
                    <div style={{
                      width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                      background: color + '20', color, fontWeight: 800, fontSize: '14px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `1.5px solid ${color}30`,
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '14px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {emp.firstName} {emp.lastName}
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600, margin: '2px 0 0' }}>
                        {emp.department?.name || 'General Staff'}
                      </p>
                    </div>
                    <div style={{
                      width: '8px', height: '8px', borderRadius: '50%',
                      background: emp.gpsLogs && emp.gpsLogs.length > 0 ? '#10b981' : '#e2e8f0',
                      boxShadow: emp.gpsLogs && emp.gpsLogs.length > 0 ? '0 0 0 3px rgba(16,185,129,0.2)' : 'none',
                      flexShrink: 0,
                    }} />
                  </div>
                );
              })
            )}
          </div>

          {!loading && recentEmployees.length > 0 && (
            <a href="/admin/tracking" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              marginTop: '16px', background: '#f0f9ff', borderRadius: '12px', padding: '12px',
              color: '#3b82f6', fontSize: '13px', fontWeight: 700, textDecoration: 'none',
              transition: 'background 0.15s',
            }}>
              <FiMapPin style={{ width: '14px', height: '14px' }} />
              View Live Map Tracking
            </a>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>
    </div>
  );
}
