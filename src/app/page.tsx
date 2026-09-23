'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import LandingView from '@/components/landing/LandingView';
import Footer from '@/components/Footer';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Menjaga kompatibilitas jika ada pengguna mengakses tautan lama #workspace
    if (window.location.hash === '#workspace') {
      router.replace('/merge');
    }
  }, [router]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <LandingView />
      </main>
      <Footer />
    </div>
  );
}
