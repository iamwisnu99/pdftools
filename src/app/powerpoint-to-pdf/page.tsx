import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import PowerPointToPdfWorkspace from '@/components/tools/powerpoint-to-pdf/PowerPointToPdfWorkspace';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Konversi PowerPoint ke PDF Online - Format Presentasi & Handout',
  description:
    'Ubah berkas presentasi PowerPoint (.pptx) menjadi dokumen PDF berkualitas tinggi secara instan di browser. Dukungan pilihan slide, format handout catatan, dan 100% tanpa upload server.',
};

export default function PowerPointToPdfPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <PowerPointToPdfWorkspace />
      </main>
      <Footer />
    </div>
  );
}
