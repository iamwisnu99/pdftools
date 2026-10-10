import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import EditPdfWorkspace from '@/components/tools/edit-pdf/EditPdfWorkspace';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Edit PDF Online - Ganti Teks Presisi Tanpa Merusak Layout & Font',
  description:
    'Edit dan ganti teks di dalam dokumen PDF secara langsung di browser. Mempertahankan jenis font, ukuran pt, dan tata letak original 100% tanpa upload server.',
};

export default function EditPdfPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <EditPdfWorkspace />
      </main>
      <Footer />
    </div>
  );
}
