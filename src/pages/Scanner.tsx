import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../supabaseClient';
import type { RTParticipant } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, UserCircle2, Loader2, QrCode } from 'lucide-react';

const Scanner: React.FC = () => {
  const [scanResult, setScanResult]   = useState<string | null>(null);
  const [participant, setParticipant] = useState<RTParticipant | null>(null);
  const [statusMsg, setStatusMsg]     = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [loading, setLoading]         = useState(false);
  const scannerRef                    = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'reader',
        { fps: 10, qrbox: { width: 240, height: 240 } },
        false,
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.error(e));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (scanResult === decodedText || loading) return;
    setScanResult(decodedText);
    setLoading(true);
    setStatusMsg(null);

    try {
      const { data, error } = await supabase
        .from('rt_participants')
        .select('*')
        .eq('id', decodedText)
        .single();

      if (error || !data) {
        setStatusMsg({ type: 'error', text: 'Tiket tidak ditemukan di database!' });
        setParticipant(null);
        return;
      }

      setParticipant(data);

      if (data.status_pembayaran !== 'Lunas') {
        setStatusMsg({ type: 'warning', text: 'Status pembayaran belum LUNAS!' });
        return;
      }

      if (data.jumlah_checkin >= data.jumlah_tiket) {
        setStatusMsg({ type: 'error', text: 'AKSES DITOLAK: Kuota tiket sudah habis!' });
        return;
      }

      const newCheckinCount = data.jumlah_checkin + 1;
      const { error: updateError } = await supabase
        .from('rt_participants')
        .update({ jumlah_checkin: newCheckinCount })
        .eq('id', data.id);

      if (updateError) throw updateError;

      setParticipant(prev => prev ? { ...prev, jumlah_checkin: newCheckinCount } : null);

      const sisa = data.jumlah_tiket - newCheckinCount;
      setStatusMsg({
        type: 'success',
        text: `Berhasil Check-in! (${newCheckinCount}/${data.jumlah_tiket}) — Sisa kuota: ${sisa} orang.`,
      });

    } catch (err) {
      console.error(err);
      setStatusMsg({ type: 'error', text: 'Terjadi kesalahan sistem saat memproses tiket.' });
    } finally {
      setLoading(false);
      setTimeout(() => setScanResult(null), 3000);
    }
  };

  const onScanFailure = (_error: unknown) => {
    // silent — normal jika tidak ada QR di frame
  };

  return (
    <div className="min-h-full">
      {/* Desktop top bar */}
      <div
        className="hidden md:flex sticky top-0 z-20 items-center justify-between border-b border-white/5 px-6 h-14"
        style={{ background: 'rgba(13,11,31,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-violet-400" />
          <h1 className="text-white font-semibold text-sm">Scan QR Tiket</h1>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-5">

        {/* ── Title ── */}
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold text-white">Scan QR Tiket</h1>
          <p className="text-white/40 text-sm mt-1">Arahkan kamera ke QR Code peserta</p>
        </div>

        {/* ── QR Scanner Box ── */}
        <div
          className="rounded-2xl overflow-hidden border border-white/10 mb-5 shadow-xl"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          {/* Html5QrcodeScanner injects into this div */}
          <div id="reader" className="w-full" />
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div
            className="flex items-center justify-center gap-2.5 rounded-xl border border-white/10 px-4 py-4 mb-4"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <Loader2 className="w-5 h-5 animate-spin text-violet-400 flex-shrink-0" />
            <span className="text-white/60 text-sm">Memproses tiket...</span>
          </div>
        )}

        {/* ── Status Banner ── */}
        {statusMsg && (
          <div
            className={`rounded-2xl border-2 p-5 mb-4 text-center shadow-lg ${
              statusMsg.type === 'success'
                ? 'border-emerald-500/50 bg-emerald-500/10'
                : statusMsg.type === 'error'
                ? 'border-red-500/50 bg-red-500/10'
                : 'border-orange-500/50 bg-orange-500/10'
            }`}
          >
            <div className="flex justify-center mb-3">
              {statusMsg.type === 'success' && <CheckCircle2 className="w-12 h-12 text-emerald-400" />}
              {statusMsg.type === 'error'   && <XCircle      className="w-12 h-12 text-red-400" />}
              {statusMsg.type === 'warning' && <AlertTriangle className="w-12 h-12 text-orange-400" />}
            </div>
            <p
              className={`font-semibold text-base leading-snug ${
                statusMsg.type === 'success' ? 'text-emerald-300'
                : statusMsg.type === 'error' ? 'text-red-300'
                : 'text-orange-300'
              }`}
            >
              {statusMsg.text}
            </p>
          </div>
        )}

        {/* ── Participant Info Card ── */}
        {participant && (
          <div
            className="rounded-2xl border border-white/10 p-5 shadow-lg"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 pb-4 mb-4 border-b border-white/5">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                <UserCircle2 className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-white leading-tight truncate">
                  {participant.nama_lengkap}
                </h3>
                <p className="text-sm text-white/40 truncate">{participant.no_whatsapp}</p>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <p className="text-white/40 text-xs mb-1">Jenis Tiket</p>
                <p className="font-semibold text-violet-300 text-sm">{participant.jenis_tiket}</p>
              </div>
              <div
                className="rounded-xl p-3"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <p className="text-white/40 text-xs mb-1">Status Bayar</p>
                <p
                  className={`font-semibold text-sm ${
                    participant.status_pembayaran === 'Lunas' ? 'text-emerald-400' : 'text-orange-400'
                  }`}
                >
                  {participant.status_pembayaran}
                </p>
              </div>
            </div>

            {/* Quota bar */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(255,255,255,0.04)' }}
            >
              <p className="text-white/40 text-xs mb-3">Kuota Penggunaan Tiket</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{participant.jumlah_tiket}</p>
                  <p className="text-xs text-white/40 mt-0.5">Total Beli</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{participant.jumlah_checkin}</p>
                  <p className="text-xs text-white/40 mt-0.5">Check-in</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-cyan-400">
                    {participant.jumlah_tiket - (participant.jumlah_checkin || 0)}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">Sisa Kuota</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                  style={{
                    width: `${((participant.jumlah_checkin || 0) / (participant.jumlah_tiket || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!participant && !loading && !statusMsg && (
          <div className="text-center py-4">
            <p className="text-white/20 text-sm">Belum ada tiket yang di-scan.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
