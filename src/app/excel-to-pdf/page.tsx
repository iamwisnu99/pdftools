import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import ExcelToPdfWorkspace from '@/components/tools/excel-to-pdf/ExcelToPdfWorkspace';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Konversi Excel ke PDF Online - Deteksi Tabel Cerdas',
  description:
    'Ubah lembar kerja Excel (XLSX/XLS) menjadi dokumen PDF berkualitas tinggi secara instan di browser. Dilengkapi fitur deteksi blok data multi-tabel dan pengaturan layout otomatis.',
};

export default function ExcelToPdfPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <ExcelToPdfWorkspace />
      </main>
      <Footer />
    </div>
  );
}
