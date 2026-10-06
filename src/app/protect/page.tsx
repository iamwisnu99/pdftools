import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import ProtectWorkspace from '@/components/tools/protect/ProtectWorkspace';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Kunci & Lindungi Dokumen PDF',
  description:
    'Enkripsi dokumen PDF Anda dengan kata sandi kuat AES-256 secara privat dan aman langsung di browser.',
};

export default function ProtectPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <ProtectWorkspace />
      </main>
      <Footer />
    </div>
  );
}
