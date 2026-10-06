import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import PdfToImageWorkspace from '@/components/tools/pdf-to-image/PdfToImageWorkspace';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Konversi PDF ke Gambar Online',
  description:
    'Ekspor lembar halaman berkas PDF ke format gambar PNG, JPG, atau WebP resolusi tajam HD langsung di browser.',
};

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
