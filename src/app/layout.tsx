import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0e17' },
  ],
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL('https://pdftools.primadev.id'),
  title: {
    default: 'PDF Tools | Solusi PDF Lengkap, Cepat & Aman (100% Client-Side)',
    template: '%s | PDF Tools',
  },
  description:
    'Gabungkan, kompres, dan ubah dokumen PDF Anda ke gambar secara instan, presisi, dan aman langsung di peramban Anda. 100% client-side tanpa unggah ke server, tanpa batasan, dan tanpa watermark.',
  keywords: [
    // Indonesian
    'pdf tools',
    'gabung pdf',
    'kompres pdf',
    'pdf ke gambar',
    'pdf to image indonesia',
    'kompres pdf tanpa rusak kualitas',
    'satukan pdf',
    'penggabung pdf online',
    'ubah pdf ke png jpg webp',
    // English
    'pdf tools',
    'pdf merger',
    'merge pdf',
    'compress pdf',
    'lossless pdf compress',
    'pdf to image',
    'pdf to png',
    'pdf to jpg',
    'free pdf tools',
    'private pdf tools online',
  ],
  authors: [{ name: 'Primadev Digital Technology', url: 'https://pdftools.primadev.id' }],
  creator: 'Primadev Digital Technology',
  publisher: 'Primadev Digital Technology',
  applicationName: 'PDF Tools by Primadev',
  category: 'productivity',
  alternates: {
    canonical: '/',
    languages: {
      'id-ID': '/?lang=id',
      'en-US': '/?lang=en',
      'x-default': '/',
    },
  },
  icons: {
    icon: [
      { url: '/icon.png', sizes: 'any', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.svg',
        color: '#dc2626',
      },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    url: '/',
    siteName: 'PDF Tools by Primadev',
    title: 'PDF Tools | Solusi Dokumen PDF Lengkap, Cepat & Aman',
    description:
      'Gabung, kompres, dan ubah dokumen PDF Anda dengan mudah, cepat, dan presisi langsung di peramban tanpa batasan. 100% Client-Side dan Privasi Terjamin.',
    locale: 'id_ID',
    alternateLocale: ['en_US'],
    images: [
      {
        url: '/web-app-manifest-512x512.png',
        width: 512,
        height: 512,
        alt: 'PDF Tools Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF Tools | Fast, Private & Free Online PDF Suite',
    description:
      'Merge, compress, and convert PDF files instantly and securely in your browser with complete privacy.',
    images: ['/web-app-manifest-512x512.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

const jsonLdData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': 'https://pdftools.primadev.id/#website',
      url: 'https://pdftools.primadev.id/',
      name: 'PDF Tools',
      alternateName: [
        'PDF Tools by Primadev',
        'PDF Tools Primadev',
        'PDFTools'
      ],
      publisher: {
        '@type': 'Organization',
        '@id': 'https://pdftools.primadev.id/#organization',
        name: 'Primadev Digital Technology',
        url: 'https://pdftools.primadev.id',
        logo: 'https://pdftools.primadev.id/icon.png'
      }
    },
    {
      '@type': 'Organization',
      '@id': 'https://pdftools.primadev.id/#organization',
      name: 'Primadev Digital Technology',
      url: 'https://pdftools.primadev.id',
      logo: 'https://pdftools.primadev.id/icon.png'
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://pdftools.primadev.id/#webapp',
      name: 'PDF Tools',
      alternateName: ['Peralatan PDF Online', 'PDF Tools by Primadev', 'PDF Merger, Compressor & Converter'],
      url: 'https://pdftools.primadev.id',
      applicationCategory: 'UtilitiesApplication',
      operatingSystem: 'All',
      inLanguage: ['id', 'en'],
      description:
        'Kumpulan alat PDF modern, instan, aman, dan berpresisi tinggi langsung di peramban klien tanpa batasan ukuran atau watermark.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      featureList: [
        'Penggabungan PDF Cepat (Fast PDF Merging)',
        'Kompresi PDF Lossless (Lossless PDF Compression)',
        'Konversi PDF ke Gambar PNG/JPG/WEBP (PDF to Image)',
        'Susun Ulang Berkas Drag & Drop (Drag & Drop Reordering)',
        'Seleksi & Filter Halaman (Page Selection)',
        'Rotasi Orientasi Halaman 90° (Page Rotation)',
        'Privasi Terjamin 100% Client-Side (Client-Side Privacy)',
      ],
    },
    {
      '@type': 'FAQPage',
      '@id': 'https://pdftools.primadev.id/#faq',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Bagaimana cara menggunakan peralatan di PDF Tools? / How to use PDF Tools?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Pilih alat yang Anda butuhkan (Gabung PDF, Kompres PDF, atau PDF ke Gambar), pilih berkas PDF dari komputer/ponsel, sesuaikan opsi, lalu unduh hasilnya secara instan.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah proses pengolahan PDF ini aman dan privat? / Is this process safe?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sangat aman. Seluruh pemrosesan berjalan 100% di peramban perangkat Anda (client-side) tanpa pernah mengunggah berkas ke server pihak ketiga.',
          },
        },
      ],
    },
  ],
};

import { LanguageProvider } from '@/context/LanguageContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Anti-Flicker Synchronous Theme Initializer (Prevents Blank White/Black Flash on Back Navigation & Reload) */}
        <script
          id="theme-initializer"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('pdf_tools_theme');var d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;var t=s?s:(d?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />

        {/* Favicons */}
        <link rel="icon" type="image/png" href="/icon.png" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />

        {/* LLM & Agentic Browser Context Discovery */}
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Context" />
        <link rel="alternate" type="text/plain" href="/llm.txt" title="Agent Specification" />

        {/* JSON-LD Schema Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}>
        <Analytics />
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
