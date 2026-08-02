import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { RTParticipant } from '../types';
import {
  Loader2, TrendingUp, CreditCard, Users,
  CheckCircle2, Clock, Ticket, RefreshCw,
} from 'lucide-react';

import { currency, getHarga } from '../utils';
/* ── Helpers ─────────────────────────────────────────────── */
function normalizeJenis(jenis: string): string {
  if (!jenis) return 'Lainnya';
  const lower = jenis.toLowerCase();
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
  <div
    className="rounded-2xl p-4 sm:p-5 border border-white/5"
    style={{ background: 'rgba(255,255,255,0.04)' }}
  >
    <div className="flex items-start gap-3">
      <div
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-white/50 text-xs font-medium">{label}</p>
        <p className="text-white text-xl sm:text-2xl font-bold leading-tight mt-0.5 truncate">{value}</p>
        {sub && <p className="text-white/30 text-xs mt-0.5">{sub}</p>}
      </div>
    </div>
  </div>
);

/* ── Main ────────────────────────────────────────────────── */
const DataPenjualan: React.FC = () => {
  const [participants, setParticipants] = useState<RTParticipant[]>([]);
  const [loading, setLoading]           = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('rt_participants')
      .select('*')
      .order('created_at', { ascending: false });
    setParticipants(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* ── Aggregations ── */
  const stats = useMemo(() => {
    const lunas    = participants.filter(p => p.status_pembayaran === 'Lunas');
    const pending  = participants.filter(p => p.status_pembayaran !== 'Lunas');

    const totalTiket = participants.reduce((s, p) => s + (p.jumlah_tiket || 0), 0);
    const totalLunasTiket = lunas.reduce((s, p) => s + (p.jumlah_tiket || 0), 0);

    const pendapatanLunas = lunas.reduce((s, p) => {
      return s + getHarga(p.jenis_tiket) * (p.jumlah_tiket || 0);
    }, 0);

    const pendapatanPotensi = participants.reduce((s, p) => {
      return s + getHarga(p.jenis_tiket) * (p.jumlah_tiket || 0);
    }, 0);

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
      byMetode[m].count++;
      if (p.status_pembayaran === 'Lunas') byMetode[m].lunas++;
    });

    /* Harian (7 hari terakhir) */
    const now    = Date.now();
    const oneDay = 86400000;
    const daily: { label: string; count: number }[] = Array.from({ length: 7 }, (_, i) => {
      const d     = new Date(now - (6 - i) * oneDay);
      const label = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
      const count = participants.filter(p => {
        if (!p.created_at) return false;
        const t = new Date(p.created_at).getTime();
        return t >= d.setHours(0, 0, 0, 0) && t < d.setHours(23, 59, 59, 999);
      }).length;
      return { label, count };
    });

    const maxDaily = Math.max(...daily.map(d => d.count), 1);

    return {
      total: participants.length,
      lunas: lunas.length,
      pending: pending.length,
      totalTiket,
      totalLunasTiket,
      pendapatanLunas,
      pendapatanPotensi,
      byJenis,
      byMetode,
      daily,
      maxDaily,
    };
  }, [participants]);

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="min-h-full">
      {/* Desktop top bar */}
      <div
        className="hidden md:flex sticky top-0 z-20 items-center justify-between border-b border-white/5 px-6 h-14"
        style={{ background: 'rgba(13,11,31,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          <h1 className="text-white font-semibold text-sm">Data Penjualan</h1>
        </div>
        <button
          onClick={fetchData}
          className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 w-full max-w-[1600px] mx-auto">

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
            <p className="text-white/30 text-sm">Memuat data penjualan...</p>
          </div>
        ) : (
          <>
            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <SummaryCard
                label="Total Pendapatan"
                value={currency(stats.pendapatanLunas)}
                sub={`Potensi ${currency(stats.pendapatanPotensi)}`}
                icon={<CreditCard className="w-5 h-5 text-white" />}
                color="linear-gradient(135deg,#7c3aed,#4f46e5)"
              />
              <SummaryCard
                label="Sudah Lunas"
                value={String(stats.lunas)}
                sub={`${stats.totalLunasTiket} tiket terbayar`}
                icon={<CheckCircle2 className="w-5 h-5 text-white" />}
                color="linear-gradient(135deg,#059669,#10b981)"
              />
              <SummaryCard
                label="Pending"
                value={String(stats.pending)}
                sub={`${stats.totalTiket - stats.totalLunasTiket} tiket belum bayar`}
                icon={<Clock className="w-5 h-5 text-white" />}
                color="linear-gradient(135deg,#d97706,#f59e0b)"
              />
              <SummaryCard
                label="Total Tiket"
                value={String(stats.totalTiket)}
                sub={`dari ${stats.total} pendaftar`}
                icon={<Ticket className="w-5 h-5 text-white" />}
                color="linear-gradient(135deg,#0891b2,#06b6d4)"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 mb-5">

              {/* ── Per Jenis Tiket ── */}
              <div
                className="rounded-2xl border border-white/5 p-4 sm:p-5"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Ticket className="w-4 h-4 text-violet-400" />
                  <h2 className="text-white font-semibold text-sm">Penjualan per Jenis Tiket</h2>
                </div>
                {Object.keys(stats.byJenis).length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-6">Belum ada data</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.byJenis)
                      .sort((a, b) => b[1].pendapatan - a[1].pendapatan)
                      .map(([jenis, d]) => {
                        const pct = stats.totalTiket > 0 ? (d.tiket / stats.totalTiket) * 100 : 0;
                        return (
                          <div key={jenis}>
                            <div className="flex items-center justify-between mb-1.5 gap-2">
                              <div className="min-w-0">
                                <span className="text-white text-sm font-medium truncate block">
                                  {jenis} {getHarga(jenis) > 0 && <span className="text-white/50 font-normal">({currency(getHarga(jenis))})</span>}
                                </span>
                                <span className="text-white/40 text-xs">
                                  {d.count} pendaftar · {d.tiket} tiket
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-emerald-400 text-sm font-semibold">
                                  {currency(d.pendapatan)}
                                </p>
                                <p className="text-white/30 text-xs">{d.lunas} lunas</p>
                              </div>
                            </div>
                            {/* Progress bar */}
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: 'linear-gradient(90deg, #7c3aed, #4f46e5)',
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* ── Per Metode Pembayaran ── */}
              <div
                className="rounded-2xl border border-white/5 p-4 sm:p-5"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-white font-semibold text-sm">Metode Pembayaran</h2>
                </div>
                {Object.keys(stats.byMetode).length === 0 ? (
                  <p className="text-white/30 text-sm text-center py-6">Belum ada data</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(stats.byMetode)
                      .sort((a, b) => b[1].count - a[1].count)
                      .map(([metode, d]) => {
                        const pct     = stats.total > 0 ? (d.count / stats.total) * 100 : 0;
                        const lunasPct = d.count > 0 ? Math.round((d.lunas / d.count) * 100) : 0;
                        return (
                          <div key={metode}>
                            <div className="flex items-center justify-between mb-1.5 gap-2">
                              <div className="min-w-0">
                                <span className="text-white text-sm font-medium truncate block">{metode}</span>
                                <span className="text-white/40 text-xs">{d.count} transaksi</span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-white text-sm font-semibold">{lunasPct}%</p>
                                <p className="text-white/30 text-xs">lunas</p>
                              </div>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${pct}%`,
                                  background: 'linear-gradient(90deg, #059669, #10b981)',
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

            {/* ── Grafik Pendaftaran 7 Hari ── */}
            <div
              className="rounded-2xl border border-white/5 p-4 sm:p-5"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex items-center gap-2 mb-5">
                <Users className="w-4 h-4 text-cyan-400" />
                <h2 className="text-white font-semibold text-sm">Pendaftaran 7 Hari Terakhir</h2>
              </div>
              <div className="flex items-end gap-2 sm:gap-3 h-28">
                {stats.daily.map(({ label, count }) => {
                  const heightPct = (count / stats.maxDaily) * 100;
                  return (
                    <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
                      <span className="text-white/60 text-xs font-semibold">
                        {count > 0 ? count : ''}
                      </span>
                      <div className="w-full rounded-t-lg overflow-hidden" style={{ height: '80px' }}>
                        <div
                          className="w-full rounded-t-lg transition-all duration-700"
                          style={{
                            height: count > 0 ? `${heightPct}%` : '4px',
                            background: count > 0
                              ? 'linear-gradient(to top, #4f46e5, #7c3aed)'
                              : 'rgba(255,255,255,0.05)',
                            marginTop: `${100 - (count > 0 ? heightPct : 5)}%`,
                          }}
                        />
                      </div>
                      <span className="text-white/30 text-[10px] text-center leading-tight hidden sm:block">
                        {label.split(',')[0]}
                      </span>
                      <span className="text-white/30 text-[10px] text-center leading-tight sm:hidden">
                        {label.split(' ')[0]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DataPenjualan;
