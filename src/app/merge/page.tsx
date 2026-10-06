import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import Workspace from '@/components/merger/Workspace';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Gabungkan PDF Online',
  description:
    'Satukan dan susun beberapa berkas PDF menjadi satu dokumen dengan urutan kustom secara cepat, presisi, dan 100% aman langsung di browser.',
};

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
