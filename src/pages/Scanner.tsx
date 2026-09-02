import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { ArrowLeft, Camera, CheckCircle2, XCircle, Image as ImageIcon, RefreshCcw, Keyboard, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { RTParticipant } from '../types';

type ScanResult = {
  success: boolean;
  message: string;
  type: 'success' | 'error' | 'warning';
  participant?: RTParticipant;
} | null;

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
];

const Scanner: React.FC = () => {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<ScanResult>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [allParticipants, setAllParticipants] = useState<RTParticipant[]>([]);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);
  
  const isProcessingRef = useRef(false);
  const lastScanTimestamp = useRef(0);
  const SCAN_DEBOUNCE_MS = 2000;
  const allParticipantsRef = useRef<RTParticipant[]>([]);

  const fetchAllParticipants = async () => {
    const { data } = await supabase
      .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
      .select('*');
    if (data) {
      setAllParticipants(data);
      allParticipantsRef.current = data;
    }
    return data || [];
  };

  useEffect(() => {
    fetchAllParticipants();
  }, []);

  const suggestions = useMemo(() => {
    const query = manualBarcode.trim().toLowerCase();
    if (!query || query.length < 2) return [];
    
    return allParticipants.filter(p => 
      (p.nama_lengkap && p.nama_lengkap.toLowerCase().includes(query)) ||
      (p.no_whatsapp && p.no_whatsapp.includes(query)) ||
      (p.barcode && p.barcode.toLowerCase().includes(query)) ||
      (p.id && p.id.toLowerCase().includes(query))
    ).slice(0, 5);
  }, [manualBarcode, allParticipants]);

  const processBarcode = useCallback(async (decodedText: string) => {
    const now = Date.now();
    if (isProcessingRef.current || now - lastScanTimestamp.current < SCAN_DEBOUNCE_MS) return;

    isProcessingRef.current = true;
    lastScanTimestamp.current = now;
    setIsProcessing(true);

    // Pause scanner INSIDE main try-finally so it always gets cleaned up
    try {
      const scannerState = scannerRef.current?.getState();
      if (scannerState === 2) {
        scannerRef.current!.pause(true);
      }
    } catch (_) {}

    try {
      const text = decodedText.trim();
      const cleanText = text.replace(/^PY-/i, '').toLowerCase();
      
      let matched = allParticipantsRef.current.find(p => 
        (p.id && p.id.toLowerCase().startsWith(cleanText)) || 
        (p.barcode && p.barcode.toLowerCase().startsWith(cleanText)) ||
        (p.no_whatsapp && p.no_whatsapp === text)
      );

      // Refresh cache if not found (in case of new registrations)
      if (!matched) {
        const freshData = await fetchAllParticipants();
        matched = freshData.find(p => 
          (p.id && p.id.toLowerCase().startsWith(cleanText)) || 
          (p.barcode && p.barcode.toLowerCase().startsWith(cleanText)) ||
          (p.no_whatsapp && p.no_whatsapp === text)
        );
      }

      if (!matched) {
        setScanResult({ success: false, message: 'Tiket Tidak Valid / Tidak Ditemukan!', type: 'error' });
        return;
      }

      // Fetch latest data for this specific participant
      const { data: latestParticipantData } = await supabase
        .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
        .select('*')
        .eq('id', matched.id)
        .single();
        
      const data = latestParticipantData || matched;

      if (data) {
        // -- AUTO APPROVE LOGIC --
        const whatsapp = data.no_whatsapp || '';
        
        const { data: groupData } = await supabase
          .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
          .select('*')
          .eq('no_whatsapp', whatsapp);

        const fullGroupRows = groupData || [data];
        
        // Check if any in group is Lunas
        const isGroupPaid = fullGroupRows.some(r => r.status_pembayaran === 'Lunas');

        if (!isGroupPaid) {
          setScanResult({ 
            success: false, 
            message: 'Status Pembayaran Rombongan Belum LUNAS!', 
            type: 'warning',
            participant: data 
          });
        } else {
          // Individual Quota Check
          if (data.jumlah_checkin >= data.jumlah_tiket) {
            setScanResult({ 
              success: false, 
              message: `AKSES DITOLAK: Kuota tiket ini habis!`, 
              type: 'error',
              participant: data
            });
          } else {
            // Success Path - Increment own checkin
            const newCheckinCount = (data.jumlah_checkin || 0) + 1;
            const waktuCheckin = new Date().toISOString();
            
            await supabase
              .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
              .update({ 
                jumlah_checkin: newCheckinCount,
                waktu_absen: waktuCheckin
              })
              .eq('id', data.id);
              
            const updatedParticipant = { ...data, jumlah_checkin: newCheckinCount };
            const sisa = updatedParticipant.jumlah_tiket - newCheckinCount;
              
            setScanResult({ 
              success: true, 
              message: `Berhasil Check-in! (${newCheckinCount}/${updatedParticipant.jumlah_tiket}) — Sisa: ${sisa}`, 
              type: 'success',
              participant: updatedParticipant
            });
          }
        }
      }
    } catch (err) {
      console.error(err);
      setScanResult({ success: false, message: 'Terjadi kesalahan jaringan. Coba lagi.', type: 'error' });
    } finally {
      // Always reset processing state so scanner can accept the next scan
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  }, []);


  const startCamera = useCallback(async () => {
    // Always stop, clear, and destroy old instance to prevent corrupt state
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (_) {
      scannerRef.current = null;
    }

    // Create fresh instance every time
    scannerRef.current = new Html5Qrcode('reader', {
      formatsToSupport: SUPPORTED_FORMATS,
      verbose: false,
    });

    setCameraError(null);
    setScanResult(null);
    isProcessingRef.current = false;
    lastScanTimestamp.current = 0;

    const minDim = Math.min(window.innerWidth, window.innerHeight);
    const qrboxWidth = Math.min(Math.floor(minDim * 0.65), 320);
    // Horizontal rectangle for 1D barcode scanning
    const qrboxHeight = Math.floor(qrboxWidth * 0.45);

    const onScan = (decodedText: string) => processBarcode(decodedText);

    try {
      await scannerRef.current.start(
        { 
          facingMode: 'environment',
          advanced: [{ focusMode: 'continuous' }] 
        },
        {
          fps: 30,
          qrbox: { width: qrboxWidth, height: qrboxHeight },
          aspectRatio: window.innerHeight / window.innerWidth,
          disableFlip: true,
        },
        onScan,
        () => {}
      );
    } catch (err) {
      try {
        const devices = await Html5Qrcode.getCameras();
        if (devices && devices.length > 0) {
          await scannerRef.current.start(
            devices[devices.length - 1].id,
            { fps: 30, qrbox: { width: qrboxWidth, height: qrboxHeight }, disableFlip: true },
            onScan,
            () => {}
          );
        } else {
          setCameraError('Tidak ada kamera yang terdeteksi di perangkat Anda.');
        }
      } catch (_) {
        setCameraError('Akses kamera ditolak. Berikan izin kamera di pengaturan browser Anda, lalu klik tombol di bawah.');
      }
    }
  }, [processBarcode]);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    startCamera();

    return () => {
      (async () => {
        try {
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          }
        } catch (_) {}
      })();
    };
  }, []);

  const resumeScanning = useCallback(() => {
    setScanResult(null);
    isProcessingRef.current = false;
    lastScanTimestamp.current = 0;
    try {
      const state = scannerRef.current?.getState();
      if (state === 3) {
        // Scanner is paused — resume it
        scannerRef.current!.resume();
      } else if (state !== 2) {
        // Scanner is stopped or not started — restart it fully
        startCamera();
      }
      // state === 2 means already scanning, nothing to do
    } catch (_) {
      // If anything goes wrong, restart camera
      startCamera();
    }
  }, [startCamera]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    isProcessingRef.current = true;
    setIsProcessing(true);

    // CRITICAL: html5-qrcode cannot scanFile() while camera is active.
    // Stop the camera scanner first.
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
      if (scannerRef.current) {
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (_) {}

    // Use a dedicated, temporary Html5Qrcode instance for file scanning.
    // This avoids state conflicts with the camera scanner.
    const fileScannerEl = document.getElementById('reader-file-scan');
    if (!fileScannerEl) {
      setScanResult({ success: false, message: 'Scanner element tidak ditemukan.', type: 'error' });
      isProcessingRef.current = false;
      setIsProcessing(false);
      return;
    }

    const fileScanner = new Html5Qrcode('reader-file-scan', {
      formatsToSupport: SUPPORTED_FORMATS,
      verbose: false,
    });

    try {
      const decodedText = await fileScanner.scanFile(file, true);
      await processBarcode(decodedText);
    } catch {
      setScanResult({ success: false, message: 'QR Code/Barcode tidak terdeteksi pada gambar. Coba foto lebih dekat ke barcode saja.', type: 'error' });
    } finally {
      try { fileScanner.clear(); } catch (_) {}
      isProcessingRef.current = false;
      setIsProcessing(false);
      // Restart camera if no result is showing
      if (!scanResult) {
        startCamera();
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleManualSubmit = () => {
    const code = manualBarcode.trim();
    if (!code || isProcessingRef.current) return;
    setShowManualInput(false);
    setManualBarcode('');
    lastScanTimestamp.current = 0;
    processBarcode(code);
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#0d0b1f] font-sans">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 sm:px-6 h-14 sm:h-16 border-b border-white/5 flex-shrink-0 z-20"
        style={{ background: 'rgba(19,17,28,0.95)', backdropFilter: 'blur(20px)' }}
      >
        <button
          onClick={() => navigate('/admin')}
          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition border border-white/5"
          title="Kembali ke Dashboard"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-base sm:text-lg tracking-wide truncate">
            Scanner Tiket
          </h2>
          <p className="text-[10px] sm:text-xs text-violet-400 mt-0.5 truncate">
            Arahkan kamera ke QR / Barcode
          </p>
        </div>
        {isProcessing && (
          <span className="text-[10px] sm:text-xs text-emerald-400 font-semibold animate-pulse flex-shrink-0">
            ⏳ Memproses...
          </span>
        )}
      </header>

      {/* Scanner Viewport */}
      <div className="flex-1 relative w-full bg-black overflow-hidden">
        <div
          id="reader"
          style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
        />
        {/* Hidden container for file-based barcode scanning (separate from camera) */}
        <div id="reader-file-scan" style={{ display: 'none' }} />

        {/* Corners overlay */}
        {!scanResult && !cameraError && (
          <div style={{ position: 'absolute', inset: '20px', pointerEvents: 'none', zIndex: 10 }}>
            {[
              { top: 0, left: 0, borderTop: '4px solid #8b5cf6', borderLeft: '4px solid #8b5cf6', borderTopLeftRadius: '16px' },
              { top: 0, right: 0, borderTop: '4px solid #8b5cf6', borderRight: '4px solid #8b5cf6', borderTopRightRadius: '16px' },
              { bottom: 0, left: 0, borderBottom: '4px solid #8b5cf6', borderLeft: '4px solid #8b5cf6', borderBottomLeftRadius: '16px' },
              { bottom: 0, right: 0, borderBottom: '4px solid #8b5cf6', borderRight: '4px solid #8b5cf6', borderBottomRightRadius: '16px' },
            ].map((s, i) => (
              <span key={i} style={{ position: 'absolute', width: '36px', height: '36px', ...s }} />
            ))}
          </div>
        )}

        {/* Camera Error Overlay */}
        {cameraError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', zIndex: 20,
            padding: '24px', textAlign: 'center', background: '#0d0b1f',
          }}>
            <div style={{ width: '72px', height: '72px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
              <Camera size={36} color="#8b5cf6" />
            </div>
            <h3 style={{ color: 'white', margin: '0 0 8px', fontSize: '1.15rem', fontWeight: 700 }}>Kamera Tidak Tersedia</h3>
            <p style={{ color: '#94a3b8', marginBottom: '24px', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: '280px' }}>{cameraError}</p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                onClick={() => startCamera()}
                style={{ background: '#7c3aed', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '50px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
              >
                <Camera size={17} /> Minta Izin Kamera
              </button>
              <button
                onClick={() => setShowManualInput(true)}
                style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '12px 22px', borderRadius: '50px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}
              >
                <Keyboard size={17} /> Input Manual
              </button>
            </div>
          </div>
        )}

        {/* Bottom Action Buttons */}
        {!scanResult && !cameraError && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '20px 16px 32px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
            zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
          }}>
            <button
              onClick={() => startCamera()}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'rgba(0,0,0,0.3)', color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.15)', padding: '8px 18px',
                borderRadius: '50px', backdropFilter: 'blur(5px)',
                fontWeight: 500, cursor: 'pointer', fontSize: '0.85rem',
              }}
            >
              <RefreshCcw size={15} /> Restart Kamera
            </button>

            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} />

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowManualInput(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'rgba(13,11,31,0.9)', color: 'white',
                  border: '1px solid rgba(255,255,255,0.2)', padding: '13px 20px',
                  borderRadius: '50px', backdropFilter: 'blur(10px)',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                }}
              >
                <Keyboard size={19} /> Input Manual
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', color: 'white',
                  border: 'none', padding: '13px 20px', borderRadius: '50px',
                  fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.45)',
                }}
              >
                <ImageIcon size={19} /> Scan Galeri
              </button>
            </div>
          </div>
        )}

        {/* Manual Input Modal */}
        {showManualInput && (
          <div
            onClick={(e) => e.target === e.currentTarget && setShowManualInput(false)}
            style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(8px)', zIndex: 50,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start',
              padding: '60px 20px env(safe-area-inset-bottom, 20px)',
            }}
          >
            <div style={{
              background: '#1e1b4b', padding: '24px', borderRadius: '24px',
              width: '100%', maxWidth: '480px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              animation: 'slideDown 0.25s ease',
              display: 'flex', flexDirection: 'column',
              maxHeight: '80vh',
            }}
            onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexShrink: 0 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'white', fontWeight: 700 }}>Pencarian Tiket Manual</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#a5b4fc' }}>Ketik Kode, No WA, atau Nama</p>
                </div>
                <button
                  onClick={() => setShowManualInput(false)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'white', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <XCircle size={20} />
                </button>
              </div>

              <input
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
                placeholder="Contoh: PY-101EFE3C / 0812... / Budi"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleManualSubmit(); }}
                style={{
                  width: '100%', padding: '16px 18px', borderRadius: '14px',
                  border: '2px solid rgba(255,255,255,0.1)', fontSize: '1.05rem',
                  marginBottom: suggestions.length > 0 ? '12px' : '20px', outline: 'none', boxSizing: 'border-box',
                  background: 'rgba(0,0,0,0.2)', color: 'white',
                  fontFamily: 'inherit', letterSpacing: '0.5px',
                  transition: 'border-color 0.2s',
                  flexShrink: 0
                }}
                onFocus={(e) => (e.target.style.borderColor = '#8b5cf6')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />

              {allParticipants.length === 0 ? (
                <div style={{ color: '#a5b4fc', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
                  ⏳ Memuat database peserta...
                </div>
              ) : manualBarcode.trim().length >= 2 && suggestions.length === 0 ? (
                <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center', background: 'rgba(239,68,68,0.1)', padding: '10px', borderRadius: '10px' }}>
                  ❌ Tidak ada nama / WA / Kode yang cocok
                </div>
              ) : suggestions.length > 0 ? (
                <div style={{
                  background: 'rgba(0,0,0,0.2)', borderRadius: '12px',
                  marginBottom: '20px', overflowY: 'auto',
                  border: '1px solid rgba(255,255,255,0.05)',
                  maxHeight: '220px', flexShrink: 0
                }}>
                  {suggestions.map((p, index) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setShowManualInput(false);
                        setManualBarcode('');
                        processBarcode(p.barcode || p.id || '');
                      }}
                      style={{
                        padding: '12px 16px', borderBottom: index < suggestions.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>{p.nama_lengkap}</span>
                      <span style={{ color: '#a5b4fc', fontSize: '0.8rem', marginTop: '2px' }}>{p.no_whatsapp} • {p.jenis_tiket}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <button
                onClick={handleManualSubmit}
                disabled={!manualBarcode.trim() || isProcessing}
                style={{
                  width: '100%', 
                  background: manualBarcode.trim() ? 'linear-gradient(135deg, #7c3aed, #4f46e5)' : 'rgba(255,255,255,0.1)',
                  color: manualBarcode.trim() ? 'white' : '#64748b',
                  border: 'none', padding: '16px', borderRadius: '14px',
                  fontSize: '1.05rem', fontWeight: 700, cursor: manualBarcode.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s',
                  boxShadow: manualBarcode.trim() ? '0 6px 20px rgba(124,58,237,0.35)' : 'none',
                  flexShrink: 0
                }}
              >
                {isProcessing ? 'Memproses...' : 'Cek Tiket'}
              </button>
            </div>
          </div>
        )}

        {/* Scan Result Overlay */}
        {scanResult && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.88)',
            backdropFilter: 'blur(6px)',
            zIndex: 40,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto',
          }}>
            <div style={{
              width: '100%', maxWidth: '400px',
              borderRadius: '28px', overflow: 'hidden',
              boxShadow: scanResult.type === 'success'
                ? '0 24px 60px rgba(16,185,129,0.35)'
                : scanResult.type === 'warning'
                ? '0 24px 60px rgba(245,158,11,0.35)'
                : '0 24px 60px rgba(239,68,68,0.35)',
            }}>

              {/* Header card */}
              <div style={{
                background: scanResult.type === 'success'
                  ? 'linear-gradient(135deg, #065f46, #059669)'
                  : scanResult.type === 'warning'
                  ? 'linear-gradient(135deg, #9a3412, #ea580c)'
                  : 'linear-gradient(135deg, #7f1d1d, #dc2626)',
                padding: '28px 24px 20px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px',
                textAlign: 'center',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '4px',
                }}>
                  {scanResult.type === 'success' && <CheckCircle2 size={38} color="#6ee7b7" />}
                  {scanResult.type === 'warning' && <AlertTriangle size={38} color="#fcd34d" />}
                  {scanResult.type === 'error' && <XCircle size={38} color="#fca5a5" />}
                </div>
                <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {scanResult.type === 'success' ? 'Check-in Berhasil' : scanResult.type === 'warning' ? 'Peringatan' : 'Gagal'}
                </p>
                <h3 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                  {scanResult.participant?.nama_lengkap || '—'}
                </h3>
                {scanResult.participant?.jenis_tiket && (
                  <span style={{
                    background: 'rgba(255,255,255,0.2)', color: 'white',
                    padding: '4px 14px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 600,
                  }}>
                    🎫 {scanResult.participant.jenis_tiket}
                  </span>
                )}
              </div>

              {/* Info grid */}
              <div style={{ background: '#1e1b4b', padding: '20px 20px 0' }}>
                {/* Status message */}
                <div style={{
                  background: scanResult.type === 'success' ? 'rgba(16,185,129,0.1)' 
                            : scanResult.type === 'warning' ? 'rgba(245,158,11,0.1)'
                            : 'rgba(239,68,68,0.1)',
                  border: `1px solid ${scanResult.type === 'success' ? 'rgba(16,185,129,0.5)' 
                            : scanResult.type === 'warning' ? 'rgba(245,158,11,0.5)'
                            : 'rgba(239,68,68,0.5)'}`,
                  borderRadius: '12px', padding: '10px 14px',
                  marginBottom: '16px', textAlign: 'center',
                  fontSize: '0.88rem', fontWeight: 600,
                  color: scanResult.type === 'success' ? '#34d399' 
                       : scanResult.type === 'warning' ? '#fbbf24'
                       : '#f87171',
                }}>
                  {scanResult.message}
                </div>

                {/* Detail rows */}
                {scanResult.participant && (
                  <>
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>📱</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>WhatsApp</p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.95rem', fontWeight: 500, color: 'white' }}>
                          {scanResult.participant.no_whatsapp}
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>📊</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kuota Check-in</p>
                        <p style={{ margin: '3px 0 0', fontSize: '0.95rem', fontWeight: 500, color: 'white' }}>
                          <span style={{ color: '#10b981' }}>{scanResult.participant.jumlah_checkin || 0}</span> / {scanResult.participant.jumlah_tiket} Terpakai
                        </p>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '12px',
                      padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}>
                      <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>💰</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#8b5cf6', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status Bayar Asli</p>
                        <p style={{ 
                          margin: '3px 0 0', fontSize: '0.95rem', fontWeight: 600, 
                          color: scanResult.participant.status_pembayaran === 'Lunas' ? '#10b981' : '#fbbf24' 
                        }}>
                          {scanResult.participant.status_pembayaran}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Action button */}
              <div style={{ background: '#1e1b4b', padding: '16px 20px 20px' }}>
                <button
                  onClick={resumeScanning}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    background: scanResult.type === 'success' ? '#059669' 
                              : scanResult.type === 'warning' ? '#ea580c'
                              : '#dc2626',
                    color: 'white', border: 'none', padding: '15px',
                    borderRadius: '14px', fontWeight: 700, cursor: 'pointer',
                    fontSize: '1rem', boxShadow: scanResult.type === 'success'
                      ? '0 6px 20px rgba(5,150,105,0.35)'
                      : scanResult.type === 'warning'
                      ? '0 6px 20px rgba(234,88,12,0.35)'
                      : '0 6px 20px rgba(220,38,38,0.35)',
                  }}
                >
                  <RefreshCcw size={18} /> Lanjut Scan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        #reader > div { border: none !important; box-shadow: none !important; }
        #reader video { object-fit: cover !important; }
        #reader__scan_region { min-height: 0 !important; }
        #reader__dashboard { display: none !important; }
      `}</style>
    </div>
  );
};

export default Scanner;
