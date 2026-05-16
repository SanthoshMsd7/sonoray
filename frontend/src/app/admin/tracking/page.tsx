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
            lat: emp.latitude,
            lng: emp.longitude,
            isOnDuty: emp.isOnDuty,
            address: emp.address || 'Locating...',
            batteryLevel: emp.batteryLevel,
            timestamp: emp.timestamp
          }));
          setLocations(formatted);
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
          lat: data.latitude,
          lng: data.longitude,
          address: data.address || 'Locating...',
          batteryLevel: data.batteryLevel,
          timestamp: new Date().toISOString()
        };
        
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

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] space-y-4">
      <div className="flex justify-between items-end px-2">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Real-Time Field Map</h1>
          <p className="text-slate-500">Live monitoring of service engineers across the region.</p>
        </div>
        <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold border border-emerald-100 flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
          {locations.length} Systems Active
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Sidebar Table */}
        <div className="w-full lg:w-96 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-bold text-slate-700 text-sm">Engineers On Duty</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {locations.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-sm italic">No engineers active currently</div>
            ) : (
              <div className="divide-y divide-slate-50">
                {locations.map((loc) => (
                  <div 
                    key={loc.id} 
                    onClick={() => loc.lat && setSelectedId(loc.id)}
                    className={`p-4 cursor-pointer transition-all hover:bg-blue-50/50 ${selectedId === loc.id ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-bold text-slate-800 text-sm">{loc.name}</p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {loc.timestamp ? new Date(loc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'No Data'}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <div className={`w-1.5 h-1.5 rounded-full ${loc.batteryLevel && loc.batteryLevel > 20 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        {loc.batteryLevel || 0}% Battery
                      </div>
                      {loc.isOnDuty && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-extrabold uppercase">On Duty</span>
                      )}
                    </div>

                    {!loc.lat && loc.isOnDuty ? (
                      <p className="text-[11px] text-rose-500 font-bold bg-rose-50 p-2 rounded-lg border border-rose-100 flex items-center gap-1">
                        ⚠️ Location Turned Off
                      </p>
                    ) : (
                      <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {loc.address || 'Locating...'}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden relative">
          <MapComponent locations={locations} />
        </div>
      </div>
    </div>
  );
}
