import React, { useState, useEffect, useRef } from 'react';
import '../ticket.css';
import { useParams } from 'react-router-dom';
import Barcode from 'react-barcode';
import { motion } from 'framer-motion';
import {
  Info, Download, ShieldCheck, Image as ImageIcon,
  ExternalLink, User, Tag, Calendar, Clock, MapPin,
  Users, Phone, Heart, Sparkles
} from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

import { supabase } from '../supabaseClient';
import { formatTicketCode, normalizeJenisTiket } from '../utils';
import type { RTParticipant } from '../types';

/* ─── Helper: Tier Badge Class ───────────────────────────── */
const getTierClass = (jenis: string): string => {
  const n = normalizeJenisTiket(jenis).toLowerCase();
  if (n.includes('vvip'))   return 'highlight vvip-tier';
  if (n.includes('gold'))   return 'highlight gold-tier';
  if (n.includes('silver')) return 'highlight silver-tier';
  return 'highlight reguler-tier';
};

/* ─── Helper: Tier Icon ──────────────────────────────────── */
const TierIcon: React.FC<{ jenis: string }> = ({ jenis }) => {
  const n = normalizeJenisTiket(jenis).toLowerCase();
  if (n.includes('vvip'))   return <span>★</span>;
  if (n.includes('gold'))   return <span>♛</span>;
  if (n.includes('silver')) return <span>♜</span>;
  return <span>◉</span>;
};

const PublicTicket: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [participant, setParticipant] = useState<RTParticipant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        setParticipant(data);
      } catch (err: any) {
        setError('Tiket tidak ditemukan atau terjadi kesalahan.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id]);

  const getBarcodeValue = () => {
    return participant?.barcode || participant?.id || 'UNKNOWN';
  };

  const downloadAsImage = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `Tiket-PulihYuk-${participant?.nama_lengkap || 'Download'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadAsPDF = async () => {
    if (!ticketRef.current) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#FDF8F0',
      });

      const width  = ticketRef.current.offsetWidth  * 2;
      const height = ticketRef.current.offsetHeight * 2;
      const orientation = width > height ? 'landscape' : 'portrait';

      const pdf = new jsPDF({ orientation, unit: 'px', format: [width, height] });
      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`Tiket-PulihYuk-${participant?.nama_lengkap || 'Download'}.pdf`);
    } catch (err) {
      console.error('PDF download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-rt" />
        <p>Memuat Tiket…</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !participant) {
    return (
      <div className="loading-container">
        <Info size={48} color="#8B1A38" style={{ marginBottom: '16px' }} />
        <h2 style={{ color: '#1A0A10', marginBottom: '8px' }}>Oops!</h2>
        <p style={{ color: '#4A3040' }}>{error || 'Tiket tidak valid atau tidak ditemukan.'}</p>
      </div>
    );
  }

  const tierNormalized = normalizeJenisTiket(participant.jenis_tiket);

  return (
    <div className="public-ticket-page">

      {/* ── Animated Background Blobs ── */}
      <div className="rt-bg-elements no-print">
        <motion.div
          className="rt-blob rt-blob-1"
          animate={{ x: [0, 40, 0], y: [0, -60, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="rt-blob rt-blob-2"
          animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="rt-blob rt-blob-3"
          animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* ── Hero ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rt-hero"
      >
        <div className="rt-hero-badge">
          <Sparkles size={12} />
          KAJIAN · PARENTING &amp; HEALING CLASS
        </div>
        <h1>Ruang Tenang</h1>
        <p>Pulih Yuk, Sebelum Luka Diwariskan</p>
      </motion.div>

      {/* ── Ticket Card ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
      >
        <div ref={ticketRef} className="rt-ticket-card">

          {/* Left: Poster */}
          <div className="rt-ticket-poster">
            <img src="/fotoTiketBaru.jpg" alt="" className="rt-ticket-poster-bg" aria-hidden="true" />
            <img src="/fotoTiketBaru.jpg" alt="Poster Pulih Yuk" className="rt-ticket-poster-main" />
          </div>

          {/* Right: Details */}
          <div className="rt-ticket-right">

            {/* Content (Left side of right panel) */}
            <div className="rt-ticket-content">
              {/* Logos Row */}
              <div className="rt-ticket-logos">
                <img
                  src="/logo_ruang_tenang.jpg-removebg-preview.png"
                  alt="Ruang Tenang"
                  style={{ height: '70px', objectFit: 'contain' }}
                />
                <img
                  src="/gold_flower.png"
                  alt="Ornamen Gold"
                  style={{ height: '70px', objectFit: 'contain', mixBlendMode: 'multiply' }}
                />
              </div>

              {/* Body */}
              <div className="rt-ticket-body">

                {/* Header */}
                <div className="rt-ticket-header">
                  <h2>
                    PULIH YUK, <Heart size={16} style={{ display: 'inline', verticalAlign: 'middle', color: '#8B1A38' }} /><br />
                    SEBELUM LUKA DIWARISKAN
                  </h2>
                  <span className="rt-tagline">Menuju Surga Yang Diridhai Allah.</span>
                  <div className="rt-speaker-badge">
                    <div>
                      dr. Aisah Dahlan, CM., NLP., CCHt., CI
                      <span className="rt-speaker-sub">Praktisi Neuro Parenting Skill</span>
                    </div>
                  </div>
                </div>

                {/* Info Rows */}
                <div className="rt-info-list">

                  <div className="rt-info-row">
                    <div className="rt-info-label">
                      <User size={15} />
                      <span>Nama Peserta</span>
                    </div>
                    <span className="rt-info-value" style={{ fontWeight: 700 }}>
                      {participant.nama_lengkap.toUpperCase()}
                    </span>
                  </div>

                  <div className="rt-info-row">
                    <div className="rt-info-label">
                      <Tag size={15} />
                      <span>Kategori</span>
                    </div>
                    <span className={`rt-info-value ${getTierClass(participant.jenis_tiket)}`}>
                      <TierIcon jenis={participant.jenis_tiket} />{' '}
                      {tierNormalized.toUpperCase()}
                    </span>
                  </div>

                  <div className="rt-info-row">
                    <div className="rt-info-label">
                      <Users size={15} />
                      <span>Jumlah</span>
                    </div>
                    <span className="rt-info-value">{participant.jumlah_tiket} Orang</span>
                  </div>

                  <div className="rt-info-row">
                    <div className="rt-info-label">
                      <Calendar size={15} />
                      <span>Tanggal</span>
                    </div>
                    <span className="rt-info-value">Kamis, 3 September 2026</span>
                  </div>

                  <div className="rt-info-row">
                    <div className="rt-info-label">
                      <Clock size={15} />
                      <span>Waktu</span>
                    </div>
                    <span className="rt-info-value">08.00 – 12.00 WITA</span>
                  </div>

                  <div className="rt-info-row">
                    <div className="rt-info-label">
                      <MapPin size={15} />
                      <span>Lokasi</span>
                    </div>
                    <span className="rt-info-value">Hotel Zahra Syariah, Kendari</span>
                  </div>

                </div>
              </div>
            </div>

            {/* Barcode Section (Potongan Tiket ke-3) */}
            <div className="rt-barcode-section">
              {/* Status Banner dipindah ke sini */}
              <div className="rt-status-wrapper">
                {participant.status_pembayaran === 'Lunas' ? (
                  <div className="rt-status success">
                    <ShieldCheck size={18} />
                    <div>
                      <strong>TIKET VALID &amp; LUNAS</strong>
                      <span>Pembayaran telah diverifikasi</span>
                    </div>
                  </div>
                ) : (
                  <div className="rt-status pending">
                    <Info size={18} />
                    <div>
                      <strong>MENUNGGU VERIFIKASI</strong>
                      <span>Tiket Anda sedang diproses</span>
                    </div>
                  </div>
                )}
              </div>

              <span className="rt-barcode-label">✦ SCAN FOR ENTRY · NO. TIKET ✦</span>
              <Barcode
                value={formatTicketCode(getBarcodeValue())}
                format="CODE128"
                width={3}
                height={90}
                displayValue={false}
                background="#ffffff"
                lineColor="#000000"
                margin={10}
                renderer="img"
              />
              <div className="rt-barcode-value">{formatTicketCode(getBarcodeValue())}</div>

              {/* Compact Pricing & Contact in Stub */}
              <div className="rt-stub-extra">
                <div className="rt-stub-section">
                  <h4>HARGA TIKET</h4>
                  <ul className="rt-stub-prices">
                    <li><span className="badge-reguler">REGULER</span> <strong>110.000</strong></li>
                    <li><span className="badge-silver">SILVER</span> <strong>150.000</strong></li>
                    <li><span className="badge-gold">GOLD</span> <strong>200.000</strong></li>
                    <li><span className="badge-vvip" style={{backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa'}}>VIP</span> <strong>-</strong></li>
                    <li><span className="badge-vvip">VVIP</span> <strong>-</strong></li>
                  </ul>
                </div>

                <div className="rt-stub-section">
                  <h4>HUBUNGI ADMIN</h4>
                  <div className="rt-stub-contacts">
                    <a href="https://wa.me/6282188263079" target="_blank" rel="noreferrer">
                      <Phone size={14} /> <span><strong>Admin 1:</strong> 0821-8826-3079</span>
                    </a>
                    <a href="https://wa.me/6281340720867" target="_blank" rel="noreferrer">
                      <Phone size={14} /> <span><strong>Admin 2:</strong> 0813-4072-0867</span>
                    </a>
                    <a href="https://ruangtenang.id" target="_blank" rel="noreferrer" className="rt-stub-btn">
                      <ExternalLink size={14} /> Link Pendaftaran
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Download Buttons ── */}
      <div className="public-actions no-print">
        <button className="rt-btn rt-btn-primary" onClick={downloadAsImage} disabled={isDownloading}>
          {isDownloading ? 'Memproses…' : (
            <>
              <ImageIcon size={20} />
              <div className="btn-text">
                <strong>Unduh Gambar (PNG)</strong>
                <span>Simpan tiket sebagai gambar</span>
              </div>
            </>
          )}
        </button>
        <button className="rt-btn rt-btn-secondary" onClick={downloadAsPDF} disabled={isDownloading}>
          {isDownloading ? 'Memproses…' : (
            <>
              <Download size={20} />
              <div className="btn-text">
                <strong>Unduh PDF</strong>
                <span>Simpan tiket sebagai PDF</span>
              </div>
            </>
          )}
        </button>
      </div>


      {/* ── Footer ── */}
      <footer className="rt-footer no-print">
        <div className="rt-footer-logos">
          <span>MEDIA PARTNER: KendariInfo · Salasel Tarbiah</span>
        </div>
        <span>© 2026 Ruang Tenang · Menemukan Diri, Menata Hati, Meraih Arti</span>
      </footer>
    </div>
  );
};

export default PublicTicket;
