'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const router = useRouter();
  const [splashDone, setSplashDone] = useState(false);

  const handleSplashFinish = () => {
    setSplashDone(true);

    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    const user = userJson ? JSON.parse(userJson) : null;

    if (token && user) {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/employee/attendance');
      }
    } else {
      router.push('/login');
    }
  };

  return (
    <>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      <div className="h-screen w-screen flex items-center justify-center">
        <p className="text-xl" style={{ color: 'transparent' }}>Loading...</p>
      </div>
    </>
  );
}
