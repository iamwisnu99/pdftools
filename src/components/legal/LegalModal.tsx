'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import styles from './LegalModal.module.css';

export type LegalTabType = 'privacy' | 'terms' | 'disclaimer' | 'compliance';

interface LegalModalProps {
  isOpen: boolean;
  initialTab?: LegalTabType;
  onClose: () => void;
}

export default function LegalModal({
  isOpen,
  initialTab = 'privacy',
  onClose,
}: LegalModalProps) {
  const { t, locale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<LegalTabType>(initialTab);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerTitleGroup}>
            <div className={styles.headerIconBox}>
              <ShieldCheck size={22} className={styles.headerIcon} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>{t.legalModalTitle}</h3>
              <p className={styles.modalSubtitle}>
                {locale === 'en'
                  ? 'Official transparency & data protection commitments for PDF Tools'
                  : 'Komitmen transparansi & perlindungan data resmi untuk PDF Tools'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={styles.tabNav}>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`${styles.tabBtn} ${activeTab === 'privacy' ? styles.tabBtnActive : ''}`}
          >
            <ShieldCheck size={16} />
            <span>{t.legalTabPrivacy}</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`${styles.tabBtn} ${activeTab === 'terms' ? styles.tabBtnActive : ''}`}
          >
            <FileText size={16} />
            <span>{t.legalTabTerms}</span>
          </button>

          <button
            onClick={() => setActiveTab('disclaimer')}
            className={`${styles.tabBtn} ${activeTab === 'disclaimer' ? styles.tabBtnActive : ''}`}
          >
            <AlertTriangle size={16} />
            <span>{t.legalTabDisclaimer}</span>
          </button>

          <button
            onClick={() => setActiveTab('compliance')}
            className={`${styles.tabBtn} ${activeTab === 'compliance' ? styles.tabBtnActive : ''}`}
          >
            <Lock size={16} />
            <span>{t.legalTabCompliance}</span>
          </button>
        </div>

        {/* Modal Body / Tab Content */}
        <div className={styles.modalBody}>
          {activeTab === 'privacy' && (
            <div className={styles.legalSection}>
              <div className={styles.calloutBox}>
                <CheckCircle2 size={20} className={styles.calloutIcon} />
                <div>
                  <strong>
                    {locale === 'en'
                      ? 'Core Privacy Principle: Zero Server Transmission'
                      : 'Prinsip Utama Privasi: Tanpa Pengiriman Berkas ke Server'}
                  </strong>
                  <p>
                    {locale === 'en'
                      ? 'PDF Tools executes 100% inside your browser using WebAssembly. Your files, documents, and data never leave your local device.'
                      : 'PDF Tools berjalan 100% di dalam peramban web Anda melalui WebAssembly. Berkas, dokumen, dan data Anda tidak pernah keluar dari komputer Anda.'}
                  </p>
                </div>
              </div>

              <h4>{locale === 'en' ? '1. Information We Do Not Collect' : '1. Data yang Tidak Kami Kumpulkan'}</h4>
              <p>
                {locale === 'en'
                  ? 'We do not collect, read, analyze, log, or store the contents of your PDF files. All processing (merging, rotation, thumbnail generation, page reordering) happens solely within your browser’s volatile memory (RAM).'
                  : 'Kami tidak mengumpulkan, membaca, menganalisis, mencatat, ataupun menyimpan isi dokumen PDF Anda. Seluruh proses (penggabungan, rotasi, thumbnail, dan pengurutan) murni berlangsung di dalam memori sementara (RAM) peramban Anda.'}
              </p>

              <h4>{locale === 'en' ? '2. Local Storage & Cookies' : '2. Penggunaan Cookie & Penyimpanan Lokal'}</h4>
              <p>
                {locale === 'en'
                  ? 'PDF Tools uses your browser’s LocalStorage strictly for saving non-identifiable user preferences, specifically your preferred UI theme (Dark/Light mode) and chosen language (ID/EN). No marketing cookies or third-party tracking pixels are deployed.'
                  : 'PDF Tools hanya menggunakan LocalStorage pada peramban untuk menyimpan preferensi non-pribadi seperti pilihan tema antarmuka (Gelap/Terang) dan bahasa (Indonesia/Inggris). Kami tidak menggunakan cookie pelacak iklan pihak ketiga.'}
              </p>

              <h4>{locale === 'en' ? '3. Memory Self-Cleaning' : '3. Pembersihan Memori Otomatis'}</h4>
              <p>
                {locale === 'en'
                  ? 'Once merging completes or the result modal is dismissed, all object references and cached thumbnails are revoked immediately via URL.revokeObjectURL(), allowing your browser’s garbage collector to free system RAM.'
                  : 'Segera setelah proses penggabungan selesai atau modal hasil ditutup, seluruh referensi objek dan cache gambar thumbnail langsung dicabut melalui URL.revokeObjectURL(), memastikan memori RAM perangkat Anda kembali bersih.'}
              </p>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className={styles.legalSection}>
              <div className={styles.calloutBox}>
                <CheckCircle2 size={20} className={styles.calloutIcon} />
                <div>
                  <strong>
                    {locale === 'en' ? 'Free for Everyone, Without Limits' : 'Gratis untuk Siapa Saja, Tanpa Batasan'}
                  </strong>
                  <p>
                    {locale === 'en'
                      ? 'PDF Tools is freely accessible for personal, academic, non-profit, and commercial document management workflows.'
                      : 'PDF Tools dapat diakses gratis untuk kebutuhan pribadi, akademik, riset, maupun komersial tanpa kuota berbayar.'}
                  </p>
                </div>
              </div>

              <h4>{locale === 'en' ? '1. Document Ownership & Intellectual Property' : '1. Hak Milik Dokumen & Kekayaan Intelektual'}</h4>
              <p>
                {locale === 'en'
                  ? 'You retain 100% of all intellectual property, copyright, and ownership rights over any documents and files processed through PDF Tools. PDF Tools claims zero license, title, or interest in your files.'
                  : 'Anda memegang 100% hak cipta, kepemilikan, dan lisensi penuh atas seluruh dokumen yang Anda olah melalui PDF Tools. PDF Tools tidak memiliki klaim hak apa pun atas isi berkas Anda.'}
              </p>

              <h4>{locale === 'en' ? '2. Acceptable Use Policy' : '2. Kebijakan Penggunaan yang Bertanggung Jawab'}</h4>
              <p>
                {locale === 'en'
                  ? 'You agree not to use PDF Tools to assemble or propagate unauthorized copyrighted materials, malware, phishing payloads, or illegal content. You are solely responsible for ensuring you have lawful permission to merge and handle the files.'
                  : 'Anda setuju untuk tidak memanfaatkan PDF Tools guna menyebarkan materi berhak cipta tanpa izin, malware, dokumen phishing, atau konten melanggar hukum. Anda bertanggung jawab penuh atas hak legal kepemilikan dokumen yang diproses.'}
              </p>

              <h4>{locale === 'en' ? '3. Availability & Service Updates' : '3. Ketersediaan Layanan & Pembaruan'}</h4>
              <p>
                {locale === 'en'
                  ? 'PDF Tools is provided on a continuous basis. We reserve the right to optimize, update, or refine utility features to improve performance, user experience, and security standards.'
                  : 'PDF Tools disediakan secara berkesinambungan. Kami berhak melakukan optimasi, pembaruan fitur, dan penyesuaian teknis secara berkala untuk meningkatkan performa serta kenyamanan pengguna.'}
              </p>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className={styles.legalSection}>
              <h4>{locale === 'en' ? '1. "AS IS" Warranty Disclaimer' : '1. Penafian Jaminan "Sebagaimana Adanya" (AS IS)'}</h4>
              <p>
                {locale === 'en'
                  ? 'PDF Tools is provided on an "AS IS" and "AS AVAILABLE" basis without representations or warranties of any kind, whether express or implied. While we employ rigorous PDF specifications (PDF-Lib), we do not warrant that all non-standard or heavily corrupted PDFs will merge without anomaly.'
                  : 'Layanan PDF Tools disediakan "sebagaimana adanya" (AS IS) tanpa jaminan mutlak dalam bentuk apa pun. Meskipun kami menerapkan standar PDF internasional, kami tidak menjamin berkas yang telah rusak (corrupt) atau berformat non-standar dapat digabungkan secara sempurna.'}
              </p>

              <h4>{locale === 'en' ? '2. Limitation of Liability' : '2. Batasan Tanggung Jawab'}</h4>
              <p>
                {locale === 'en'
                  ? 'In no event shall PDF Tools or its authors be liable for any indirect, incidental, or consequential damages resulting from document loss, misplacement, or corruption during local browser processing. Users are strongly encouraged to maintain original copies of critical documents.'
                  : 'Dalam kondisi apa pun, pengembang PDF Tools tidak bertanggung jawab atas kerugian tidak langsung atau kehilangan data akibat pemrosesan lokal di peramban pengguna. Pengguna sangat disarankan untuk selalu menyimpan berkas salinan asli dari dokumen-dokumen penting.'}
              </p>

              <h4>{locale === 'en' ? '3. Trademark Acknowledgment' : '3. Pengakuan Merek Dagang'}</h4>
              <p>
                {locale === 'en'
                  ? 'Portable Document Format (PDF) is an open international standard (ISO 32000-1). Adobe, Adobe PDF, and Acrobat are trademarks or registered trademarks of Adobe Systems Incorporated in the United States and other countries. PDF Tools is an independent application.'
                  : 'Format Dokumen Portabel (PDF) adalah standar internasional terbuka (ISO 32000-1). Adobe, Adobe PDF, dan Acrobat adalah merek dagang terdaftar milik Adobe Systems Incorporated. PDF Tools adalah aplikasi independen dan tidak terafiliasi dengan pihak Adobe.'}
              </p>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className={styles.legalSection}>
              <div className={styles.calloutBox}>
                <CheckCircle2 size={20} className={styles.calloutIcon} />
                <div>
                  <strong>
                    {locale === 'en' ? 'Privacy by Design (GDPR & PDP Compliant)' : 'Desain Berorientasi Privasi (Sesuai GDPR & UU PDP)'}
                  </strong>
                  <p>
                    {locale === 'en'
                      ? 'Because no personal data or files are ingested or transmitted to any server, PDF Tools inherently meets GDPR, CCPA, and Indonesian PDP compliance standards.'
                      : 'Karena tidak ada data pribadi atau dokumen yang dikirim ke server mana pun, arsitektur PDF Tools secara alamiah mematuhi regulasi GDPR, CCPA, dan UU Perlindungan Data Pribadi (UU PDP).'}
                  </p>
                </div>
              </div>

              <h4>{locale === 'en' ? '1. Browser Security Sandbox' : '1. Keamanan Sandbox Peramban'}</h4>
              <p>
                {locale === 'en'
                  ? 'All PDF calculations run strictly isolated within your browser’s runtime sandbox. The application has zero capability to read your local hard drive, inspect outside folders, or execute background system processes.'
                  : 'Seluruh komputasi PDF berjalan terisolasi di dalam sandbox peramban web modern Anda. Aplikasi tidak memiliki wewenang untuk membaca folder lain di komputer Anda atau menjalankan proses di luar tab yang aktif.'}
              </p>

              <h4>{locale === 'en' ? '2. Zero Telemetry on Documents' : '2. Bebas Telemetri pada Isi Dokumen'}</h4>
              <p>
                {locale === 'en'
                  ? 'We do not inspect text content, form fields, digital signatures, or embedded images inside your uploaded PDFs. What you process remains confidential and strictly between you and your machine.'
                  : 'Kami tidak memindai teks, formulir isian, tanda tangan elektronik, maupun gambar di dalam PDF Anda. Segala sesuatu yang Anda proses bersifat rahasia dan seutuhnya milik Anda.'}
              </p>

              <h4>{locale === 'en' ? '3. Corporate & Regulatory Safety' : '3. Keamanan untuk Korporat & Institusi'}</h4>
              <p>
                {locale === 'en'
                  ? 'Institutions with strict data sovereignty rules (financial institutions, universities, medical centers) can safely use PDF Tools because zero data is exported beyond your local network perimeter.'
                  : 'Institusi dengan regulasi kerahasiaan data ketat (perbankan, kantor hukum, universitas, rumah sakit) dapat menggunakan PDF Tools dengan aman karena tidak ada data yang keluar dari jaringan lokal Anda.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={styles.modalFooter}>
          <div className={styles.statusIndicator}>
            <span className={styles.statusDot} />
            <span>
              {locale === 'en'
                ? 'Client-Side Sandbox Active • Verified Private'
                : 'Sandbox Klien Aktif • Terverifikasi Privat'}
            </span>
          </div>
          <button onClick={onClose} className="btn btn-secondary">
            {t.legalCloseBtn}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
