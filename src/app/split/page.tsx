'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import SplitWorkspace from '@/components/tools/split/SplitWorkspace';
import Footer from '@/components/Footer';

export default function SplitPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <SplitWorkspace />
      </main>
      <Footer />
    </div>
  );
}
