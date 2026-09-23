'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import PdfToImageWorkspace from '@/components/tools/pdf-to-image/PdfToImageWorkspace';
import Footer from '@/components/Footer';

export default function PdfToImagePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <PdfToImageWorkspace />
      </main>
      <Footer />
    </div>
  );
}
