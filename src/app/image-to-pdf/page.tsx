import type { Metadata } from 'next';
import React from 'react';
import Navbar from '@/components/Navbar';
import ImageToPdfWorkspace from '@/components/tools/image-to-pdf/ImageToPdfWorkspace';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Konversi Gambar ke PDF Online',
  description:
    'Ubah foto dan berkas gambar JPG, PNG, atau WebP menjadi satu dokumen PDF rapi dengan tata letak presisi langsung di browser.',
};

export default function ImageToPdfPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <ImageToPdfWorkspace />
      </main>
      <Footer />
    </div>
  );
}
