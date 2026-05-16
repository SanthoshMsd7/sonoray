'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

export default function EmployeeTrackingPage() {
  const [tracking, setTracking] = useState(false);
  const [status, setStatus] = useState('Idle');
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(0);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [lastPunch, setLastPunch] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const wakeLockRef = useRef<any>(null);
  const router = useRouter();

  // Sync function to upload queued locations
  const syncOfflineData = async () => {
    const queue = JSON.parse(localStorage.getItem('offlineLocationQueue') || '[]');
    if (queue.length === 0) return;

    console.log(`Attempting to sync ${queue.length} offline locations...`);
    const token = localStorage.getItem('token');
    const remainingQueue = [];

    for (const payload of queue) {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tracking/update`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Sync failed');
      } catch (err) {
        remainingQueue.push(payload);
      }
    }

    localStorage.setItem('offlineLocationQueue', JSON.stringify(remainingQueue));
    setPendingSync(remainingQueue.length);
  };

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('token');
    const employeeId = localStorage.getItem('employeeId');
    if (!token || !employeeId) {
      router.push('/login');
      return;
    }

    // Initialize socket
    socketRef.current = io(process.env.NEXT_PUBLIC_API_URL || '');

    // Handle online event
    const handleOnline = () => {
      setStatus('Back Online - Syncing...');
      syncOfflineData();
    };

    window.addEventListener('online', handleOnline);
    
    // Periodically check queue
    const syncInterval = setInterval(syncOfflineData, 30000);

    // Initial check for pending sync
    const queue = JSON.parse(localStorage.getItem('offlineLocationQueue') || '[]');
    setPendingSync(queue.length);

    // Check today's attendance status
    const checkAttendance = async () => {
      const token = localStorage.getItem('token');
      const empId = localStorage.getItem('employeeId');
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/attendance?employeeId=${empId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const records = await res.json();
        const today = new Date().toISOString().split('T')[0];
        const todaysRecord = records.find((r: any) => r.date.startsWith(today));
        if (todaysRecord) {
          setIsPunchedIn(!todaysRecord.punchOutTime);
          setLastPunch(todaysRecord.punchInTime);
        }
      } catch (err) {
        console.error('Attendance check error', err);
      }
    };
    checkAttendance();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (wakeLockRef.current !== null) {
        wakeLockRef.current.release();
      }
      socketRef.current?.disconnect();
      window.removeEventListener('online', handleOnline);
      clearInterval(syncInterval);
    };
  }, [router]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setStatus('Geolocation is not supported by your browser');
      return;
    }

    setTracking(true);
    setStatus('Locating...');

    // Request Wake Lock to prevent sleep
    if ('wakeLock' in navigator) {
      try {
        (navigator as any).wakeLock.request('screen').then((lock: any) => {
          wakeLockRef.current = lock;
          console.log('Wake Lock Active');
        });
      } catch (err) {
        console.error('Wake Lock error', err);
      }
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        setStatus('Tracking Active');

        const employeeId = localStorage.getItem('employeeId');
        const token = localStorage.getItem('token');
        
        let batteryLevel = 100;
        try {
          if ('getBattery' in navigator) {
            const battery: any = await (navigator as any).getBattery();
            batteryLevel = Math.round(battery.level * 100);
          }
        } catch (e) {
          // ignore
        }

        const payload = {
          employeeId,
          latitude,
          longitude,
          batteryLevel,
          timestamp: new Date().toISOString()
        };

        // Emit real-time update
        socketRef.current?.emit('updateLocation', payload);

        // Try to save to DB
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/tracking/update`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const data = await res.json();
            if (data.log && data.log.address) {
              setAddress(data.log.address);
            }
          } else {
            throw new Error('Server error');
          }
        } catch (err) {
          console.log('Offline: Queueing location update');
          const queue = JSON.parse(localStorage.getItem('offlineLocationQueue') || '[]');
          queue.push(payload);
          localStorage.setItem('offlineLocationQueue', JSON.stringify(queue));
          setPendingSync(queue.length);
          setStatus('Offline - Data Queued');
        }
      },
      (error) => {
        setStatus(`Error: ${error.message}`);
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (wakeLockRef.current !== null) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
    }
    setTracking(false);
    setStatus('Tracking Stopped');
  };

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handlePunchIn = async () => {
    if (!location) {
      alert('Please wait for location to lock before punching in');
      return;
    }
    const token = localStorage.getItem('token');
    const employeeId = localStorage.getItem('employeeId');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/attendance/punch-in`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          employeeId,
          latitude: location.lat,
          longitude: location.lng
        })
      });
      if (res.ok) {
        setIsPunchedIn(true);
        setLastPunch(new Date().toISOString());
        alert('Punched in successfully!');
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error('Punch in error', err);
    }
  };

  const handlePunchOut = async () => {
    const token = localStorage.getItem('token');
    const employeeId = localStorage.getItem('employeeId');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/attendance/punch-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ employeeId })
      });
      if (res.ok) {
        setIsPunchedIn(false);
        alert('Punched out successfully!');
      } else {
        const data = await res.json();
        alert(data.message);
      }
    } catch (err) {
      console.error('Punch out error', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6 flex flex-col items-center">
      <div className="bg-white rounded-lg shadow-md w-full max-w-md p-5 md:p-6 mt-4 md:mt-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Live Tracking</h1>
          <div className="space-x-4">
            <button onClick={() => router.push('/employee/chat')} className="text-sm text-blue-600 hover:text-blue-800">Chat</button>
            <button onClick={logout} className="text-sm text-red-600 hover:text-red-800">Logout</button>
          </div>
        </div>
        
        <div className="mb-8 text-center">
          <div className={`mx-auto flex items-center justify-center w-32 h-32 rounded-full border-4 ${tracking ? 'border-green-500 animate-pulse' : 'border-gray-300'}`}>
            <span className={`text-5xl ${tracking ? 'text-green-500' : 'text-gray-400'}`}>
              📍
            </span>
          </div>
          <p className="mt-4 text-lg font-medium text-gray-700">{status}</p>
          
          {pendingSync > 0 && (
            <div className="mt-2 bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded inline-block">
              {pendingSync} updates pending sync
            </div>
          )}

          {location && (
            <p className="text-sm text-gray-500 mt-2">
              Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
            </p>
          )}
          {address && (
            <p className="text-sm text-blue-600 mt-2 italic px-4">
              {address}
            </p>
          )}
        </div>

        <div className="flex flex-col space-y-4">
          {!isPunchedIn ? (
            <button 
              onClick={handlePunchIn}
              className="w-full bg-green-600 text-white font-bold py-3 px-4 rounded shadow hover:bg-green-700 transition"
            >
              Punch In for Attendance
            </button>
          ) : (
            <button 
              onClick={handlePunchOut}
              className="w-full bg-orange-600 text-white font-bold py-3 px-4 rounded shadow hover:bg-orange-700 transition"
            >
              Punch Out
            </button>
          )}

          {!tracking ? (
            <button 
              onClick={startTracking}
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded shadow hover:bg-blue-700 transition"
            >
              Start Sharing Location
            </button>
          ) : (
            <button 
              onClick={stopTracking}
              className="w-full bg-red-600 text-white font-bold py-3 px-4 rounded shadow hover:bg-red-700 transition"
            >
              Stop Sharing
            </button>
          )}
        </div>
      </div>
      
      {lastPunch && (
        <div className="mt-4 text-sm text-gray-600">
          Last Punch In: {new Date(lastPunch).toLocaleString()}
        </div>
      )}
      
      <div className="mt-6 text-center text-gray-500 text-sm max-w-xs">
        <p>This app tracks your location even when you are offline. All data will be synced when your connection returns.</p>
      </div>
    </div>
  );
}
