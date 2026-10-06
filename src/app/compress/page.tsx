import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import CompressWorkspace from '@/components/tools/compress/CompressWorkspace';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Kompres PDF Online',
  description:
    'Perkecil ukuran berkas dokumen PDF secara signifikan tanpa merusak ketajaman teks atau kualitas visual gambar langsung di browser.',
};

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
