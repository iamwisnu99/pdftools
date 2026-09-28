'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import confetti from 'canvas-confetti';
import {
  LockKeyhole,
  Unlock,
  Upload,
  Download,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Info,
  Eye,
  EyeOff,
  FileText,
  X,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { isPdfEncrypted, protectPDF, unlockPDF } from '@/lib/pdf-protector';
import { ProtectAction, ProtectResult } from '@/types/protect';
import { PDFDocument } from '@cantoo/pdf-lib';
import styles from './ProtectWorkspace.module.css';

function formatBytes(bytes: number, decimals: number = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function ProtectWorkspace() {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState<ProtectAction>('encrypt');
  const [result, setResult] = useState<ProtectResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [unlockPassword, setUnlockPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Toast notification state with countdown timer
  const [toast, setToast] = useState<{
    id: number;
    title: string;
    message: string;
    duration: number;
  } | null>(null);

  const showToast = (title: string, message: string, duration: number = 4500) => {
    setToast({
      id: Date.now(),
      title,
      message,
      duration,
    });
  };

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, toast.duration);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Harap pilih berkas dengan format .pdf');
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    setResult(null);
    setPassword('');
    setConfirmPassword('');
    setUnlockPassword('');

    try {
      const encrypted = await isPdfEncrypted(file);
      if (encrypted) {
        setAction('decrypt');
        setPageCount(1);
      } else {
        setAction('encrypt');
        const buffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
        setPageCount(pdf.getPageCount());
      }
    } catch {
      setPageCount(1);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleStartAction = async () => {
    if (!selectedFile) return;
    setErrorMsg(null);

    if (action === 'encrypt') {
      if (!password || password.trim().length === 0) {
        setErrorMsg('Kata sandi tidak boleh kosong.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg(t.protectPasswordMismatch);
        return;
      }

      setIsProcessing(true);
      try {
        const res = await protectPDF(selectedFile, {
          userPassword: password,
        });

        setResult(res);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal mengenkripsi PDF';
        setErrorMsg(msg);
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Decrypt
      if (!unlockPassword || unlockPassword.trim().length === 0) {
        showToast(t.protectWrongPasswordToastTitle, t.protectEmptyPasswordToast, 4000);
        return;
      }

      setIsProcessing(true);
      try {
        const res = await unlockPDF(selectedFile, {
          password: unlockPassword,
        });

        setResult(res);
        setToast(null);
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
        });
      } catch {
        // Tampilkan toast error dengan progress bar mundur otomatis
        showToast(t.protectWrongPasswordToastTitle, t.protectWrongPasswordToastDesc, 5000);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleReset = () => {
    if (result?.url) {
      URL.revokeObjectURL(result.url);
    }
    setToast(null);
    setSelectedFile(null);
    setResult(null);
    setErrorMsg(null);
    setPassword('');
    setConfirmPassword('');
    setUnlockPassword('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = () => {
    if (!result) return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className={styles.wrapper}>
      {/* Toast Notification for Wrong Password with Countdown Progress Bar */}
      {toast && mounted && createPortal(
        <div className={styles.toastContainer} role="alert" aria-live="assertive">
          <div className={styles.toastCard} key={toast.id}>
            <div className={styles.toastBody}>
              <div className={styles.toastIconBox}>
                <AlertCircle size={20} />
              </div>
              <div className={styles.toastContent}>
                <h4 className={styles.toastTitle}>{toast.title}</h4>
                <p className={styles.toastDesc}>{toast.message}</p>
              </div>
              <button
                type="button"
                className={styles.toastCloseBtn}
                onClick={() => setToast(null)}
                aria-label="Tutup notifikasi"
              >
                <X size={16} />
              </button>
            </div>
            <div className={styles.toastProgressTrack}>
              <div
                className={styles.toastProgressBar}
                style={{ animationDuration: `${toast.duration}ms` }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="container">
        {/* Header */}
        <div className={styles.headerRow}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIconBox}>
              <LockKeyhole size={26} className="text-primary" />
            </div>
            <div>
              <h1 className={styles.pageTitle}>{t.protectTitle}</h1>
              <p className={styles.pageSubtitle}>{t.protectSubtitle}</p>
            </div>
          </div>
          <div className={styles.privacyBadge}>
            <ShieldCheck size={16} />
            <span>{t.privacyNoticePill}</span>
          </div>
        </div>

        {/* Main Card */}
        <div className={styles.mainCard}>
          {errorMsg && (
            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
              <Info size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {!selectedFile ? (
            /* Dropzone */
            <div
              className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className={styles.fileInputHidden}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
              <div className={styles.dropzoneIconWrapper}>
                <Upload size={32} />
              </div>
              <h3 className={styles.dropzoneTitle}>{t.protectDropTitle}</h3>
              <p className={styles.dropzoneSubtitle}>{t.protectDropSubtitle}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <span>{t.dropzoneBrowse}</span>
              </button>
            </div>
          ) : !result ? (
            /* Workspace Options */
            <div>
              <div className={styles.selectedFileCard}>
                <div className={styles.fileMetaLeft}>
                  <div className={styles.fileIconBox}>
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className={styles.fileName}>{selectedFile.name}</h4>
                    <span className={styles.fileSpecs}>
                      {formatBytes(selectedFile.size)} • {pageCount} {t.pageSingular}
                    </span>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    onClick={handleReset}
                    className={styles.btnRemoveFile}
                    title="Ganti berkas"
                  >
                    <X size={15} />
                    <span>Ganti File</span>
                  </button>
                )}
              </div>

              {/* Action Tabs */}
              <div className={styles.tabsRow}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${action === 'encrypt' ? styles.tabBtnActive : ''}`}
                  onClick={() => !isProcessing && setAction('encrypt')}
                >
                  <LockKeyhole size={18} />
                  <span>{t.protectTabEncrypt}</span>
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${action === 'decrypt' ? styles.tabBtnActive : ''}`}
                  onClick={() => !isProcessing && setAction('decrypt')}
                >
                  <Unlock size={18} />
                  <span>{t.protectTabDecrypt}</span>
                </button>
              </div>

              {/* Tab 1: Encrypt Form */}
              {action === 'encrypt' ? (
                <div className={styles.formCard}>
                  <div className={styles.cipherBadge}>
                    <ShieldCheck size={14} />
                    <span>Enkripsi Standar Militer AES-256</span>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>{t.protectPasswordLabel}</label>
                    <div className={styles.passwordInputWrapper}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={styles.passwordInput}
                        placeholder={t.protectPasswordPlaceholder}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isProcessing}
                      />
                      <button
                        type="button"
                        className={styles.toggleEyeBtn}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>{t.protectConfirmPasswordLabel}</label>
                    <div className={styles.passwordInputWrapper}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={styles.passwordInput}
                        placeholder={t.protectConfirmPasswordPlaceholder}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isProcessing}
                      />
                      <button
                        type="button"
                        className={styles.toggleEyeBtn}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
                    <button
                      onClick={handleStartAction}
                      disabled={isProcessing}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                    >
                      <LockKeyhole size={18} />
                      <span>{isProcessing ? t.protectingStatus : t.btnStartProtect}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Tab 2: Decrypt Form */
                <div className={styles.formCard}>
                  <div className={styles.noticeBox}>
                    <Info size={18} className={styles.noticeIcon} />
                    <p className={styles.noticeText}>
                      Masukkan kata sandi dokumen saat ini untuk membuat salinan baru yang bebas sandi dan dapat langsung dibuka.
                    </p>
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.inputLabel}>{t.protectUnlockInputLabel}</label>
                    <div className={styles.passwordInputWrapper}>
                      <input
                        type={showUnlockPassword ? 'text' : 'password'}
                        className={styles.passwordInput}
                        placeholder={t.protectUnlockInputPlaceholder}
                        value={unlockPassword}
                        onChange={(e) => setUnlockPassword(e.target.value)}
                        disabled={isProcessing}
                      />
                      <button
                        type="button"
                        className={styles.toggleEyeBtn}
                        onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                      >
                        {showUnlockPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
                    <button
                      onClick={handleStartAction}
                      disabled={isProcessing}
                      className="btn btn-primary btn-lg"
                      style={{ width: '100%' }}
                    >
                      <Unlock size={18} />
                      <span>{isProcessing ? t.unlockingStatus : t.btnStartUnlock}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Result State */
            <div className={styles.resultCard}>
              <div className={styles.resultSuccessIcon}>
                <CheckCircle2 size={34} />
              </div>
              <h2 className={styles.resultTitle}>
                {result.action === 'encrypt' ? t.protectSuccessTitle : t.unlockSuccessTitle}
              </h2>
              <p className={styles.resultSubtitle}>
                {result.action === 'encrypt' ? t.protectSuccessSubtitle : t.unlockSuccessSubtitle}
              </p>

              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t.labelTotalPages}</div>
                  <div className={styles.statValue}>{result.pageCount}</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statLabel}>{t.labelFinalSize}</div>
                  <div className={styles.statValue}>{formatBytes(result.fileSize)}</div>
                </div>
              </div>

              <div className={styles.resultActionGroup}>
                <button
                  onClick={handleDownload}
                  className="btn btn-primary btn-lg"
                >
                  <Download size={18} />
                  <span>
                    {result.action === 'encrypt' ? t.btnDownloadProtected : t.btnDownloadUnlocked}
                  </span>
                </button>
                <button
                  onClick={() => window.open(result.url, '_blank')}
                  className="btn btn-secondary"
                >
                  <ExternalLink size={16} />
                  <span>{t.btnOpenNewTab}</span>
                </button>
                <button
                  onClick={handleReset}
                  className="btn btn-secondary"
                >
                  <RotateCcw size={16} />
                  <span>{t.btnProtectAnother}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
