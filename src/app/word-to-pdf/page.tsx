import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import WordToPdfWorkspace from '@/components/tools/word-to-pdf/WordToPdfWorkspace';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Konversi Word ke PDF Online - Presisi Tinggi Bebas Acak',
  description:
    'Ubah dokumen Word (.docx) menjadi berkas PDF berkualitas tinggi secara instan di browser. Menjaga format teks, font, heading, dan tabel tetap rapi 100% tanpa upload server.',
};

export default function WordToPdfPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <WordToPdfWorkspace />
      </main>
      <Footer />
    </div>
  );
}
