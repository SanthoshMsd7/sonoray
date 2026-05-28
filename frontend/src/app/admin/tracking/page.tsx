'use client';

import { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { io, Socket } from 'socket.io-client';
import type { LocationData } from '../../../components/MapComponent';

// Dynamically import MapComponent to disable SSR
const MapComponent = dynamic(() => import('../../../components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-gray-100">Loading Map...</div>
});

// Helper to perform client-side reverse geocoding
const fetchClientAddress = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      return json.display_name || null;
    }
  } catch (e) {
    console.error('Client-side reverse geocode error:', e);
  }
  return null;
};

export default function AdminTrackingPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fetchActiveLocations = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tracking/active`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const formatted = data.map((emp: any) => ({
            id: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
            profileImage: emp.profileImage || null,
            lat: emp.latitude,
            lng: emp.longitude,
            isOnDuty: emp.isOnDuty,
            isStale: emp.isStale,
            address: emp.address || 'Locating...',
            batteryLevel: emp.batteryLevel,
            timestamp: emp.timestamp
          }));
          setLocations(formatted);

          // Silent background resolve for any coordinate/unresolved markers
          formatted.forEach((loc: any) => {
            if (loc.lat && loc.lng && (!loc.address || loc.address === 'Locating...' || loc.address.startsWith('Coordinates:'))) {
              fetchClientAddress(loc.lat, loc.lng).then(addr => {
                if (addr) {
                  setLocations(prev => prev.map(p => p.id === loc.id ? { ...p, address: addr } : p));
                }
              });
            }
          });
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchActiveLocations();

    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || '');
    socketRef.current.on('employeeLocationUpdate', (data: any) => {
      setLocations((prev) => {
        const index = prev.findIndex(loc => loc.id === data.employeeId);
        const updatedLoc: LocationData = {
          id: data.employeeId,
          name: data.name || (index >= 0 ? prev[index].name : 'Employee'),
          profileImage: data.profileImage !== undefined ? data.profileImage : (index >= 0 ? prev[index].profileImage : null),
          lat: data.latitude !== undefined && data.latitude !== null ? data.latitude : (index >= 0 ? prev[index].lat : null),
          lng: data.longitude !== undefined && data.longitude !== null ? data.longitude : (index >= 0 ? prev[index].lng : null),
          isOnDuty: data.isOnDuty !== undefined ? data.isOnDuty : (index >= 0 ? prev[index].isOnDuty : false),
          isStale: data.isStale !== undefined ? data.isStale : (index >= 0 ? prev[index].isStale : false),
          address: data.address || (index >= 0 ? prev[index].address : 'Locating...'),
          batteryLevel: data.batteryLevel !== undefined && data.batteryLevel !== null ? data.batteryLevel : (index >= 0 ? prev[index].batteryLevel : null),
          timestamp: data.timestamp || new Date().toISOString()
        };

        // Try client-side geocode if coordinates/Locating
        if (updatedLoc.lat && updatedLoc.lng && (!updatedLoc.address || updatedLoc.address === 'Locating...' || updatedLoc.address.startsWith('Coordinates:'))) {
          fetchClientAddress(updatedLoc.lat, updatedLoc.lng).then(addr => {
            if (addr) {
              setLocations(prev => prev.map(p => p.id === updatedLoc.id ? { ...p, address: addr } : p));
            }
          });
        }

        if (index >= 0) {
          const newArr = [...prev];
          newArr[index] = updatedLoc;
          return newArr;
        } else {
          return [...prev, updatedLoc];
        }
      });
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!selectedId) return;

    const requestRefresh = () => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('requestLocationRefresh', { employeeId: selectedId });
      }
    };

    requestRefresh();
    const interval = setInterval(requestRefresh, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedId]);

  const trackingCount = locations.filter(l => l.lat !== null && l.isOnDuty && !l.isStale).length;
  const inactiveCount = locations.filter(l => l.isOnDuty && l.isStale).length;
  const offDutyCount = locations.filter(l => !l.isOnDuty).length;

  const handleSelectEmployee = (id: string, hasLocation: boolean) => {
    if (!hasLocation) return;
    setSelectedId(prev => (prev === id ? null : id));
  };

  return (
    /* Full-height container — fills the admin layout shell */
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 6rem)', gap: '1rem' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 0.5rem', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.025em', margin: 0 }}>
            Real-Time Field Map
          </h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0' }}>
            Live monitoring of service engineers across the region.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <div style={{ background: '#ecfdf5', color: '#065f46', padding: '0.375rem 1rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #d1fae5', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />
            {trackingCount} Live Tracking
          </div>
          {inactiveCount > 0 && (
            <div style={{ background: '#fff1f2', color: '#be123c', padding: '0.375rem 1rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #fecdd3', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 8, height: 8, background: '#f43f5e', borderRadius: '50%' }} />
              {inactiveCount} Location Off
            </div>
          )}
          {offDutyCount > 0 && (
            <div style={{ background: '#f8fafc', color: '#64748b', padding: '0.375rem 1rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: 10, height: 10, background: '#94a3b8', borderRadius: '50%' }} />
              {offDutyCount} Off Duty
            </div>
          )}
        </div>
      </div>

      {/* ── Split Layout: sidebar + map ── */}
      {/*
        Key rule: the outer div is flex + min-h-0 so children can shrink below their content size.
        The sidebar is a FIXED width (w-80) and scrolls internally — it NEVER affects the map size.
        The map div is flex-1 so it always fills the remaining space.
      */}
      <div style={{ display: 'flex', flex: 1, gap: '1rem', minHeight: 0, overflow: 'hidden' }}>

        {/* ── Employee Sidebar (fixed 320 px, scrolls internally) ── */}
        <div style={{
          width: '320px',
          flexShrink: 0,
          background: 'white',
          borderRadius: '1.5rem',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Sidebar header */}
          <div style={{ padding: '1rem', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
            <h3 style={{ fontWeight: 700, color: '#334155', fontSize: '0.875rem', margin: 0 }}>
              Field Engineers
              {locations.length > 0 && (
                <span style={{ marginLeft: '0.5rem', fontWeight: 400, color: '#94a3b8', fontSize: '0.75rem' }}>
                  ({locations.length})
                </span>
              )}
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: '#94a3b8' }}>
              Tap a name to locate on map
            </p>
          </div>

          {/* Scrollable employee list */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {locations.length === 0 ? (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem', fontStyle: 'italic' }}>
                No engineers active currently
              </div>
            ) : (
              <div>
                {locations.map((loc) => {
                  const isSelected = selectedId === loc.id;
                  const hasLocation = loc.lat !== null && loc.lng !== null;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectEmployee(loc.id, hasLocation)}
                      style={{
                        padding: '0.875rem 1rem',
                        cursor: hasLocation ? 'pointer' : 'default',
                        borderBottom: '1px solid #f8fafc',
                        borderLeft: isSelected ? '4px solid #2563eb' : '4px solid transparent',
                        background: isSelected ? '#eff6ff' : 'white',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={e => {
                        if (!isSelected && hasLocation) (e.currentTarget as HTMLDivElement).style.background = '#f0f9ff';
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = 'white';
                      }}
                    >
                      {/* Row 1: name + time */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {/* Profile avatar / initials */}
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                            background: loc.profileImage ? 'transparent' : '#e0e7ff',
                            border: `2px solid ${loc.isOnDuty === false ? '#cbd5e1' : loc.isStale ? '#fda4af' : '#6ee7b7'}`,
                            overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {loc.profileImage ? (
                              <img src={loc.profileImage} alt={loc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4f46e5' }}>
                                {loc.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <p style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.8125rem', margin: 0 }}>{loc.name}</p>
                        </div>
                        <span style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 500, flexShrink: 0, marginLeft: '0.5rem' }}>
                          {loc.timestamp
                            ? new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'No Data'}
                        </span>
                      </div>

                      {/* Row 2: battery + duty badge */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.6875rem', color: '#64748b' }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: loc.batteryLevel && loc.batteryLevel > 20 ? '#10b981' : '#f43f5e'
                          }} />
                          {loc.batteryLevel || 0}% Battery
                        </div>
                        {loc.isOnDuty ? (
                          <span style={{ padding: '0.1rem 0.5rem', background: '#dbeafe', color: '#1d4ed8', borderRadius: '0.25rem', fontSize: '0.5625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            On Duty
                          </span>
                        ) : (
                          <span style={{ padding: '0.1rem 0.5rem', background: '#f1f5f9', color: '#64748b', borderRadius: '0.25rem', fontSize: '0.5625rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Off Duty
                          </span>
                        )}
                      </div>

                      {/* Row 3: address / status */}
                      {loc.isOnDuty ? (
                        loc.isStale ? (
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.25rem' }}>
                              <div style={{ width: 6, height: 6, background: '#f43f5e', borderRadius: '50%' }} />
                              <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#e11d48', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Location Stale
                              </span>
                            </div>
                            <p style={{ fontSize: '0.6875rem', color: '#94a3b8', background: '#f8fafc', padding: '0.375rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9', margin: 0, fontStyle: 'italic' }}>
                              Last seen: {loc.address || 'Unknown'}
                            </p>
                          </div>
                        ) : !loc.lat ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8', fontStyle: 'italic', fontSize: '0.6875rem', padding: '0.375rem 0.5rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                            <div style={{ width: 6, height: 6, background: '#cbd5e1', borderRadius: '50%' }} />
                            🛰️ Syncing location...
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.6875rem', color: '#64748b', background: '#f8fafc', padding: '0.375rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9', margin: 0,
                            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            📍 {loc.address || 'Locating...'}
                          </p>
                        )
                      ) : (
                        <p style={{ fontSize: '0.6875rem', color: '#94a3b8', background: '#f8fafc', padding: '0.375rem 0.5rem', borderRadius: '0.5rem', border: '1px solid #f1f5f9', margin: 0, fontStyle: 'italic' }}>
                          Shift complete. Location tracking deactivated.
                        </p>
                      )}

                      {/* Locate hint when selected */}
                      {isSelected && (
                        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#2563eb', fontSize: '0.625rem', fontWeight: 700 }}>
                          <span>🎯</span> Map focused on this location
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Map (always flex-1, never shrinks) ── */}
        <div style={{
          flex: 1,
          background: 'white',
          borderRadius: '1.5rem',
          border: '1px solid #f1f5f9',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
          overflow: 'hidden',
          position: 'relative',
          minWidth: 0,
        }}>
          <MapComponent locations={locations} focusedId={selectedId} />
        </div>
      </div>
    </div>
  );
}
