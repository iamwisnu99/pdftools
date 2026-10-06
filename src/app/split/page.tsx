import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import SplitWorkspace from '@/components/tools/split/SplitWorkspace';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Pisahkan Halaman PDF Online',
  description:
    'Ekstrak dan pisahkan halaman dokumen PDF menjadi berkas terpisah atau rentang pilihan Anda langsung di browser.',
};

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
