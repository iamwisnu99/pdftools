'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import Workspace from '@/components/merger/Workspace';
import Footer from '@/components/Footer';

export default function MergePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Workspace />
      </main>
      <Footer />
    </div>
  );
}
