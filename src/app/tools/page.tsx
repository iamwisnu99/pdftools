'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import ToolsCatalog from '@/components/tools/ToolsCatalog';
import Footer from '@/components/Footer';

export default function ToolsPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <ToolsCatalog />
      </main>
      <Footer />
    </div>
  );
}
