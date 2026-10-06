import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dokumentasi Legal, Privasi & Kepatuhan',
  description:
    'Pelajari kebijakan privasi 100% client-side, standar keamanan data, dan syarat penggunaan layanan PDF Tools.',
};

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
