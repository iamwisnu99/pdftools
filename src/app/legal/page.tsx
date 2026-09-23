'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  FileText,
  AlertTriangle,
  Lock,
  ArrowLeft,
  ArrowRight,
  Sun,
  Moon,
  ChevronDown,
  Check,
  CheckCircle2,
  Search,
  ExternalLink,
  ChevronRight,
  ArrowUp,
  Cpu,
} from 'lucide-react';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { FlagID, FlagEN } from '@/components/Flags';
import styles from './legal.module.css';

export type LegalDocId = 'privacy' | 'terms' | 'disclaimer' | 'compliance';

interface DocSectionItem {
  id: string;
  title: string;
  content: React.ReactNode;
}

function LegalDocumentationView() {
  const { t, locale, setLocale } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Active Document State
  const initialDocParam = (searchParams.get('doc') as LegalDocId) || 'privacy';
  const [activeDoc, setActiveDoc] = useState<LegalDocId>(
    ['privacy', 'terms', 'disclaimer', 'compliance'].includes(initialDocParam)
      ? initialDocParam
      : 'privacy'
  );

  // Search query filter
  const [searchQuery, setSearchQuery] = useState('');

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Language Dropdown
  const [isLangOpen, setIsLangOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Sync with URL query parameter
  useEffect(() => {
    const docParam = searchParams.get('doc') as LegalDocId | null;
    if (docParam && ['privacy', 'terms', 'disclaimer', 'compliance'].includes(docParam)) {
      setActiveDoc(docParam);
    }
  }, [searchParams]);

  // Load and sync theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  // Close language dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelectDoc = (docId: LegalDocId) => {
    setActiveDoc(docId);
    router.push(`/legal?doc=${docId}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (e: React.MouseEvent, sectionId: string) => {
    e.preventDefault();
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Documents Metadata Dictionary
  const docsList: { id: LegalDocId; label: string; icon: React.ReactNode; category: 'privacy' | 'terms' }[] = [
    {
      id: 'privacy',
      label: locale === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi',
      icon: <ShieldCheck size={18} className={styles.docItemIcon} />,
      category: 'privacy',
    },
    {
      id: 'compliance',
      label: locale === 'en' ? 'Data Security & Compliance' : 'Keamanan Data & Kepatuhan',
      icon: <Lock size={18} className={styles.docItemIcon} />,
      category: 'privacy',
    },
    {
      id: 'terms',
      label: locale === 'en' ? 'Terms of Service' : 'Syarat & Ketentuan Layanan',
      icon: <FileText size={18} className={styles.docItemIcon} />,
      category: 'terms',
    },
    {
      id: 'disclaimer',
      label: locale === 'en' ? 'Legal Disclaimer' : 'Penafian Hukum & Merek',
      icon: <AlertTriangle size={18} className={styles.docItemIcon} />,
      category: 'terms',
    },
  ];

  // Document Content Definitions
  const renderDocContent = () => {
    if (activeDoc === 'privacy') {
      return {
        title: locale === 'en' ? 'Privacy Policy' : 'Kebijakan Privasi',
        subtitle:
          locale === 'en'
            ? 'Our ironclad commitment to client-side data sovereignty, zero server uploads, and browser memory purge.'
            : 'Komitmen mutlak perlindungan data tanpa pengiriman berkas ke server, pemrosesan lokal, dan pembersihan memori seketika.',
        metaUpdated: locale === 'en' ? 'September 23, 2026' : '23 September 2026',
        readTime: locale === 'en' ? '4 min read' : 'Estimasi 4 menit',
        sections: [
          {
            id: 'executive-summary',
            title: locale === 'en' ? '1. Executive Privacy Principle' : '1. Prinsip Utama & Ringkasan Eksekutif',
            content: (
              <>
                <div className={styles.calloutBanner}>
                  <CheckCircle2 size={24} className={styles.calloutIcon} />
                  <div>
                    <strong>
                      {locale === 'en'
                        ? '100% Client-Side Engine: Your PDFs Never Leave Your Device'
                        : 'Pemrosesan 100% Lokal: Berkas PDF Anda Tidak Pernah Keluar dari Perangkat'}
                    </strong>
                    <p>
                      {locale === 'en'
                        ? 'PDF Tools executes exclusively in your web browser environment. When you merge, reorder, rotate, or preview PDF files, all binary operations occur inside your device’s volatile RAM memory using WebAssembly. No PDF file is ever uploaded, copied, or routed through any remote server.'
                        : 'PDF Tools beroperasi seutuhnya di dalam peramban web lokal Anda. Saat Anda menggabungkan, menyusun, merotasi, atau mempratinjau berkas PDF, seluruh komputasi berjalan di dalam memori RAM komputer Anda melalui WebAssembly. Tidak ada berkas PDF yang pernah diunggah atau disimpan di server mana pun.'}
                    </p>
                  </div>
                </div>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? 'Unlike conventional online PDF converters that force users to transfer confidential documents over the network, PDF Tools was architected from the ground up on modern browser capabilities (WebAssembly, ArrayBuffer, and the Canvas API). This ensures complete isolation and privacy.'
                    : 'Berbeda dengan situs penggabung PDF konvensional yang mewajibkan berkas dikirim ke server pihak ketiga, PDF Tools dibangun dengan arsitektur modern (WebAssembly, ArrayBuffer, dan Canvas API) yang mengeliminasi kebutuhan server penyimpanan berkas secara total.'}
                </p>
              </>
            ),
          },
          {
            id: 'data-not-collected',
            title: locale === 'en' ? '2. Data We Do Not Collect' : '2. Data yang Tidak Kami Kumpulkan',
            content: (
              <>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? 'To provide absolute clarity, PDF Tools maintains a strict Zero-Knowledge posture regarding your documents:'
                    : 'Untuk transparansi mutlak, PDF Tools menerapkan standar Zero-Knowledge terhadap seluruh isi dokumen Anda:'}
                </p>
                <ul className={styles.docList}>
                  <li className={styles.docListItem}>
                    <Check size={16} className={styles.bulletIcon} />
                    <span>
                      <strong>{locale === 'en' ? 'No Document Content:' : 'Bebas Pembacaan Isi Dokumen:'}</strong>{' '}
                      {locale === 'en'
                        ? 'We do not read, extract text from, scan images, or perform automated machine learning analysis on your files.'
                        : 'Kami tidak memindai teks, mengekstrak gambar, atau melakukan pelatihan model kecerdasan buatan terhadap dokumen Anda.'}
                    </span>
                  </li>
                  <li className={styles.docListItem}>
                    <Check size={16} className={styles.bulletIcon} />
                    <span>
                      <strong>{locale === 'en' ? 'No Document Telemetry:' : 'Bebas Telemetri Dokumen:'}</strong>{' '}
                      {locale === 'en'
                        ? 'No file names, file sizes, or metadata signatures are ever dispatched to external analytics servers.'
                        : 'Nama berkas, ukuran berkas, dan struktur metadata tidak pernah dikirim ke server telemetri mana pun.'}
                    </span>
                  </li>
                  <li className={styles.docListItem}>
                    <Check size={16} className={styles.bulletIcon} />
                    <span>
                      <strong>{locale === 'en' ? 'No Account or Personal Identity:' : 'Bebas Akun & Identitas Pribadi:'}</strong>{' '}
                      {locale === 'en'
                        ? 'You are not required to create an account, register an email address, or provide phone numbers to use PDF Tools.'
                        : 'Anda tidak diwajibkan mendaftar akun, memasukkan email, atau nomor telepon untuk menggunakan layanan ini.'}
                    </span>
                  </li>
                </ul>
              </>
            ),
          },
          {
            id: 'local-storage-cookies',
            title: locale === 'en' ? '3. Local Storage & Cookie Usage' : '3. Penggunaan Cookie & Penyimpanan Lokal',
            content: (
              <>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? 'PDF Tools uses your browser’s standard LocalStorage solely for storing UI preferences to enhance usability across visits:'
                    : 'PDF Tools memanfaatkan LocalStorage peramban semata-mata untuk menyimpan preferensi kenyamanan antarmuka pengguna:'}
                </p>
                <div className={styles.docTableWrapper}>
                  <table className={styles.docTable}>
                    <thead>
                      <tr>
                        <th>{locale === 'en' ? 'Storage Key' : 'Kunci Penyimpanan'}</th>
                        <th>{locale === 'en' ? 'Purpose' : 'Fungsi & Tujuan'}</th>
                        <th>{locale === 'en' ? 'Lifespan' : 'Masa Berlaku'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>theme</code></td>
                        <td>{locale === 'en' ? 'Stores Dark or Light mode UI preference' : 'Menyimpan preferensi tema Gelap atau Terang'}</td>
                        <td>{locale === 'en' ? 'Persistent' : 'Permanen Lokal'}</td>
                      </tr>
                      <tr>
                        <td><code>pdf_fusion_locale</code></td>
                        <td>{locale === 'en' ? 'Stores chosen language (ID or EN)' : 'Menyimpan pilihan bahasa (Indonesia / Inggris)'}</td>
                        <td>{locale === 'en' ? 'Persistent' : 'Permanen Lokal'}</td>
                      </tr>
                      <tr>
                        <td><code>pdf_fusion_skip_delete_confirm</code></td>
                        <td>{locale === 'en' ? 'Preferences for single-file removal confirmation dialog' : 'Pengaturan opsi lewati dialog konfirmasi hapus berkas'}</td>
                        <td>{locale === 'en' ? '1 Hour (Auto-resets)' : '1 Jam (Otomatis Reset)'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ),
          },
          {
            id: 'memory-self-cleaning',
            title: locale === 'en' ? '4. Memory Purge & Self-Cleaning' : '4. Protokol Pembersihan Memori Otomatis',
            content: (
              <>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? 'We proactively mitigate memory bloat and potential memory leaks in Chromium, Gecko, and WebKit through a dedicated lifecycle:'
                    : 'Kami menerapkan manajemen memori ketat untuk menjaga performa peramban tetap responsif:'}
                </p>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? '1. Immediately upon successful merge, uploaded raw input files, cached base64 thumbnails, and rotation registries are cleared from state.'
                    : '1. Segera setelah proses penggabungan dokumen berhasil, seluruh daftar berkas input asli, cache thumbnail, dan data rotasi langsung dikosongkan dari state.'}
                </p>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? '2. When the result modal is dismissed or when download triggers, URL.revokeObjectURL() is invoked to release the blob pointer, freeing RAM for the operating system.'
                    : '2. Ketika modal pratinjau hasil ditutup atau berkas diunduh, URL.revokeObjectURL() dipanggil secara otomatis untuk melepaskan alokasi memori RAM peramban.'}
                </p>
              </>
            ),
          },
        ],
      };
    }

    if (activeDoc === 'compliance') {
      return {
        title: locale === 'en' ? 'Data Security & Compliance' : 'Keamanan Data & Kepatuhan',
        subtitle:
          locale === 'en'
            ? 'How PDF Tools natively complies with GDPR, Indonesian PDP Law No. 27/2022, and enterprise data perimeter policies.'
            : 'Kepatuhan alamiah PDF Tools terhadap regulasi GDPR, UU Perlindungan Data Pribadi No. 27/2022, dan batas perimeter institusi.',
        metaUpdated: locale === 'en' ? 'September 23, 2026' : '23 September 2026',
        readTime: locale === 'en' ? '3 min read' : 'Estimasi 3 menit',
        sections: [
          {
            id: 'browser-sandboxing',
            title: locale === 'en' ? '1. Browser Sandboxing Architecture' : '1. Arsitektur Isolasi Sandbox Peramban',
            content: (
              <>
                <div className={styles.calloutBanner}>
                  <Lock size={24} className={styles.calloutIcon} />
                  <div>
                    <strong>
                      {locale === 'en'
                        ? 'Hardware-Enforced Process Isolation'
                        : 'Isolasi Komputasi Tingkat Perangkat Keras'}
                    </strong>
                    <p>
                      {locale === 'en'
                        ? 'Browser engines run tabs in segregated OS process sandboxes. PDF Tools cannot interact with other tabs, access unauthorized files on your disk, or transmit background socket traffic without explicit interaction.'
                        : 'Peramban web modern menjalankan setiap tab dalam sandbox sistem operasi terisolasi. PDF Tools tidak memiliki akses ke berkas lain di komputer Anda atau mengirim data tanpa izin interaksi eksplisit.'}
                    </p>
                  </div>
                </div>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? 'Because no network socket transfers document bytes to the cloud, network sniffers, proxy firewalls, or packet inspection systems inside high-security enterprise environments will confirm zero document egress.'
                    : 'Karena tidak ada lalu lintas jaringan yang mentransfer berkas ke cloud, sistem firewall dan audit keamanan perusahaan dapat memverifikasi bahwa nol byte dokumen keluar dari perimeter jaringan lokal Anda.'}
                </p>
              </>
            ),
          },
          {
            id: 'regulatory-adequacy',
            title: locale === 'en' ? '2. Regulatory Adequacy (GDPR & UU PDP)' : '2. Kepatuhan Regulasi (GDPR & UU PDP)',
            content: (
              <>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? 'Under Article 25 of the General Data Protection Regulation (GDPR - Data protection by design and by default) and Indonesian Personal Data Protection Law (UU PDP No. 27/2022):'
                    : 'Berdasarkan Pasal 25 GDPR (Data Protection by Design & Default) serta Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27/2022):'}
                </p>
                <ul className={styles.docList}>
                  <li className={styles.docListItem}>
                    <Check size={16} className={styles.bulletIcon} />
                    <span>
                      <strong>{locale === 'en' ? 'Data Minimization:' : 'Prinsip Minimalisasi Data:'}</strong>{' '}
                      {locale === 'en'
                        ? 'Zero personal identifiable information (PII) is stored or retained.'
                        : 'Nol data pribadi yang dikumpulkan atau disimpan di basis data eksternal.'}
                    </span>
                  </li>
                  <li className={styles.docListItem}>
                    <Check size={16} className={styles.bulletIcon} />
                    <span>
                      <strong>{locale === 'en' ? 'Purpose Limitation:' : 'Pembatasan Tujuan Pemrosesan:'}</strong>{' '}
                      {locale === 'en'
                        ? 'Your files are assembled strictly for the immediate output you requested.'
                        : 'Berkas semata-mata diproses untuk menghasilkan berkas gabungan sesuai perintah langsung Anda.'}
                    </span>
                  </li>
                  <li className={styles.docListItem}>
                    <Check size={16} className={styles.bulletIcon} />
                    <span>
                      <strong>{locale === 'en' ? 'Zero Cross-Border Transfer:' : 'Bebas Transfer Data Lintas Batas Negara:'}</strong>{' '}
                      {locale === 'en'
                        ? 'No overseas cloud servers hold custody of your sensitive files.'
                        : 'Tidak ada server luar negeri yang menerima atau menyimpan berkas sensitif Anda.'}
                    </span>
                  </li>
                </ul>
              </>
            ),
          },
          {
            id: 'institutional-safety',
            title: locale === 'en' ? '3. Institutional & Healthcare Suitability' : '3. Keamanan untuk Institusi & Finansial',
            content: (
              <>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? 'Due to zero server custody, PDF Tools is natively suitable for banking staff, legal counsels, medical practitioners, and government officials who must comply with strict non-disclosure obligations.'
                    : 'Berkat ketiadaan server perantara, PDF Tools sangat cocok digunakan oleh praktisi hukum, perbankan, instansi medis, dan institusi pemerintahan yang terikat perjanjian kerahasiaan (NDA) ketat.'}
                </p>
              </>
            ),
          },
        ],
      };
    }

    if (activeDoc === 'terms') {
      return {
        title: locale === 'en' ? 'Terms of Service' : 'Syarat & Ketentuan Layanan',
        subtitle:
          locale === 'en'
            ? 'The simple, transparent rules that govern your usage of the PDF Tools application.'
            : 'Ketentuan penggunaan layanan yang transparan, adil, dan mengikat bagi setiap pengguna PDF Tools.',
        metaUpdated: locale === 'en' ? 'September 23, 2026' : '23 September 2026',
        readTime: locale === 'en' ? '3 min read' : 'Estimasi 3 menit',
        sections: [
          {
            id: 'grant-of-license',
            title: locale === 'en' ? '1. Grant of License & Free Access' : '1. Lisensi & Akses Layanan Gratis',
            content: (
              <>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? 'PDF Tools grants you a free, non-exclusive, non-transferable license to access and use the web application for personal, educational, research, non-profit, and commercial purposes.'
                    : 'PDF Tools memberikan lisensi cuma-cuma, non-eksklusif, dan berlaku universal untuk mengakses serta memanfaatkan aplikasi ini demi keperluan pribadi, pendidikan, riset, nirlaba, maupun komersial.'}
                </p>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? 'You are not charged any subscription fees, and no artificial watermarks or promotional logos will be inserted into your documents.'
                    : 'Anda tidak dikenakan biaya langganan apa pun, dan dokumen hasil penggabungan tidak akan pernah disisipi watermark atau logo promosi pihak ketiga.'}
                </p>
              </>
            ),
          },
          {
            id: 'intellectual-property',
            title: locale === 'en' ? '2. Document Ownership & Intellectual Property' : '2. Hak Cipta & Kepemilikan Dokumen',
            content: (
              <>
                <div className={styles.calloutBanner}>
                  <CheckCircle2 size={24} className={styles.calloutIcon} />
                  <div>
                    <strong>
                      {locale === 'en' ? 'You Retain 100% of Document Rights' : 'Pengguna Memegang 100% Hak Milik Dokumen'}
                    </strong>
                    <p>
                      {locale === 'en'
                        ? 'All title, ownership rights, intellectual property, and copyrights in and to your uploaded and merged files remain solely with you or their rightful licensors. PDF Tools claims zero interest or license over your materials.'
                        : 'Seluruh hak cipta, kepemilikan, dan lisensi atas berkas yang Anda unggah dan gabungkan tetap sepenuhnya milik Anda atau pemegang lisensi sah Anda. PDF Tools tidak memiliki klaim kepemilikan apa pun.'}
                    </p>
                  </div>
                </div>
              </>
            ),
          },
          {
            id: 'acceptable-use',
            title: locale === 'en' ? '3. Acceptable Use Policy' : '3. Kebijakan Penggunaan yang Bertanggung Jawab',
            content: (
              <>
                <p className={styles.docParagraph}>
                  {locale === 'en'
                    ? 'You agree not to use PDF Tools to assemble or redistribute materials that infringe upon valid copyrights, contain malicious executable exploits, or violate national or international legal standards.'
                    : 'Pengguna setuju untuk tidak menggunakan PDF Tools guna merekayasa atau menyebarkan dokumen yang melanggar hak cipta pihak lain, dokumen berisi script malware berbahaya, atau berkas yang melanggar hukum.'}
                </p>
              </>
            ),
          },
        ],
      };
    }

    // Default: 'disclaimer'
    return {
      title: locale === 'en' ? 'Legal Disclaimer' : 'Penafian Hukum & Merek',
      subtitle:
        locale === 'en'
          ? 'Notice of non-affiliation, "AS IS" warranty terms, and ISO 32000-1 specification acknowledgments.'
          : 'Pernyataan penafian jaminan, batasan tanggung jawab, serta pengakuan standar terbuka internasional ISO 32000-1.',
      metaUpdated: locale === 'en' ? 'September 23, 2026' : '23 September 2026',
      readTime: locale === 'en' ? '2 min read' : 'Estimasi 2 menit',
      sections: [
        {
          id: 'as-is-warranty',
          title: locale === 'en' ? '1. "AS IS" Warranty Disclaimer' : '1. Penafian Jaminan "Sebagaimana Adanya"',
          content: (
            <>
              <p className={styles.docParagraph}>
                {locale === 'en'
                  ? 'PDF Tools is provided on an "AS IS" and "AS AVAILABLE" basis without warranties of any kind, whether express, implied, or statutory. While we utilize industry-standard client libraries (pdf-lib, pdfjs-dist), we do not guarantee that non-standard, malformed, or heavily corrupted input PDFs will merge without anomaly.'
                  : 'Layanan PDF Tools disediakan secara "sebagaimana adanya" (AS IS) tanpa jaminan kelayakan mutlak dalam bentuk apa pun. Meskipun kami menerapkan pustaka standar industri, kami tidak menjamin dokumen yang telah mengalami kerusakan format (corrupted) dapat dipulihkan atau digabungkan secara utuh.'}
              </p>
            </>
          ),
        },
        {
          id: 'liability-limitation',
          title: locale === 'en' ? '2. Limitation of Liability' : '2. Batasan Tanggung Jawab',
          content: (
            <>
              <p className={styles.docParagraph}>
                {locale === 'en'
                  ? 'In no event shall the authors, maintainers, or contributors of PDF Tools be liable for any indirect, incidental, or consequential damages resulting from document loss, data corruption, or missed submission deadlines. Users are advised to retain original copies of all critical files.'
                  : 'Pengembang PDF Tools tidak bertanggung jawab atas kerugian langsung maupun tidak langsung akibat kehilangan data atau kelalaian pengguna selama pemrosesan lokal. Pengguna dianjurkan untuk selalu menyimpan cadangan (backup) dokumen asli.'}
              </p>
            </>
          ),
        },
        {
          id: 'trademark-notice',
          title: locale === 'en' ? '3. Trademark Acknowledgment' : '3. Pengakuan Merek Dagang Adobe PDF',
          content: (
            <>
              <p className={styles.docParagraph}>
                {locale === 'en'
                  ? 'Portable Document Format (PDF) is an open international standard (ISO 32000-1). Adobe, Adobe PDF, and Acrobat are trademarks or registered trademarks of Adobe Systems Incorporated in the United States and/or other countries. PDF Tools is an independent open application and is not affiliated with, sponsored by, or endorsed by Adobe Systems Incorporated.'
                  : 'Format Dokumen Portabel (PDF) merupakan standar internasional terbuka (ISO 32000-1). Adobe, Adobe PDF, dan Acrobat adalah merek dagang terdaftar milik Adobe Systems Incorporated. PDF Tools adalah aplikasi independen dan tidak terafiliasi atau disponsori oleh Adobe Systems Incorporated.'}
              </p>
            </>
          ),
        },
      ],
    };
  };

  const currentDocData = renderDocContent();

  // Find next and prev documents for bottom navigation
  const currentIndex = docsList.findIndex((d) => d.id === activeDoc);
  const prevDoc = currentIndex > 0 ? docsList[currentIndex - 1] : null;
  const nextDoc = currentIndex < docsList.length - 1 ? docsList[currentIndex + 1] : null;

  return (
    <div className={styles.legalPageWrapper}>
      {/* Top Docs Header */}
      <header className={styles.docsHeader}>
        <div className={`container ${styles.docsHeaderInner}`}>
          <div className={styles.headerLeft}>
            <Link href="/" className={styles.brandLink}>
              <div className={styles.brandIconBox}>
                <Image
                  src="/icon.png"
                  alt="PDF Tools Logo"
                  width={34}
                  height={34}
                  className={styles.brandImg}
                  priority
                />
              </div>
              <span className={styles.brandName}>PDF Tools</span>
            </Link>
            <span className={styles.docsBadge}>Docs / Legal</span>
          </div>

          <div className={styles.headerRight}>
            <Link href="/" className={styles.backHomeBtn}>
              <ArrowLeft size={16} />
              <span>{locale === 'en' ? 'Back to App' : 'Kembali ke Aplikasi'}</span>
            </Link>

            {/* Language Switcher */}
            <div className={styles.langWrapper} ref={langDropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className={styles.themeToggleBtn}
                aria-label="Change Language"
                title={locale === 'en' ? 'Change Language' : 'Ganti Bahasa'}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  width: 'auto',
                  padding: '0.45rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-light)',
                  color: 'var(--text-primary)',
                }}
              >
                {locale === 'id' ? <FlagID size={18} /> : <FlagEN size={18} />}
                <span>{locale === 'id' ? 'ID' : 'EN'}</span>
                <ChevronDown size={14} />
              </button>

              {isLangOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    zIndex: 100,
                    minWidth: '170px',
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-light)',
                    boxShadow: 'var(--shadow-lg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem',
                  }}
                >
                  <button
                    onClick={() => {
                      setLocale('id');
                      setIsLangOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: locale === 'id' ? 'var(--bg-secondary)' : 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.84rem',
                      fontWeight: locale === 'id' ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FlagID size={18} />
                      <span>Indonesia</span>
                    </div>
                    {locale === 'id' && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                  </button>

                  <button
                    onClick={() => {
                      setLocale('en');
                      setIsLangOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: locale === 'en' ? 'var(--bg-secondary)' : 'transparent',
                      border: 'none',
                      color: 'var(--text-primary)',
                      fontSize: '0.84rem',
                      fontWeight: locale === 'en' ? 700 : 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FlagEN size={18} />
                      <span>English</span>
                    </div>
                    {locale === 'en' && <Check size={14} style={{ color: 'var(--accent-primary)' }} />}
                  </button>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={styles.themeToggleBtn}
              aria-label="Toggle Theme"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Documentation Grid Layout */}
      <div className={styles.docsLayoutContainer}>
        {/* Left Navigation Sidebar */}
        <aside className={styles.docsSidebar}>
          {/* Quick Search Input */}
          <div className={styles.searchBox}>
            <Search size={15} className={styles.searchIcon} />
            <input
              type="text"
              placeholder={locale === 'en' ? 'Filter legal documents...' : 'Cari dokumen legal...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Nav Group 1: Privacy & Security */}
          <div className={styles.navGroup}>
            <h4 className={styles.navGroupTitle}>
              {locale === 'en' ? 'Privacy & Security' : 'Kebijakan & Privasi'}
            </h4>
            <ul className={styles.navDocList}>
              {docsList
                .filter((d) => d.category === 'privacy')
                .filter((d) => d.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((doc) => (
                  <li key={doc.id}>
                    <button
                      onClick={() => handleSelectDoc(doc.id)}
                      className={`${styles.navDocItem} ${activeDoc === doc.id ? styles.navDocActive : ''}`}
                    >
                      <div className={styles.docItemLeft}>
                        {doc.icon}
                        <span>{doc.label}</span>
                      </div>
                      <ChevronRight size={14} style={{ opacity: activeDoc === doc.id ? 1 : 0.4 }} />
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          {/* Nav Group 2: Terms & Legal Standards */}
          <div className={styles.navGroup}>
            <h4 className={styles.navGroupTitle}>
              {locale === 'en' ? 'Terms & Legal Standards' : 'Ketentuan Hukum'}
            </h4>
            <ul className={styles.navDocList}>
              {docsList
                .filter((d) => d.category === 'terms')
                .filter((d) => d.label.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((doc) => (
                  <li key={doc.id}>
                    <button
                      onClick={() => handleSelectDoc(doc.id)}
                      className={`${styles.navDocItem} ${activeDoc === doc.id ? styles.navDocActive : ''}`}
                    >
                      <div className={styles.docItemLeft}>
                        {doc.icon}
                        <span>{doc.label}</span>
                      </div>
                      <ChevronRight size={14} style={{ opacity: activeDoc === doc.id ? 1 : 0.4 }} />
                    </button>
                  </li>
                ))}
            </ul>
          </div>

          {/* Sidebar Status Card */}
          <div className={styles.sidebarStatusCard}>
            <div className={styles.statusCardHeader}>
              <span className={styles.pulseDot} />
              <span>{locale === 'en' ? 'Verified Sandbox Active' : 'Status: Resmi & Berlaku'}</span>
            </div>
            <p className={styles.statusCardDesc}>
              {locale === 'en'
                ? 'Client-Side Sandbox Certified • ISO 32000-1 Document Compliance'
                : 'Arsitektur Klien Lokal Terverifikasi • Standar ISO 32000-1 PDF'}
            </p>
          </div>
        </aside>

        {/* Center Main Documentation Reader */}
        <main className={styles.docsMainContent}>
          {/* Breadcrumbs */}
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            <Link href="/" className={styles.breadcrumbLink}>
              {locale === 'en' ? 'Home' : 'Beranda'}
            </Link>
            <span>/</span>
            <span className={styles.breadcrumbLink}>
              {locale === 'en' ? 'Legal Documentation' : 'Dokumentasi Legal'}
            </span>
            <span>/</span>
            <span className={styles.breadcrumbActive}>{currentDocData.title}</span>
          </nav>

          {/* Official Badge & Header */}
          <div className={styles.docOfficialPill}>
            <CheckCircle2 size={13} />
            <span>{locale === 'en' ? 'Official Documentation • Version 2026.1' : 'Dokumentasi Resmi • Versi 2026.1'}</span>
          </div>

          <h1 className={styles.docTitle}>{currentDocData.title}</h1>
          <p className={styles.docSubtitle}>{currentDocData.subtitle}</p>

          {/* Document Meta Info Bar */}
          <div className={styles.docMetaBar}>
            <div className={styles.metaItem}>
              <span>📅</span>
              <span>{locale === 'en' ? 'Last Updated:' : 'Terakhir Diperbarui:'} <strong>{currentDocData.metaUpdated}</strong></span>
            </div>
            <div className={styles.metaItem}>
              <span>⏱️</span>
              <span>{currentDocData.readTime}</span>
            </div>
            <div className={styles.metaItem}>
              <span>🌐</span>
              <span>{locale === 'en' ? 'Scope: Global / Client-Side' : 'Cakupan: Global / Lokal Client-Side'}</span>
            </div>
          </div>

          {/* Structured Document Articles */}
          <div className={styles.docArticle}>
            {currentDocData.sections.map((sec) => (
              <section key={sec.id} id={sec.id} className={styles.docSection}>
                <h2 className={styles.sectionHeading}>{sec.title}</h2>
                {sec.content}
              </section>
            ))}
          </div>

          {/* Bottom Previous & Next Document Navigation */}
          <div className={styles.articleNavRow}>
            {prevDoc ? (
              <button onClick={() => handleSelectDoc(prevDoc.id)} className={styles.navPrevBtn}>
                <span className={styles.navBtnLabel}>
                  {locale === 'en' ? '← Previous Document' : '← Dokumen Sebelumnya'}
                </span>
                <span className={styles.navBtnTitle}>
                  <ArrowLeft size={14} />
                  <span>{prevDoc.label}</span>
                </span>
              </button>
            ) : (
              <div />
            )}

            {nextDoc ? (
              <button onClick={() => handleSelectDoc(nextDoc.id)} className={styles.navNextBtn}>
                <span className={styles.navBtnLabel}>
                  {locale === 'en' ? 'Next Document →' : 'Dokumen Berikutnya →'}
                </span>
                <span className={styles.navBtnTitle}>
                  <span>{nextDoc.label}</span>
                  <ArrowRight size={14} />
                </span>
              </button>
            ) : (
              <div />
            )}
          </div>
        </main>

        {/* Right Sticky Table of Contents (On this page) */}
        <aside className={styles.docsToc}>
          <h4 className={styles.tocTitle}>
            {locale === 'en' ? 'On this page' : 'Pada Halaman Ini'}
          </h4>
          <ul className={styles.tocList}>
            {currentDocData.sections.map((sec) => (
              <li key={sec.id}>
                <a
                  href={`#${sec.id}`}
                  onClick={(e) => scrollToSection(e, sec.id)}
                  className={styles.tocLink}
                >
                  {sec.title}
                </a>
              </li>
            ))}
          </ul>

          <button onClick={scrollToTop} className={styles.backToTopBtn}>
            <ArrowUp size={13} />
            <span>{locale === 'en' ? 'Back to top' : 'Kembali ke atas'}</span>
          </button>
        </aside>
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <LanguageProvider>
      <Suspense
        fallback={
          <div
            style={{
              minHeight: '100vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-surface)',
              color: 'var(--text-muted)',
            }}
          >
            Loading Documentation...
          </div>
        }
      >
        <LegalDocumentationView />
      </Suspense>
    </LanguageProvider>
  );
}
