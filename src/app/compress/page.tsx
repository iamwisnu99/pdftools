'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import CompressWorkspace from '@/components/tools/compress/CompressWorkspace';
import Footer from '@/components/Footer';

export default function CompressPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <CompressWorkspace />
      </main>
      <Footer />
    </div>
  );
}
