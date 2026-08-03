import React, { useState, useEffect, useRef } from 'react';
import '../ticket.css';
import { useParams } from 'react-router-dom';
import Barcode from 'react-barcode';
import { motion } from 'framer-motion';
import { Info, Download, ShieldCheck, Image as ImageIcon, ExternalLink, User, Tag, Calendar, Clock, MapPin, Users, Phone } from 'lucide-react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

import { supabase } from '../supabaseClient';
import { formatTicketCode, normalizeJenisTiket } from '../utils';
import type { RTParticipant } from '../types';

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
        backgroundColor: '#ffffff'
      });

      const width = ticketRef.current.offsetWidth * 2;
      const height = ticketRef.current.offsetHeight * 2;
      const orientation = width > height ? 'landscape' : 'portrait';
      
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'px',
        format: [width, height]
      });

      pdf.addImage(dataUrl, 'PNG', 0, 0, width, height);
      pdf.save(`Tiket-PulihYuk-${participant?.nama_lengkap || 'Download'}.pdf`);
    } catch (err) {
      console.error('PDF download failed', err);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-rt"></div>
        <p>Memuat Tiket...</p>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="loading-container">
        <Info size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
        <h2>Oops!</h2>
        <p>{error || 'Tiket tidak valid atau tidak ditemukan.'}</p>
      </div>
    );
  }

  return (
    <div className="public-ticket-page">
      {/* Animated Background Ornaments */}
      <div className="rt-bg-elements no-print">
        <motion.div 
          className="rt-blob rt-blob-1"
          animate={{ x: [0, 40, 0], y: [0, -60, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="rt-blob rt-blob-2"
          animate={{ x: [0, -50, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="rt-blob rt-blob-3"
          animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rt-hero"
      >
        <h1>Ruang Tenang</h1>
        <p>Kajian Parenting & Healing Class</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div ref={ticketRef} className="rt-ticket-card">
          {/* Left Side: Poster */}
          <div className="rt-ticket-poster">
            {/* Latar Belakang Blur (Ambient Glow) */}
            <img src="/poster.jpeg" alt="" className="rt-ticket-poster-bg" aria-hidden="true" />
            {/* Poster Utama */}
            <img src="/poster.jpeg" alt="Poster Pulih Yuk" className="rt-ticket-poster-main" />
          </div>

          {/* Right Side: Details */}
          <div className="rt-ticket-right">
            {/* Logos */}
            <div className="rt-ticket-logos" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 24px 0 24px' }}>
              <img src="/logo_ruang_tenang.jpg-removebg-preview.png" alt="Ruang Tenang Logo" style={{ height: '90px', objectFit: 'contain' }} />
              <img src="/gold_flower.png" alt="Gold Flower" style={{ height: '90px', objectFit: 'contain', mixBlendMode: 'multiply' }} />
            </div>

            {/* Status Banner */}
            <div className="rt-status-wrapper" style={{ paddingTop: '16px' }}>
              {participant.status_pembayaran === 'Lunas' ? (
                <div className="rt-status success">
                  <ShieldCheck size={18} /> 
                  <div>
                    <strong>TIKET VALID & LUNAS</strong>
                    <span>Pembayaran telah diverifikasi</span>
                  </div>
                </div>
              ) : (
                <div className="rt-status pending">
                  <Info size={18} /> 
                  <div>
                    <strong>MENUNGGU VERIFIKASI</strong>
                    <span>Tiket Anda sedang dalam proses verifikasi</span>
                  </div>
                </div>
              )}
            </div>

            <div className="rt-ticket-body">
              <div className="rt-ticket-header">
                <h2>PULIH YUK,<br/>SEBELUM LUKA DIWARISKAN</h2>
                <p>Bersama dr. Aisa Dahlan, CM., NLP., CHt., CI</p>
              </div>

              <div className="rt-info-list">
                <div className="rt-info-row">
                  <div className="rt-info-label">
                    <User size={16} />
                    <span>Nama Peserta</span>
                  </div>
                  <span className="rt-info-value" style={{ fontWeight: 700 }}>{participant.nama_lengkap.toUpperCase()}</span>
                </div>
                
                <div className="rt-info-row">
                  <div className="rt-info-label">
                    <Tag size={16} />
                    <span>Kategori Tiket</span>
                  </div>
                  <span className="rt-info-value highlight">{normalizeJenisTiket(participant.jenis_tiket).toUpperCase()}</span>
                </div>

                <div className="rt-info-row">
                  <div className="rt-info-label">
                    <Users size={16} />
                    <span>Jumlah Tiket</span>
                  </div>
                  <span className="rt-info-value">{participant.jumlah_tiket} Orang</span>
                </div>

                <div className="rt-info-row">
                  <div className="rt-info-label">
                    <Calendar size={16} />
                    <span>Tanggal</span>
                  </div>
                  <span className="rt-info-value">Kamis, 3 Sept 2026</span>
                </div>

                <div className="rt-info-row">
                  <div className="rt-info-label">
                    <Clock size={16} />
                    <span>Waktu</span>
                  </div>
                  <span className="rt-info-value">08.00 - 12.00 WITA</span>
                </div>
                
                <div className="rt-info-row">
                  <div className="rt-info-label">
                    <MapPin size={16} />
                    <span>Lokasi</span>
                  </div>
                  <span className="rt-info-value">Hotel Zahra Syariah, Kendari</span>
                </div>
              </div>
            </div>

            <div className="rt-barcode-section">
              <span className="rt-info-label" style={{ marginBottom: '12px', justifyContent: 'center' }}>NO. TIKET</span>
              <Barcode
                value={getBarcodeValue()}
                format="CODE128"
                width={1}
                height={50}
                displayValue={false}
                background="transparent"
                lineColor="#0f172a"
                renderer="img"
              />
              <div className="rt-barcode-value">{formatTicketCode(getBarcodeValue())}</div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="public-actions no-print">
        {/* We can keep a simplified status here for mobile if needed, or remove it since it's in the card */}
        <button className="rt-btn rt-btn-primary" onClick={downloadAsImage} disabled={isDownloading}>
          {isDownloading ? 'Memproses...' : (
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
          {isDownloading ? 'Memproses...' : (
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

      {/* Box Promosi Baru: Harga Tiket & Pendaftaran */}
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginTop: '32px', width: '100%', maxWidth: '800px', justifyContent: 'center' }}>
        
        {/* Box Harga Tiket */}
        <div style={{
          flex: '1 1 400px',
          background: 'rgba(10, 15, 30, 0.6)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2))' }} />
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '3px', fontWeight: 600 }}>HARGA TIKET</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.2))' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
            {/* Reguler */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
              <span style={{ background: '#f8fafc', color: '#0f172a', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>REGULER</span>
              <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.5px', fontFamily: 'Oswald, sans-serif' }}>110.000</span>
              <div style={{ position: 'absolute', right: '-4px', top: '10%', bottom: '10%', width: '1px', background: 'rgba(255,255,255,0.15)' }} />
            </div>
            {/* Silver */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative' }}>
              <span style={{ background: 'linear-gradient(to right, #e2e8f0, #94a3b8)', color: '#0f172a', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>SILVER</span>
              <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.5px', fontFamily: 'Oswald, sans-serif' }}>150.000</span>
              <div style={{ position: 'absolute', right: '-4px', top: '10%', bottom: '10%', width: '1px', background: 'rgba(255,255,255,0.15)' }} />
            </div>
            {/* Gold */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: 'linear-gradient(to right, #fde047, #d97706)', color: '#0f172a', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 800, letterSpacing: '1px' }}>GOLD</span>
              <span style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, letterSpacing: '0.5px', fontFamily: 'Oswald, sans-serif' }}>200.000</span>
            </div>
          </div>
        </div>

        {/* Box Pendaftaran */}
        <div style={{
          flex: '0 0 250px',
          background: 'rgba(10, 15, 30, 0.6)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex', flexDirection: 'column', gap: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2))' }} />
            <span style={{ color: '#94a3b8', fontSize: '0.85rem', letterSpacing: '2px', fontWeight: 600 }}>PENDAFTARAN</span>
            <div style={{ flex: 1, height: '1px', background: 'linear-gradient(to left, transparent, rgba(255,255,255,0.2))' }} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', textDecoration: 'none', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
              <div style={{ background: '#22c55e', padding: '6px', borderRadius: '50%', display: 'flex' }}><Phone size={14} color="white" /></div>
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Admin 1 (Tina)</span>
            </a>
            <a href="https://docs.google.com/forms/d/1ZvZLPlL9oMeshBXDtCs7dmKgsXN5i4QjheQSxGudijQ/viewform" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'white', textDecoration: 'none', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', padding: '8px 12px', borderRadius: '8px', border: 'none', transition: 'opacity 0.2s', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '6px', borderRadius: '50%', display: 'flex' }}><ExternalLink size={14} color="white" /></div>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Link Pendaftaran</span>
            </a>
          </div>
        </div>
      </div>
      
      <footer className="rt-footer no-print">
        © 2026 Ruang Tenang. All rights reserved.
      </footer>
    </div>
  );
};

export default PublicTicket;
