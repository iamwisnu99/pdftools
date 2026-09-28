'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import ImageToPdfWorkspace from '@/components/tools/image-to-pdf/ImageToPdfWorkspace';
import Footer from '@/components/Footer';

export default function ImageToPdfPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <ImageToPdfWorkspace />
      </main>
      <Footer />
    </div>
  );
}
