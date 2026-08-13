import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { RTParticipant } from '../types';
import {
  Loader2, TrendingUp, CreditCard,
  Ticket, RefreshCw, Megaphone, PieChart, Activity, Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { currency, getHarga } from '../utils';

/* ── Helpers ─────────────────────────────────────────────── */
function normalizeJenis(jenis: string): string {
  if (!jenis) return 'Lainnya';
  const lower = jenis.toLowerCase();
  if (lower.includes('vvip')) return 'VVIP';
  if (lower.includes('gold')) return 'Gold';
  if (lower.includes('silver')) return 'Silver';
  if (lower.includes('reguler') || lower.includes('regular')) return 'Reguler';
  if (lower.includes('vip')) return 'VIP';
  if (lower.includes('early bird')) return 'Early Bird';
  return jenis;
}

/* ── Stat Card ─────────────────────────────────────────────── */
const SummaryCard: React.FC<{
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}> = ({ label, value, sub, icon, color }) => (
  <div className="relative overflow-hidden rounded-2xl p-5 border border-white/10 group transition-all duration-300 hover:border-white/20"
       style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', backdropFilter: 'blur(10px)' }}>
    <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity duration-500" style={{ background: color }}></div>
    <div className="relative flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-white/60 text-sm font-medium tracking-wide">{label}</p>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg" style={{ background: color }}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">{value}</h3>
        {sub && <p className="text-white/40 text-xs mt-1.5 font-medium">{sub}</p>}
      </div>
    </div>
  </div>
);

/* ── Main Component ──────────────────────────────────────── */
const DataPenjualan: React.FC = () => {
  const [participants, setParticipants] = useState<RTParticipant[]>([]);
  const [loading, setLoading]           = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [timeFilter, setTimeFilter]     = useState<'harian' | 'mingguan' | 'bulanan'>('harian');

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
      .select('*')
      .order('created_at', { ascending: false });
    setParticipants(data || []);
    setLoading(false);
  };

  const downloadPDF = async () => {
    try {
      setIsDownloading(true);
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      
      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('LAPORAN ANALISA PENJUALAN', pageWidth / 2, 20, { align: 'center' });
      
      // Date and Time
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      pdf.text(`Waktu Cetak: ${dateStr} ${timeStr}`, pageWidth / 2, 27, { align: 'center' });
      
      // Table 1: Ringkasan Umum
      autoTable(pdf, {
        startY: 35,
        head: [['Deskripsi', 'Jumlah']],
        body: [
          ['Total Tiket Terjual (Lunas)', String(stats.totalLunasTiket)],
          ['Total Tiket Dipesan (Pending)', String(stats.pending)],
          ['Pendapatan Bersih (Lunas)', currency(stats.pendapatanLunas)],
          ['Potensi Pendapatan (Pending)', currency(stats.pendapatanPotensi)],
          ['Tingkat Konversi', `${stats.konversiRate}%`]
        ],
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] }
      });

      // Table 2: Performa Jenis Tiket
      const jenisBody = Object.entries(stats.byJenis).map(([jenis, data]) => [
        jenis,
        `${data.count} Pendaftar`,
        `${data.lunas} Tiket Lunas`,
        currency(data.pendapatan)
      ]);
      
      autoTable(pdf, {
        startY: (pdf as any).lastAutoTable.finalY + 10,
        head: [['Jenis Tiket', 'Pendaftar', 'Lunas', 'Pendapatan']],
        body: jenisBody,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] }
      });
      
      // Table 3: Metode Pembayaran
      const metodeBody = Object.entries(stats.byMetode).map(([metode, data]) => [
        metode,
        `${data.count} Tiket Dipesan`,
        `${data.lunas} Tiket Lunas`,
        `${data.count > 0 ? Math.round((data.lunas / data.count) * 100) : 0}% Lunas`
      ]);

      autoTable(pdf, {
        startY: (pdf as any).lastAutoTable.finalY + 10,
        head: [['Metode Pembayaran', 'Dipesan', 'Lunas', 'Persentase Lunas']],
        body: metodeBody,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] }
      });

      // Table 4: Tren Pendaftaran
      const trendBody = stats.trendData.map(d => [
        d.label,
        `${d.count} Tiket`,
        currency(d.revenue)
      ]);

      autoTable(pdf, {
        startY: (pdf as any).lastAutoTable.finalY + 10,
        head: [['Periode / Tren', 'Tiket Terjual', 'Pendapatan']],
        body: trendBody,
        theme: 'striped',
        headStyles: { fillColor: [124, 58, 237] }
      });

      // Table 5: Sumber Info
      const sumberBody = Object.entries(stats.bySumber).map(([sumber, count]) => [
        sumber,
        `${count} Pendaftar`,
        `${stats.totalSumberResponses > 0 ? Math.round((count / stats.totalSumberResponses) * 100) : 0}%`
      ]);

      if (sumberBody.length > 0) {
        autoTable(pdf, {
          startY: (pdf as any).lastAutoTable.finalY + 10,
          head: [['Sumber Info / Marketing', 'Jumlah Pendaftar', 'Persentase']],
          body: sumberBody.sort((a, b) => parseInt(b[1]) - parseInt(a[1])),
          theme: 'striped',
          headStyles: { fillColor: [124, 58, 237] }
        });
      }

      // --- Native PDF Line Chart Drawing ---
      let currentY = (pdf as any).lastAutoTable.finalY + 15;
      
      // Check if we need a new page for the chart
      if (currentY + 70 > pdf.internal.pageSize.getHeight()) {
        pdf.addPage();
        currentY = 20;
      }
      
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Grafik Tren Pendaftaran (Line Chart)', 14, currentY);
      
      currentY += 10;
      const chartX = 25;
      const chartY = currentY;
      const chartWidth = pageWidth - 45;
      const chartHeight = 50;
      
      // Draw axes
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.5);
      // Y axis
      pdf.line(chartX, chartY, chartX, chartY + chartHeight);
      // X axis
      pdf.line(chartX, chartY + chartHeight, chartX + chartWidth, chartY + chartHeight);
      
      // Draw Grid Lines
      pdf.setDrawColor(240, 240, 240);
      pdf.line(chartX, chartY + (chartHeight * 0.25), chartX + chartWidth, chartY + (chartHeight * 0.25));
      pdf.line(chartX, chartY + (chartHeight * 0.5), chartX + chartWidth, chartY + (chartHeight * 0.5));
      pdf.line(chartX, chartY + (chartHeight * 0.75), chartX + chartWidth, chartY + (chartHeight * 0.75));

      // Draw data
      if (stats.trendData.length > 0) {
        const maxCount = Math.max(...stats.trendData.map(d => d.count), 1);
        const stepX = chartWidth / (stats.trendData.length > 1 ? stats.trendData.length - 1 : 1);
        
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        
        let prevX = -1;
        let prevY = -1;

        stats.trendData.forEach((d, i) => {
          // X position
          const x = chartX + (i * stepX);
          // Height of the point
          const plotHeight = chartHeight - 10;
          const y = chartY + chartHeight - ((d.count / maxCount) * plotHeight);
          
          // Draw line from previous point
          if (prevX !== -1 && prevY !== -1) {
             pdf.setDrawColor(124, 58, 237); // violet-600
             pdf.setLineWidth(1.5);
             pdf.line(prevX, prevY, x, y);
          }
          
          prevX = x;
          prevY = y;
        });

        // Draw points and labels on top
        stats.trendData.forEach((d, i) => {
          const x = chartX + (i * stepX);
          const plotHeight = chartHeight - 10;
          const y = chartY + chartHeight - ((d.count / maxCount) * plotHeight);
          
          // Draw point circle
          pdf.setFillColor(255, 255, 255);
          pdf.setDrawColor(124, 58, 237);
          pdf.setLineWidth(1);
          pdf.circle(x, y, 1.5, 'FD'); // Fill and Stroke
          
          // Value label above point
          if (d.count > 0) {
            pdf.text(String(d.count), x, y - 3, { align: 'center' });
          }
          
          // X axis label
          const label = d.label;
          pdf.text(label, x, chartY + chartHeight + 5, { align: 'center', maxWidth: stepX + 5 });
        });
        
        // Y axis labels
        pdf.setTextColor(100, 100, 100);
        pdf.text(String(maxCount), chartX - 3, chartY + 10, { align: 'right' });
        pdf.text(String(Math.round(maxCount / 2)), chartX - 3, chartY + 10 + ((chartHeight - 10) / 2), { align: 'right' });
        pdf.text('0', chartX - 3, chartY + chartHeight, { align: 'right' });
        pdf.setTextColor(0, 0, 0); // reset
      }
      
      const fileName = `Analisis_Penjualan_${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}.pdf`;
      
      pdf.save(fileName);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert('Gagal mengunduh PDF: ' + (error?.message || String(error)));
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  /* ── Aggregations ── */
  const stats = useMemo(() => {
    const lunas    = participants.filter(p => p.status_pembayaran === 'Lunas');
    const pending  = participants.filter(p => p.status_pembayaran !== 'Lunas');

    const totalTiket = participants.reduce((s, p) => s + (p.jumlah_tiket || 1), 0);
    const totalLunasTiket = lunas.reduce((s, p) => s + (p.jumlah_tiket || 1), 0);
    const totalPendingTiket = pending.reduce((s, p) => s + (p.jumlah_tiket || 1), 0);

    const pendapatanLunas = lunas.reduce((s, p) => {
      return s + getHarga(p.jenis_tiket) * (p.jumlah_tiket || 1);
    }, 0);

    const pendapatanPotensi = pending.reduce((s, p) => {
      return s + getHarga(p.jenis_tiket) * (p.jumlah_tiket || 1);
    }, 0);

    const konversiRate = totalTiket > 0 ? ((totalLunasTiket / totalTiket) * 100).toFixed(1) : '0';

    /* Per jenis tiket */
    const byJenis: Record<string, { count: number; tiket: number; lunas: number; pendapatan: number }> = {};
    participants.forEach(p => {
      const j = normalizeJenis(p.jenis_tiket);
      if (!byJenis[j]) byJenis[j] = { count: 0, tiket: 0, lunas: 0, pendapatan: 0 };
      byJenis[j].count++;
      byJenis[j].tiket  += p.jumlah_tiket || 0;
      if (p.status_pembayaran === 'Lunas') {
        byJenis[j].lunas      += p.jumlah_tiket || 0;
        byJenis[j].pendapatan += getHarga(p.jenis_tiket) * (p.jumlah_tiket || 0);
      }
    });

    /* Per metode pembayaran */
    const byMetode: Record<string, { count: number; lunas: number }> = {};
    participants.forEach(p => {
      const m = p.metode_pembayaran || 'Lainnya';
      if (!byMetode[m]) byMetode[m] = { count: 0, lunas: 0 };
      byMetode[m].count += (p.jumlah_tiket || 1);
      if (p.status_pembayaran === 'Lunas') byMetode[m].lunas += (p.jumlah_tiket || 1);
    });

    /* Per Sumber Info */
    const bySumber: Record<string, number> = {};
    let totalSumberResponses = 0;
    participants.forEach(p => {
      if (p.sumber_info && Array.isArray(p.sumber_info)) {
        p.sumber_info.forEach((s: string) => {
          const trimmed = s.trim();
          if (trimmed) {
            if (!bySumber[trimmed]) bySumber[trimmed] = 0;
            bySumber[trimmed]++;
            totalSumberResponses++;
          }
        });
      } else if (typeof p.sumber_info === 'string') {
        const sources = (p.sumber_info as string).split(',').map(s => s.trim()).filter(Boolean);
        sources.forEach(s => {
          if (!bySumber[s]) bySumber[s] = 0;
          bySumber[s]++;
          totalSumberResponses++;
        });
      }
    });

    /* Tren (Harian/Mingguan/Bulanan) */
    const now    = Date.now();
    const oneDay = 86400000;
    
    let trendData: { label: string; count: number; revenue: number }[] = [];
    
    if (timeFilter === 'harian') {
      trendData = Array.from({ length: 7 }, (_, i) => {
        const d     = new Date(now - (6 - i) * oneDay);
        const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
        
        let count = 0;
        let revenue = 0;
        
        participants.forEach(p => {
          if (!p.created_at) return;
          const t = new Date(p.created_at).getTime();
          if (t >= d.setHours(0, 0, 0, 0) && t < d.setHours(23, 59, 59, 999)) {
            count += (p.jumlah_tiket || 1);
            if (p.status_pembayaran === 'Lunas') {
              revenue += getHarga(p.jenis_tiket) * (p.jumlah_tiket || 1);
            }
          }
        });

        return { label, count, revenue };
      });
    } else if (timeFilter === 'mingguan') {
      trendData = Array.from({ length: 4 }, (_, i) => {
        const dEnd = new Date(now - (3 - i) * 7 * oneDay);
        const dStart = new Date(dEnd.getTime() - 6 * oneDay);
        const label = `Minggu ke-${i+1}`;
        
        let count = 0;
        let revenue = 0;
        
        participants.forEach(p => {
          if (!p.created_at) return;
          const t = new Date(p.created_at).getTime();
          if (t >= dStart.setHours(0, 0, 0, 0) && t <= dEnd.setHours(23, 59, 59, 999)) {
            count += (p.jumlah_tiket || 1);
            if (p.status_pembayaran === 'Lunas') {
              revenue += getHarga(p.jenis_tiket) * (p.jumlah_tiket || 1);
            }
          }
        });

        return { label, count, revenue };
      });
    } else {
      trendData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        const label = d.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        
        let count = 0;
        let revenue = 0;
        
        participants.forEach(p => {
          if (!p.created_at) return;
          const pt = new Date(p.created_at);
          if (pt.getMonth() === d.getMonth() && pt.getFullYear() === d.getFullYear()) {
            count += (p.jumlah_tiket || 1);
            if (p.status_pembayaran === 'Lunas') {
              revenue += getHarga(p.jenis_tiket) * (p.jumlah_tiket || 1);
            }
          }
        });

        return { label, count, revenue };
      });
    }

    const maxTrend = Math.max(...trendData.map(d => d.count), 1);

    return {
      total: totalTiket,
      lunas: totalLunasTiket,
      pending: totalPendingTiket,
      totalTiket,
      totalLunasTiket,
      pendapatanLunas,
      pendapatanPotensi,
      konversiRate,
      byJenis,
      byMetode,
      bySumber,
      totalSumberResponses,
      trendData,
      maxTrend,
    };
  }, [participants, timeFilter]);

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="min-h-full pb-10">
      {/* Desktop top bar */}
      <div
        className="hidden md:flex sticky top-0 z-20 items-center justify-between border-b border-white/5 px-6 h-14"
        style={{ background: 'rgba(13,11,31,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-400" />
          <h1 className="text-white font-semibold text-sm tracking-wide">Analisis Penjualan</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadPDF}
            disabled={isDownloading}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-2 text-xs font-medium disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isDownloading ? 'Memproses...' : 'Download PDF'}</span>
          </button>
          <button
            onClick={fetchData}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition flex items-center gap-2 text-xs font-medium"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-8 w-full max-w-[1600px] mx-auto space-y-6">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
            <p className="text-white/40 text-sm font-medium animate-pulse">Memproses analitik penjualan...</p>
          </div>
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                label="Pendapatan Bersih"
                value={currency(stats.pendapatanLunas)}
                sub={`${stats.lunas} pendaftar sudah lunas`}
                icon={<CreditCard className="w-5 h-5 text-white" />}
                color="linear-gradient(135deg, #10b981, #047857)"
              />
              <SummaryCard
                label="Potensi Pendapatan"
                value={currency(stats.pendapatanPotensi)}
                sub={`Dari ${stats.pending} pendaftar pending`}
                icon={<Activity className="w-5 h-5 text-white" />}
                color="linear-gradient(135deg, #f59e0b, #d97706)"
              />
              <SummaryCard
                label="Tingkat Konversi"
                value={`${stats.konversiRate}%`}
                sub={`Rasio Lunas vs Total (${stats.total})`}
                icon={<PieChart className="w-5 h-5 text-white" />}
                color="linear-gradient(135deg, #8b5cf6, #6d28d9)"
              />
              <SummaryCard
                label="Total Tiket Terjual"
                value={String(stats.totalLunasTiket)}
                sub={`Dari total ${stats.totalTiket} tiket dipesan`}
                icon={<Ticket className="w-5 h-5 text-white" />}
                color="linear-gradient(135deg, #0ea5e9, #0369a1)"
              />
            </div>

            <div id="pdf-charts" className="space-y-4 sm:space-y-6">
              {/* ── Middle Row: Daily Trend & Sumber Info ── */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Trend Harian */}
              <div className="lg:col-span-2 rounded-2xl border border-white/5 p-5 sm:p-6 bg-white/[0.02]">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-500/20 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-violet-400" />
                    </div>
                    <div>
                      <h2 className="text-white font-semibold">Tren Pendaftaran</h2>
                      <p className="text-white/40 text-xs mt-0.5">Pertumbuhan peserta</p>
                    </div>
                  </div>
                  <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as any)}
                    className="bg-[#1a1535] border border-white/10 text-white/80 text-xs rounded-lg px-2 py-1.5 outline-none focus:border-violet-500/50 cursor-pointer"
                  >
                    <option value="harian">7 Hari Terakhir</option>
                    <option value="mingguan">4 Minggu Terakhir</option>
                    <option value="bulanan">6 Bulan Terakhir</option>
                  </select>
                </div>
                
                <div className="relative h-48 mt-8 mb-6">
                  {/* SVG Chart Background */}
                  <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
                    <defs>
                      <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(124, 58, 237, 0.4)" />
                        <stop offset="100%" stopColor="rgba(124, 58, 237, 0)" />
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                    <line x1="0" y1="100" x2="100" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                    
                    {(() => {
                      if (stats.trendData.length === 0) return null;
                      const points = stats.trendData.map((d, i) => {
                        const x = (i / (stats.trendData.length - 1)) * 100;
                        const y = 100 - (stats.maxTrend > 0 ? (d.count / stats.maxTrend) * 100 : 0);
                        return `${x},${y}`;
                      }).join(' ');
                      
                      const areaPoints = `0,100 ${points} 100,100`;
                      
                      return (
                        <>
                          <polyline points={areaPoints} fill="url(#lineGrad)" />
                          <polyline points={points} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </>
                      );
                    })()}
                  </svg>
                  
                  {/* Interactive Points */}
                  <div className="absolute inset-0">
                    {stats.trendData.map((d, i) => {
                      const xPct = (i / (stats.trendData.length - 1)) * 100;
                      const yPct = 100 - (stats.maxTrend > 0 ? (d.count / stats.maxTrend) * 100 : 0);
                      const tooltipClass = i === 0 ? "items-start" : i === stats.trendData.length - 1 ? "items-end" : "items-center";
                      
                      return (
                        <div key={d.label} className="absolute h-full group cursor-pointer z-10" style={{ width: '10%', left: `calc(${xPct}% - 5%)` }}>
                          
                          <div className={`absolute opacity-0 group-hover:opacity-100 transition-opacity flex flex-col ${tooltipClass} -top-12 z-20 pointer-events-none w-32`} style={{ left: '50%', transform: 'translateX(-50%)' }}>
                            <span className="text-emerald-400 text-[10px] font-bold whitespace-nowrap bg-[#1a1535] px-2 py-0.5 rounded-t-md border border-white/10 border-b-0 hidden sm:block shadow-xl">
                              {currency(d.revenue)}
                            </span>
                            <span className="text-white font-bold text-xs bg-[#1a1535] px-2 py-1 rounded-b-md rounded-t-md sm:rounded-t-none border border-white/10 shadow-xl whitespace-nowrap text-center">
                              {d.count} tiket
                            </span>
                          </div>
                          
                          <div className="absolute w-full h-full border-x border-white/0 group-hover:border-white/5 bg-white/0 group-hover:bg-white/[0.02] transition-colors" />
                          
                          <div 
                            className="absolute w-3 h-3 bg-[#1a1535] border-[2.5px] border-violet-400 rounded-full group-hover:scale-150 group-hover:bg-violet-400 transition-all duration-300 z-10 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                            style={{ top: `calc(${yPct}% - 6px)`, left: 'calc(50% - 6px)' }}
                          />
                          
                          <div className="absolute -bottom-6 w-full text-center text-white/40 text-[10px] sm:text-xs font-medium whitespace-nowrap">
                            {d.label.split(',')[0]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sumber Info */}
              <div className="rounded-2xl border border-white/5 p-5 sm:p-6 bg-white/[0.02] flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-pink-500/20 rounded-lg">
                    <Megaphone className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">Sumber Info</h2>
                    <p className="text-white/40 text-xs mt-0.5">Performa kanal marketing</p>
                  </div>
                </div>

                {Object.keys(stats.bySumber).length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-white/30 text-sm">Belum ada data sumber info.</p>
                  </div>
                ) : (
                  <div className="space-y-5 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {Object.entries(stats.bySumber)
                      .sort((a, b) => b[1] - a[1])
                      .map(([sumber, count]) => {
                        const pct = stats.totalSumberResponses > 0 ? (count / stats.totalSumberResponses) * 100 : 0;
                        return (
                          <div key={sumber}>
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-white/90 text-sm font-medium">{sumber}</span>
                              <div className="text-right">
                                <span className="text-white font-bold text-sm">{count}</span>
                                <span className="text-white/40 text-[10px] ml-1">({pct.toFixed(0)}%)</span>
                              </div>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                  width: `${pct}%`,
                                  background: 'linear-gradient(90deg, #ec4899, #be185d)'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

            </div>

            {/* ── Bottom Row: Ticket Types, Payment Methods, and Payment Status ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              
              {/* Jenis Tiket */}
              <div className="rounded-2xl border border-white/5 p-5 sm:p-6 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Ticket className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">Performa Jenis Tiket</h2>
                    <p className="text-white/40 text-xs mt-0.5">Pendapatan & popularitas tiket</p>
                  </div>
                </div>

                {Object.keys(stats.byJenis).length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-6">Belum ada data</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(stats.byJenis)
                      .sort((a, b) => b[1].pendapatan - a[1].pendapatan)
                      .map(([jenis, d]) => {
                        const pct = stats.totalTiket > 0 ? (d.tiket / stats.totalTiket) * 100 : 0;
                        return (
                          <div key={jenis} className="group">
                            <div className="flex items-start justify-between mb-2 gap-4">
                              <div>
                                <h3 className="text-white font-semibold">{jenis}</h3>
                                <p className="text-white/40 text-xs mt-0.5">{d.count} pendaftar &middot; {d.tiket} tiket dipesan</p>
                              </div>
                              <div className="text-right">
                                <p className="text-emerald-400 font-bold">{currency(d.pendapatan)}</p>
                                <p className="text-white/40 text-xs mt-0.5">{d.lunas} lunas</p>
                              </div>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
                              <div
                                className="absolute top-0 left-0 h-full rounded-full transition-all duration-1000"
                                style={{
                                  width: `${pct}%`,
                                  background: 'linear-gradient(90deg, #3b82f6, #2563eb)'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Metode Pembayaran */}
              <div className="rounded-2xl border border-white/5 p-5 sm:p-6 bg-white/[0.02]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">Metode Pembayaran</h2>
                    <p className="text-white/40 text-xs mt-0.5">Preferensi transaksi peserta</p>
                  </div>
                </div>

                {Object.keys(stats.byMetode).length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-6">Belum ada data</p>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(stats.byMetode)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([metode, d]) => {
                        const pct = stats.total > 0 ? (d.count / stats.total) * 100 : 0;
                        const lunasPct = d.count > 0 ? Math.round((d.lunas / d.count) * 100) : 0;
                        return (
                          <div key={metode}>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-white font-medium">{metode}</h3>
                                <p className="text-white/40 text-xs mt-0.5">{d.count} tiket dipesan</p>
                              </div>
                              <div className="text-right">
                                <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-1 rounded-md font-semibold border border-emerald-500/20">
                                  {lunasPct}% Lunas
                                </span>
                              </div>
                            </div>
                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-1000"
                                style={{
                                  width: `${pct}%`,
                                  background: 'linear-gradient(90deg, #10b981, #059669)'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Status Pembayaran (Pie Chart) */}
              <div className="rounded-2xl border border-white/5 p-5 sm:p-6 bg-white/[0.02] flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <PieChart className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">Status Pembayaran</h2>
                    <p className="text-white/40 text-xs mt-0.5">Proporsi Lunas vs Pending</p>
                  </div>
                </div>

                {stats.total === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-white/30 text-sm">Belum ada data</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center flex-1 w-full relative">
                    <div className="relative w-40 h-40">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        {/* Background Circle (Pending) */}
                        <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="12" />
                        {/* Foreground Circle (Lunas) */}
                        <circle 
                          cx="50" cy="50" r="40" 
                          fill="transparent" 
                          stroke="#10b981" 
                          strokeWidth="12" 
                          strokeDasharray={`${(stats.lunas / stats.total) * 251.2} 251.2`} 
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-white font-bold text-2xl">{stats.konversiRate}%</span>
                        <span className="text-white/40 text-xs">Lunas</span>
                      </div>
                    </div>

                    <div className="w-full mt-8 space-y-3 px-2">
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                          <span className="text-white/80 font-medium">Lunas</span>
                        </div>
                        <span className="text-white font-bold">{stats.lunas} <span className="text-white/30 text-xs font-normal">tiket</span></span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-500/50"></div>
                          <span className="text-white/80 font-medium">Pending</span>
                        </div>
                        <span className="text-white font-bold">{stats.pending} <span className="text-white/30 text-xs font-normal">tiket</span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataPenjualan;
