'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import ProtectWorkspace from '@/components/tools/protect/ProtectWorkspace';
import Footer from '@/components/Footer';

export default function ProtectPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <ProtectWorkspace />
      </main>
      <Footer />
    </div>
  );
}
