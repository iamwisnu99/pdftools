import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import ToolsCatalog from '@/components/tools/ToolsCatalog';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Katalog Peralatan PDF',
  description:
    'Jelajahi seluruh peralatan dokumen PDF: Gabung PDF, Kompres PDF, PDF ke Gambar, dan alat produktivitas lainnya 100% aman langsung di browser.',
};

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
