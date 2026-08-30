import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { RTParticipant } from '../types';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { v4 as uuidv4 } from 'uuid';
import { formatTicketCode, currency, getHarga } from '../utils';

import {
  Download, Search, CheckCircle2, RefreshCw, Loader2,
  Upload, Filter, X, ChevronDown, ExternalLink,
  ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet,
  Users, CreditCard, CheckSquare, AlertCircle, MoreHorizontal,
  MessageCircle, Trash2, Pencil, Save, ChevronLeft, ChevronRight,
  Bell, User
} from 'lucide-react';

/* â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
type SortField = 'created_at' | 'nama_lengkap' | 'id';
type SortDir   = 'asc' | 'desc';

interface ImportPreview {
  rows: Partial<RTParticipant>[];
  fileName: string;
  rejectedDetails?: { name: string; reason: string }[];
}

/* â”€â”€â”€ Debounce hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}


/* â”€â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const StatCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  chartPlaceholder?: boolean;
}> = ({ label, value, icon, color, chartPlaceholder }) => (
  <div
    className="rounded-2xl p-4 sm:p-5 flex items-center justify-between border border-white/5 relative overflow-hidden group"
    style={{ background: '#1c172e' }}
  >
    <div className="flex items-center gap-3 sm:gap-4 relative z-10">
      <div
        className="w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
        style={{ background: color }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-white/60 text-[10px] sm:text-sm font-medium truncate mb-0.5 sm:mb-1">{label}</p>
        <p className="text-white text-xl sm:text-3xl font-bold leading-tight">{value}</p>
      </div>
    </div>
    {chartPlaceholder && (
      <div className="absolute -right-2 sm:right-4 bottom-0 opacity-30 sm:opacity-40 pointer-events-none">
        <svg width="60" height="30" viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[80px] sm:h-[40px]">
          <path d="M0 40L15 25L30 32L50 15L65 20L80 0V40H0Z" fill="url(#paint0_linear)" fillOpacity="0.5"/>
          <path d="M0 40L15 25L30 32L50 15L65 20L80 0" stroke={color.includes('emerald') || color.includes('#059669') ? '#10b981' : color.includes('violet') || color.includes('#7c3aed') ? '#7c3aed' : color.includes('orange') || color.includes('#d97706') ? '#f59e0b' : '#06b6d4'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <defs>
            <linearGradient id="paint0_linear" x1="40" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor={color.includes('emerald') || color.includes('#059669') ? '#10b981' : color.includes('violet') || color.includes('#7c3aed') ? '#7c3aed' : color.includes('orange') || color.includes('#d97706') ? '#f59e0b' : '#06b6d4'} />
              <stop offset="1" stopColor="#1c172e" stopOpacity="0"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    )}
  </div>
);

/* â”€â”€â”€ Mobile Participant Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

function validatePhoneNumber(phone: string): { isValid: boolean; message: string; color: string } {
  if (!phone) return { isValid: false, message: 'Kosong', color: 'text-red-400 bg-red-500/15 border-red-500/30' };
  const clean = phone.replace(/[-+ ]/g, '');
  if (!/^\d+$/.test(clean)) return { isValid: false, message: 'Ada huruf/simbol', color: 'text-red-400 bg-red-500/15 border-red-500/30' };
  if (!clean.startsWith('08') && !clean.startsWith('628')) return { isValid: false, message: 'Awalan salah', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' };
  if (clean.length < 10) return { isValid: false, message: 'Terlalu pendek', color: 'text-red-400 bg-red-500/15 border-red-500/30' };
  if (clean.length > 15) return { isValid: false, message: 'Terlalu panjang', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' };
  return { isValid: true, message: 'Valid', color: 'text-green-400 bg-green-500/15 border-green-500/30' };
}

const ParticipantCard: React.FC<{
  p: RTParticipant;
  index: number;
  onDetail: () => void;
  onToggle: () => void;
  onWa: () => void;
  onWaKonfirmasi: () => void;
  onToggleWa: () => void;
  onDelete: () => void;
  showCheckin?: boolean;
}> = ({ p, index, onDetail, onToggle, onWa, onWaKonfirmasi, onToggleWa, onDelete, showCheckin }) => {
  const isLunas = p.status_pembayaran === 'Lunas';
  const checkinPct = ((p.jumlah_checkin || 0) / (p.jumlah_tiket || 1)) * 100;
  const waValidation = validatePhoneNumber(p.no_whatsapp || '');

  return (
    <div
      className="rounded-2xl border border-white/5 p-4 mb-3"
      style={{ background: '#1c172e' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0 flex items-start gap-3">
          <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-white/5 text-white/40 text-xs font-bold border border-white/10 mt-0.5">
            {index}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">
              {p.nama_lengkap} <span className="text-white/40 font-normal ml-1">({p.jenis_tiket})</span>
            </p>
            <p className="text-xs text-white/40 truncate mt-0.5">{p.email}</p>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-xs text-white/30">{p.no_whatsapp}</p>
              <span className={`w-fit text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 font-medium ${waValidation.color}`}>
                {!waValidation.isValid && <AlertCircle className="w-2.5 h-2.5" />}
                {waValidation.message}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
            isLunas
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
          }`}
        >
          {isLunas ? <CheckCircle2 className="w-3 h-3" /> : <Loader2 className="w-3 h-3" />}
          {p.status_pembayaran}
        </span>
      </div>

      {/* Details row */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <span className="text-xs px-2 py-0.5 rounded-md text-violet-300 border border-violet-500/30 bg-violet-500/10 font-medium">
          {p.jenis_tiket} {getHarga(p.jenis_tiket || '') > 0 && <span className="text-violet-400/70 font-normal">({currency(getHarga(p.jenis_tiket || ''))})</span>}
        </span>
        <span className="text-xs text-white/40">{p.jumlah_tiket} tiket</span>
        <span className="text-xs text-white/40">{p.metode_pembayaran}</span>
        {p.created_at && (
          <span className="text-xs text-white/30">
            {new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>

      {/* Check-in bar */}
      {showCheckin && (
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-white/40 w-16 flex-shrink-0">Check-in</span>
          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${checkinPct}%` }}
            />
          </div>
          <span className="text-xs text-white/50 flex-shrink-0">
            {p.jumlah_checkin ?? 0}/{p.jumlah_tiket}
          </span>
        </div>
      )}

      {/* Actions row */}
      <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-white/5">
        <button
          onClick={onDetail}
          className="flex items-center gap-1.5 text-xs text-violet-300 bg-violet-500/20 hover:bg-violet-500/30 transition px-2.5 h-[30px] rounded-lg border border-violet-500/30 font-medium"
        >
          <Pencil className="w-3.5 h-3.5 fill-current" />
          <span>Ubah</span>
        </button>
        <a
          href={`/t/${p.id}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 transition px-2.5 h-[30px] rounded-lg border border-cyan-500/30 font-medium box-border"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>E-Tiket</span>
        </a>
        <button
          onClick={onToggleWa}
          className={`flex items-center gap-1.5 text-xs font-medium transition px-2.5 h-[30px] rounded-lg border ${p.status_wa ? 'text-green-300 bg-green-500/20 border-green-500/30 hover:bg-green-500/30' : 'text-orange-300 bg-orange-500/20 border-orange-500/30 hover:bg-orange-500/30'}`}
        >
          {p.status_wa ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          <span>{p.status_wa ? 'WA Terkirim' : 'Belum WA'}</span>
        </button>
        <button
          onClick={onWaKonfirmasi}
          className="flex items-center gap-1.5 text-xs font-medium transition px-2.5 h-[30px] rounded-lg border text-sky-300 bg-sky-500/20 border-sky-500/30 hover:bg-sky-500/30"
          title="Kirim Konfirmasi WA"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Konfirmasi</span>
        </button>
        <button
          onClick={onWa}
          className="flex items-center gap-1.5 text-xs font-medium transition px-2.5 h-[30px] rounded-lg border text-emerald-300 bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30"
          title="Kirim Pesan WA"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Kirim</span>
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-xs text-red-300 bg-red-500/20 hover:bg-red-500/30 transition px-2.5 h-[30px] rounded-lg border border-red-500/30 font-medium"
          title="Hapus Data"
        >
          <Trash2 className="w-3.5 h-3.5 fill-current" />
          <span>Hapus</span>
        </button>
        {p.bukti_transfer_url && (
          <a
            href={p.bukti_transfer_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-blue-300 bg-blue-500/20 hover:bg-blue-500/30 transition px-2.5 h-[30px] rounded-lg border border-blue-500/30 font-medium box-border"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Bukti</span>
          </a>
        )}
        {!isLunas && (
          <button
            onClick={onToggle}
            className={`ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Main Component ───────────────────────────────────────────────── */
const AdminDashboard: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [participants, setParticipants] = useState<RTParticipant[]>([]);
  const [loading, setLoading]           = useState(true);
  const [importLoading, setImportLoading] = useState(false);

  /* ── Filter & Sort state ────────────────────────────────────────── */
  const [searchInput, setSearchInput]   = useState('');
  const searchTerm = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab]       = useState<'Semua' | 'Terverifikasi' | 'Belum Lunas' | 'Sudah Hadir' | 'Belum Kirim WA' | 'Sudah Kirim WA' | 'Duplikat'>('Semua');
  const [filterTiket, setFilterTiket]   = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [sortField, setSortField]       = useState<SortField>('created_at');
  const [sortDir, setSortDir]           = useState<SortDir>('desc');

  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [openActionId, setOpenActionId] = useState<string | null>(null);
  
  /* ── Notification & Session state ───────────────────────────────── */
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasReadNotifications, setHasReadNotifications] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  /* ── Pagination state ───────────────────────────────────────────── */
  const [currentPage, setCurrentPage]   = useState(1);
  const itemsPerPage = 20;

  useEffect(() => { setCurrentPage(1); }, [searchTerm, activeTab, filterTiket, filterGender, sortField, sortDir]);

  /* ── Modal state ────────────────────────────────────────────────── */
  const [importPreview, setImportPreview]       = useState<ImportPreview | null>(null);
  const [importError, setImportError]           = useState('');
  const [importSummary, setImportSummary]       = useState<{ 
    new: number, 
    updated: number, 
    total: number, 
    newNames: string[], 
    updatedDetails: { name: string, changes: string[] }[], 
    rejected: number,
    rejectedDetails?: { name: string, reason: string }[],
    skippedDetails?: { name: string, reason: string }[] 
  } | null>(null);
  const [summaryTab, setSummaryTab]             = useState<'baru' | 'diperbarui' | 'dilewati' | 'ditolak'>('diperbarui');
  const [detailParticipant, setDetailParticipant] = useState<RTParticipant | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateParticipant = async () => {
    if (!detailParticipant?.id) return;
    setIsSaving(true);
    const { id, created_at, barcode, ...updateData } = detailParticipant;
    const { error } = await supabase
      .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id);
    setIsSaving(false);
    if (error) {
      alert(`Gagal menyimpan: ${error.message}`);
    } else {
      setDetailParticipant(null);
      fetchParticipants();
    }
  };


  /* ── Fetch ────────────────────────────────────────────────────────── */
  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching:', error);
    else setParticipants(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { 
    fetchParticipants(); 
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, [fetchParticipants]);

  /* ── Toggle Status ────────────────────────────────────────────────── */
  const toggleStatus = useCallback(async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Pending' ? 'Lunas' : 'Pending';
    const { error } = await supabase
      .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
      .update({ status_pembayaran: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) fetchParticipants();
  }, [fetchParticipants]);

  const sendWhatsApp = useCallback(async (p: RTParticipant) => {
    const ticketUrl = `${window.location.origin}/t/${p.id}`;
    const ticketCode = formatTicketCode(p.barcode || p.id || '');
    const message = `Halo Kak *${p.nama_lengkap}*!\n\nTerimakasih banyak telah mendaftar di acara Kajian Parenting & Healing Class Bersama Dr. Aisa Dahlan. Kami sangat antusias menyambut kehadiran kakak!\n\nBerikut adalah rincian E-Tiket Kakak:\n\n*Nomor Tiket:* ${ticketCode}\n*Kategori Tiket:* ${p.jenis_tiket}\n*Jumlah Tiket:* ${p.jumlah_tiket} Orang\n*Waktu:* Kamis, 3 Sept 2026 (08.00 - 12.00 WITA)\n*Lokasi:* Hotel Zahra Syariah, Kendari\n\n*Link E-Tiket:* \n${ticketUrl}\n\nMohon siapkan dan tunjukkan barcode yang ada di link tersebut kepada panitia saat registrasi ulang ya.\n\nSampai jumpa di acara nanti! Semoga harinya menyenangkan.`;
    const waNumber = (p.no_whatsapp || '').replace(/\D/g, '');
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }, []);

  const sendKonfirmasiWhatsApp = useCallback(async (p: RTParticipant) => {
    const qty = p.jumlah_tiket || 1;
    const kuotaText = qty > 1 ? `Karena kuota tiket yang kaka punya ada ${qty}, ` : ``;
    const message = `Hallo kaka ${p.nama_lengkap}\n\nKami dari Panitia dr. Aisah Dahlan ingin mengkonfirmasi dengan siapa nantinya kaka ${p.nama_lengkap} akan datang ke Event Kajian & Parenting Class?\n\n${kuotaText}boleh disebutkan nama dan gender peserta nantinya?\n\nAgar mempermudah panitia dalam penyusunan kursi event?`;
    const waNumber = (p.no_whatsapp || '').replace(/\D/g, '');
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }, []);

  const toggleWAStatus = useCallback(async (p: RTParticipant) => {
    const newStatus = !p.status_wa;
    
    // Update DB
    const { error } = await supabase
      .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
      .update({ status_wa: newStatus, updated_at: new Date().toISOString() })
      .eq('id', p.id);
      
    if (error) {
      alert(`Gagal merubah status WA: ${error.message}`);
    } else {
      fetchParticipants();
    }
  }, [fetchParticipants]);

  const deleteParticipant = useCallback(async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus data peserta "${name}"?\nData yang dihapus tidak dapat dikembalikan.`)) {
      return;
    }
    const { error } = await supabase
      .from(import.meta.env.VITE_TABLE_NAME || 'rt_participants')
      .delete()
      .eq('id', id);
    if (error) {
      alert(`Gagal menghapus data: ${error.message}`);
    } else {
      fetchParticipants();
    }
  }, [fetchParticipants]);

  /* ── Export Excel ────────────────────────────────────────────────── */
  const handleExportExcel = useCallback(async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Ruang Tenang Admin';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Responses', {
      views: [{ state: 'frozen', ySplit: 1 }]
    });

    ws.columns = [
      { header: 'Timestamp', key: 'timestamp', width: 20 },
      { header: 'Nama Lengkap', key: 'nama', width: 35 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'No. WhatsApp', key: 'wa', width: 20 },
      { header: 'Usia', key: 'usia', width: 10 },
      { header: 'Jenis Kelamin', key: 'gender', width: 15 },
      { header: 'Jenis Tiket', key: 'tiket', width: 20 },
      { header: 'Sumber Info', key: 'sumber', width: 30 },
      { header: 'Jumlah Tiket', key: 'jumlahtiket', width: 15 },
      { header: 'Metode Pembayaran', key: 'metode', width: 22 },
      { header: 'Bukti Transfer URL', key: 'bukti', width: 40 },
      { header: 'Tujuan Event', key: 'tujuan', width: 30 },
      { header: 'Bukti Follow IG', key: 'ig', width: 40 },
      { header: 'Pernyataan', key: 'pernyataan', width: 15 },
      { header: 'Status Pembayaran', key: 'status', width: 20 },
      { header: 'Check-in', key: 'checkin', width: 15 },
      { header: 'Barcode', key: 'barcode', width: 20 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F46E5' } // Indigo color
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    filteredSorted.forEach((p) => {
      const row = ws.addRow({
        timestamp: p.created_at ? new Date(p.created_at).toLocaleString('id-ID') : '',
        nama: p.nama_lengkap,
        email: p.email,
        wa: p.no_whatsapp,
        usia: p.usia,
        gender: p.jenis_kelamin,
        tiket: p.jenis_tiket,
        sumber: Array.isArray(p.sumber_info) ? p.sumber_info.join(', ') : p.sumber_info,
        jumlahtiket: `${p.jumlah_tiket} Tiket`,
        metode: p.metode_pembayaran,
        bukti: p.bukti_transfer_url,
        tujuan: p.tujuan_event,
        ig: p.bukti_follow_ig_url,
        pernyataan: p.pernyataan_benar ? 'Ya' : 'Tidak',
        status: p.status_pembayaran,
        checkin: `${p.jumlah_checkin ?? 0} / ${p.jumlah_tiket}`,
        barcode: p.barcode || ''
      });

      // Alignments
      row.getCell('usia').alignment = { horizontal: 'center' };
      row.getCell('gender').alignment = { horizontal: 'center' };
      row.getCell('jumlahtiket').alignment = { horizontal: 'center' };
      row.getCell('pernyataan').alignment = { horizontal: 'center' };
      row.getCell('status').alignment = { horizontal: 'center' };
      row.getCell('checkin').alignment = { horizontal: 'center' };
      row.getCell('barcode').alignment = { horizontal: 'center' };

      if (p.status_pembayaran === 'Lunas') {
        row.getCell('status').font = { color: { argb: 'FF10B981' }, bold: true };
      } else {
        row.getCell('status').font = { color: { argb: 'FFF59E0B' }, bold: true };
      }
    });

    ws.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Data_Pendaftar_Ruang_Tenang.xlsx';
    a.click();
    window.URL.revokeObjectURL(url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, searchTerm, activeTab, filterTiket, sortField, sortDir]);

  /* ── Import Excel ────────────────────────────────────────────────── */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { raw: false });
        if (rawRows.length === 0) { setImportError('File kosong.'); return; }
        
        const rejectedDetails: { name: string, reason: string }[] = [];
        const mapped: Partial<RTParticipant>[] = rawRows.map(row => {
          const findValue = (keywords: string[], exclude: string[] = []) => {
            const key = Object.keys(row).find(k => 
              keywords.some(kw => k.toLowerCase().includes(kw)) &&
              !exclude.some(ex => k.toLowerCase().includes(ex))
            );
            return key ? row[key] : null;
          };

          const valNama = findValue(['nama lengkap', 'nama']);
          const valEmail = findValue(['email']);
          const valWa = findValue(['whatsapp', 'wa', 'hp', 'telp']);
          const valUsia = findValue(['usia', 'umur']);
          const valKelamin = findValue(['kelamin', 'gender']);
          const valJenisTiket = findValue(['kategori', 'jenis tiket', 'tiket'], ['kelamin', 'jumlah']);
          const valSumber = findValue(['dari mana', 'sumber info']);
          const valJumlahTiket = findValue(['jumlah tiket', 'quantity', 'qty', 'jumlah']);
          const valMetode = findValue(['metode pembayaran']);
          const valBukti = findValue(['bukti transfer', 'upload bukti']);
          const valTujuan = findValue(['tujuan', 'apa yang ingin', 'harapan']);
          const valFollow = findValue(['bukti follow']);
          const valPernyataan = findValue(['pernyataan', 'benar']);
          const valCreated = findValue(['timestamp', 'waktu']);

          // Normalisasi WA
          let cleanedWa = String(valWa || '').replace(/\D/g, '');
          if (cleanedWa.startsWith('0')) cleanedWa = '62' + cleanedWa.substring(1);
          else if (cleanedWa.startsWith('8')) cleanedWa = '62' + cleanedWa;
          if (!cleanedWa) cleanedWa = '-';

          // Normalisasi Usia & Jumlah Tiket
          const numUsiaStr = String(valUsia || '0').replace(/\D/g, '');
          const parsedUsia = parseInt(numUsiaStr, 10);
          const finalUsia = isNaN(parsedUsia) ? 0 : parsedUsia;

          const numTiketStr = String(valJumlahTiket || '0').replace(/\D/g, '');
          const parsedTiket = parseInt(numTiketStr, 10);
          const finalTiket = (isNaN(parsedTiket) || parsedTiket === 0) ? 1 : parsedTiket;

          // Pernyataan Benar
          const pernyataanBenar = valPernyataan ? (String(valPernyataan).toLowerCase().includes('ya') || String(valPernyataan).toLowerCase().includes('benar')) : true;

          // Sumber Info
          const sumberInfo = valSumber ? String(valSumber).split(',').map(s => s.trim()) : [];

          const baseNama = valNama?.toString().trim() || 'Tanpa Nama';

          const buktiUrl = valBukti?.toString().trim() || '-';
          
          if (cleanedWa === '-' || cleanedWa.length < 10 || cleanedWa.length > 15 || !cleanedWa.startsWith('628')) {
            rejectedDetails.push({ name: baseNama, reason: `WA Tidak Valid (${cleanedWa})` });
            return null; // Abaikan data jika nomor WA tidak valid / bukan nomor HP Indonesia
          }

          const p: Partial<RTParticipant> = {
            id:                  uuidv4(),
            created_at:          valCreated ? new Date(valCreated as string).toISOString() : new Date().toISOString(),
            updated_at:          new Date().toISOString(),
            nama_lengkap:        baseNama,
            email:               valEmail?.toString().trim() || '-',
            no_whatsapp:         cleanedWa,
            usia:                finalUsia,
            jenis_kelamin:       valKelamin?.toString().trim() || '-',
            jenis_tiket:         normalizeJenis(valJenisTiket?.toString().trim() || 'Lainnya'),
            sumber_info:         sumberInfo,
            jumlah_tiket:        finalTiket,
            metode_pembayaran:   valMetode?.toString().trim() || '-',
            bukti_transfer_url:  buktiUrl,
            tujuan_event:        valTujuan?.toString().trim() || '-',
            bukti_follow_ig_url: valFollow?.toString().trim() || '-',
            pernyataan_benar:    pernyataanBenar,
            status_pembayaran:   (buktiUrl !== '-' && buktiUrl !== '') ? 'Lunas' : 'Pending',
            jumlah_checkin:      0,         // Default
            status_wa:           false,     // Default
          };
          
          return p;
        }).filter(Boolean) as Partial<RTParticipant>[];

        // Filter duplikat di dalam file import itu sendiri
        const deduplicatedMapped = mapped.reduce((acc, current) => {
          const isDuplicate = acc.find(item => 
            String(item.no_whatsapp || '').replace(/\D/g, '') === String(current.no_whatsapp || '').replace(/\D/g, '') &&
            normalizeJenis(item.jenis_tiket || '') === normalizeJenis(current.jenis_tiket || '')
          );
          if (isDuplicate) {
            // Timpa data lama dengan data terbaru dari Excel (Jangan ditambah)
            Object.assign(isDuplicate, current);
          } else {
            acc.push(current);
          }
          return acc;
        }, [] as Partial<RTParticipant>[]);

        setImportPreview({ rows: deduplicatedMapped, fileName: file.name, rejectedDetails });
      } catch {
        setImportError('Gagal membaca file. Pastikan format .xlsx atau .csv valid.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!importPreview) return;
    setImportLoading(true);
    
    let newCount = 0;
    let updatedCount = 0;
    const newNames: string[] = [];
    const updatedDetails: { name: string, changes: string[] }[] = [];
    const skippedDetails: { name: string, reason: string }[] = [];
    const rejectedDetails = [...(importPreview.rejectedDetails || [])];

    const upsertPayload: Partial<RTParticipant>[] = [];

    importPreview.rows.forEach(newP => {
      // Cari data lama yang WA (abaikan karakter non-angka seperti +)
      const exactMatch = participants.find(extP => 
        String(extP.no_whatsapp || '').replace(/\D/g, '') === String(newP.no_whatsapp || '').replace(/\D/g, '')
      );

      const validTypes = ['Silver', 'Gold', 'Reguler', 'VVIP', 'VIP'];
      const newJenisTiket = normalizeJenis(newP.jenis_tiket || '');
      const isValidType = validTypes.includes(newJenisTiket);

      if (exactMatch) {
         // Cek apakah ada perubahan data (abaikan spasi dan huruf besar/kecil)
         const cleanStr = (s: any) => String(s || '').trim().toLowerCase();
         
         // Amankan status Lunas agar tidak turun jadi Pending jika import baru tidak ada buktinya
         const newStatus = (exactMatch.status_pembayaran === 'Lunas') ? 'Lunas' : newP.status_pembayaran;

         let finalJenisTiket = exactMatch.jenis_tiket;

         const changes: string[] = [];
         if (cleanStr(exactMatch.email) !== cleanStr(newP.email)) changes.push('Email');
         if (cleanStr(exactMatch.usia) !== cleanStr(newP.usia)) changes.push('Usia');
         if (cleanStr(exactMatch.jenis_kelamin) !== cleanStr(newP.jenis_kelamin)) changes.push('Kelamin');
         if (cleanStr(exactMatch.jumlah_tiket) !== cleanStr(newP.jumlah_tiket)) changes.push('Tiket');
         if (cleanStr(exactMatch.metode_pembayaran) !== cleanStr(newP.metode_pembayaran)) changes.push('Bank');
         if (cleanStr(exactMatch.tujuan_event) !== cleanStr(newP.tujuan_event)) changes.push('Tujuan');
         if (cleanStr(exactMatch.bukti_follow_ig_url) !== cleanStr(newP.bukti_follow_ig_url)) changes.push('IG');
         if (cleanStr(exactMatch.status_pembayaran) !== cleanStr(newStatus)) changes.push('Lunas');
         
         // Update jenis tiket HANYA jika valid & berbeda (Jika 'Lainnya' maka diabaikan)
         if (isValidType && cleanStr(exactMatch.jenis_tiket) !== cleanStr(newJenisTiket)) {
             changes.push('Jenis Tiket');
             finalJenisTiket = newJenisTiket;
         }

         if (changes.length === 0) {
            skippedDetails.push({ name: newP.nama_lengkap || 'Tanpa Nama', reason: 'Data duplikat sama persis' });
            return; // SKIP: data sama persis, jangan masukkan ke update
         }

         updatedCount++;
         updatedDetails.push({ name: newP.nama_lengkap || 'Tanpa Nama', changes });
         
         // Update data: Timpa dengan data baru dari Excel, TAPI amankan data sensitif
         upsertPayload.push({
           ...newP,
           id: exactMatch.id,
           jenis_tiket: finalJenisTiket,
           created_at: exactMatch.created_at, // Pertahankan waktu daftar pertama kali
           jumlah_checkin: exactMatch.jumlah_checkin, // Pertahankan riwayat checkin
           status_wa: exactMatch.status_wa,
           status_pembayaran: newStatus,
           waktu_absen: exactMatch.waktu_absen,
           updated_at: new Date().toISOString()
         });
      } else {
         if (!isValidType) {
           rejectedDetails.push({ name: newP.nama_lengkap || 'Tanpa Nama', reason: `Jenis Tiket Tidak Valid (${newJenisTiket})` });
         } else {
           // Jika tidak ada kesamaan persis, buat baris baru
           newCount++;
           newNames.push(newP.nama_lengkap || 'Tanpa Nama');
           upsertPayload.push(newP);
         }
      }
    });

    // Mencegah error ON CONFLICT DO UPDATE dengan menghapus data duplikat di dalam batch payload itu sendiri
    const payloadMap = new Map<string, Partial<RTParticipant>>();
    upsertPayload.forEach(p => {
       const cleanWA = String(p.no_whatsapp || '').replace(/\D/g, '');
       const key = p.id ? `id_${p.id}` : `new_${cleanWA}_${p.jenis_tiket}`;
       payloadMap.set(key, p);
    });
    const finalUpsertPayload = Array.from(payloadMap.values());

    if (finalUpsertPayload.length === 0) {
      setImportPreview(null);
      setImportLoading(false);
      setSummaryTab('dilewati');
      setImportSummary({ 
        new: 0, updated: 0, total: importPreview.rows.length, 
        newNames: [], updatedDetails: [], rejected: rejectedDetails.length, 
        rejectedDetails, skippedDetails 
      });
      return;
    }

    const { error } = await supabase.from(import.meta.env.VITE_TABLE_NAME || 'rt_participants').upsert(finalUpsertPayload);
    
    if (error) { setImportError(`Gagal import: ${error.message}`); }
    else { 
      setImportPreview(null); 
      
      let defaultTab: 'baru' | 'diperbarui' | 'dilewati' | 'ditolak' = updatedCount > 0 ? 'diperbarui' : 'baru';
      if (newCount === 0 && updatedCount === 0) {
          defaultTab = rejectedDetails.length > 0 ? 'ditolak' : 'dilewati';
      }
      setSummaryTab(defaultTab);
      setImportSummary({ 
        new: newCount, updated: updatedCount, total: importPreview.rows.length, 
        newNames, updatedDetails, rejected: rejectedDetails.length, 
        rejectedDetails, skippedDetails 
      });
      
      fetchParticipants(); 
    }
    setImportLoading(false);
  };

  /* ── Sort toggle ────────────────────────────────────────────────── */
  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  }, [sortField]);

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-violet-400" />
      : <ArrowDown className="w-3 h-3 text-violet-400" />;
  };

  /* ── Memoized tab counts & filter + sort ─────────────────────────── */
  const tabCounts = useMemo(() => {
    const nameCounts = new Map<string, number>();
    const waCounts = new Map<string, number>();
    
    participants.forEach(p => {
      const name = p.nama_lengkap?.trim().toLowerCase() || '';
      const wa = String(p.no_whatsapp || '').replace(/\D/g, '');
      if (name) nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
      if (wa) waCounts.set(wa, (waCounts.get(wa) || 0) + 1);
    });

    const isDuplicate = (p: RTParticipant) => {
      const name = p.nama_lengkap?.trim().toLowerCase() || '';
      const wa = String(p.no_whatsapp || '').replace(/\D/g, '');
      return Boolean((name && nameCounts.get(name)! > 1) || (wa && waCounts.get(wa)! > 1));
    };

    return {
      'Semua': participants.length,
      'Terverifikasi': participants.filter(p => p.status_pembayaran === 'Lunas').length,
      'Belum Lunas': participants.filter(p => p.status_pembayaran === 'Pending').length,
      'Sudah Hadir': participants.filter(p => (p.jumlah_checkin || 0) > 0).length,
      'Belum Kirim WA': participants.filter(p => !p.status_wa).length,
      'Sudah Kirim WA': participants.filter(p => p.status_wa).length,
      'Duplikat': participants.filter(p => isDuplicate(p)).length,
    };
  }, [participants]);

  const filteredSorted = useMemo(() => {
    const term = searchTerm.toLowerCase();

    const nameCounts = new Map<string, number>();
    const waCounts = new Map<string, number>();
    participants.forEach(p => {
      const name = p.nama_lengkap?.trim().toLowerCase() || '';
      const wa = String(p.no_whatsapp || '').replace(/\D/g, '');
      if (name) nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
      if (wa) waCounts.set(wa, (waCounts.get(wa) || 0) + 1);
    });

    const isDuplicate = (p: RTParticipant) => {
      const name = p.nama_lengkap?.trim().toLowerCase() || '';
      const wa = String(p.no_whatsapp || '').replace(/\D/g, '');
      return Boolean((name && nameCounts.get(name)! > 1) || (wa && waCounts.get(wa)! > 1));
    };

    const withTs = participants.map(p => ({
      p,
      ts: p.created_at ? new Date(p.created_at).getTime() : 0,
    }));

    return withTs
      .filter(({ p }) => {
        const matchSearch = !term
          || p.id?.toLowerCase().includes(term)
          || p.nama_lengkap.toLowerCase().includes(term)
          || p.email?.toLowerCase().includes(term)
          || p.no_whatsapp?.includes(term);
        
        let matchTab = true;
        if (activeTab === 'Terverifikasi') matchTab = p.status_pembayaran === 'Lunas';
        if (activeTab === 'Belum Lunas') matchTab = p.status_pembayaran === 'Pending';
        if (activeTab === 'Sudah Hadir') matchTab = (p.jumlah_checkin || 0) > 0;
        if (activeTab === 'Belum Kirim WA') matchTab = !p.status_wa;
        if (activeTab === 'Sudah Kirim WA') matchTab = !!p.status_wa;
        if (activeTab === 'Duplikat') matchTab = isDuplicate(p);

        const matchTiket  = !filterTiket || normalizeJenis(p.jenis_tiket || '') === filterTiket;

        // Gender matching robust check
        let matchGender = true;
        if (filterGender) {
          const pGender = p.jenis_kelamin?.trim().toUpperCase() || '';
          if (filterGender === 'L') {
            matchGender = pGender.startsWith('L'); // L, LAKI-LAKI, dll
          } else if (filterGender === 'P') {
            matchGender = pGender.startsWith('P'); // P, PEREMPUAN, dll
          }
        }

        return matchSearch && matchTab && matchTiket && matchGender;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'created_at') {
          cmp = a.ts - b.ts;
        } else if (sortField === 'nama_lengkap') {
          cmp = a.p.nama_lengkap.localeCompare(b.p.nama_lengkap);
        } else if (sortField === 'id') {
          cmp = (a.p.id || '').localeCompare(b.p.id || '');
        }
        return sortDir === 'asc' ? cmp : -cmp;
      })
      .map(({ p }) => p);
  }, [participants, searchTerm, activeTab, filterTiket, filterGender, sortField, sortDir]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredSorted.slice(start, start + itemsPerPage);
  }, [filteredSorted, currentPage]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / itemsPerPage));

  /* ── Stats ────────────────────────────────────────────────────────── */
  const { totalLunas, totalCheckin, jenisTiketList } = useMemo(() => ({
    totalLunas:    participants.filter(p => p.status_pembayaran === 'Lunas').length,
    totalCheckin:  participants.reduce((s, p) => s + (p.jumlah_checkin || 0), 0),
    jenisTiketList:[...new Set(participants.map(p => normalizeJenis(p.jenis_tiket || '')).filter(Boolean))],
  }), [participants]);

  /* ── Notifications Logic ────────────────────────────────────────── */
  const newParticipantsToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return participants.filter(p => p.created_at && new Date(p.created_at) >= today).length;
  }, [participants]);

  const hasUnread = newParticipantsToday > 0 && !hasReadNotifications;

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-full">
      {/* ── Desktop top bar ── */}
      <div
        className="hidden md:flex sticky top-0 z-20 items-center justify-between border-b border-white/5 px-6 h-16"
        style={{ background: 'rgba(19,17,28,0.95)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3">
          <h1 className="text-white font-bold text-lg tracking-wide">Data Tiket</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchParticipants}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/5 text-white/50 hover:text-white hover:bg-white/5 transition"
            title="Refresh"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setHasReadNotifications(true);
              }}
              className={`w-10 h-10 flex items-center justify-center rounded-xl border border-white/5 text-white/50 hover:text-white hover:bg-white/5 transition relative ${hasUnread ? 'animate-goyang text-white' : ''}`}
              title="Notifications"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <Bell className="w-4 h-4" />
              {hasUnread && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 border-2 border-[#13111c]"></span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-[#1a1535] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <h3 className="text-white text-sm font-semibold">Notifikasi</h3>
                  {newParticipantsToday > 0 && (
                    <span className="bg-sky-500/20 text-sky-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      {newParticipantsToday} Baru
                    </span>
                  )}
                </div>
                <div className="p-4">
                  {newParticipantsToday > 0 ? (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-sky-500/20 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-sky-400" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">Data Pendaftar Baru</p>
                        <p className="text-white/60 text-xs mt-1 leading-relaxed">
                          Ada <strong className="text-white">{newParticipantsToday}</strong> data pendaftar baru yang masuk hari ini.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle2 className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-white/40 text-xs">Belum ada data pendaftar baru hari ini.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-white/5 cursor-pointer hover:opacity-80 transition">
            <div className="w-9 h-9 rounded-full bg-violet-500/20 border border-violet-500/30 flex items-center justify-center overflow-hidden">
              <User className="w-4 h-4 text-violet-400" />
            </div>
            <div className="hidden lg:block text-sm">
              <p className="text-white font-semibold leading-tight">Admin RT</p>
              <p className="text-white/40 text-xs">{session?.user?.email || 'admin@ruangtenang.com'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 w-full max-w-[1600px] mx-auto">

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <StatCard
            label="Total Pendaftar (Peserta)"
            value={participants.length}
            icon={<Users className="w-6 h-6 text-white" />}
            color="linear-gradient(135deg,#7c3aed,#4f46e5)"
            chartPlaceholder={true}
          />
          <StatCard
            label="Sudah Lunas (Pendapatan)"
            value={totalLunas}
            icon={<CreditCard className="w-6 h-6 text-white" />}
            color="linear-gradient(135deg,#059669,#10b981)"
            chartPlaceholder={true}
          />
          <StatCard
            label="Peserta Pending"
            value={participants.length - totalLunas}
            icon={<AlertCircle className="w-6 h-6 text-white" />}
            color="linear-gradient(135deg,#d97706,#f59e0b)"
            chartPlaceholder={true}
          />
          <StatCard
            label="Total Check-In"
            value={totalCheckin}
            icon={<CheckSquare className="w-6 h-6 text-white" />}
            color="linear-gradient(135deg,#0891b2,#06b6d4)"
            chartPlaceholder={true}
          />
        </div>

        {/* ── Toolbar ── */}
        <div
          className="rounded-2xl border border-white/5 p-4 mb-6"
          style={{ background: '#1c172e' }}
        >
          {/* Row 1: Search + Buttons */}
          <div className="flex gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama, email, WA..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-xl text-white placeholder-white/25 text-sm border border-white/10 outline-none focus:border-violet-500 transition"
                style={{ background: 'rgba(255,255,255,0.03)', fontSize: '15px' }}
              />
            </div>

            {/* Desktop: Import + Export */}
            <div className="hidden sm:flex items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-violet-500/30 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Excel</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium border border-emerald-500/30 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            {/* Mobile: Actions dropdown */}
            <div className="relative sm:hidden flex-shrink-0">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm font-medium border border-white/10 text-white/60 hover:bg-white/5 transition"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showActionsMenu && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 overflow-hidden z-20 shadow-xl"
                  style={{ background: '#1c172e' }}
                >
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowActionsMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-violet-300 hover:bg-white/5 transition text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Import Excel
                  </button>
                  <button
                    onClick={() => { handleExportExcel(); setShowActionsMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium text-emerald-300 hover:bg-white/5 transition text-left border-t border-white/5"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
              )}
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={handleFileSelect}
          />

          {/* Row 2: Pill Tabs */}
          <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <span className="text-xs font-semibold text-white/30 uppercase tracking-wider mr-2 flex items-center gap-1.5 flex-shrink-0">
              <Filter className="w-3.5 h-3.5" /> FILTER:
            </span>
            {(['Semua', 'Terverifikasi', 'Belum Lunas', 'Sudah Hadir', 'Belum Kirim WA', 'Sudah Kirim WA', 'Duplikat'] as const).map(tab => {
              const isActive = activeTab === tab;
              const count = tabCounts[tab];
              
              let Icon = Users;
              if (tab === 'Terverifikasi') Icon = CheckCircle2;
              if (tab === 'Belum Lunas') Icon = AlertCircle;
              if (tab === 'Sudah Hadir') Icon = CheckSquare;
              if (tab === 'Belum Kirim WA') Icon = X;
              if (tab === 'Sudah Kirim WA') Icon = MessageCircle;

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition whitespace-nowrap border flex-shrink-0 ${
                    isActive
                      ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20'
                      : 'bg-transparent text-white/50 border-white/10 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab}
                  <span className={`text-xs px-2 py-0.5 rounded-md font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Result count & Kategori Tiket ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4 mt-2 px-1">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-bold text-xl sm:text-2xl">Daftar Peserta</h2>
            <span className="bg-violet-500 text-white text-sm font-bold px-2.5 py-1 rounded-lg shadow-lg shadow-violet-500/25">
              {filteredSorted.length}
            </span>
          </div>
          <select
            value={filterTiket}
            onChange={e => setFilterTiket(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm font-medium text-white/70 border border-white/10 outline-none focus:border-violet-500 transition cursor-pointer w-fit"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <option value="" className="bg-[#1a1535]">Semua Kategori Tiket</option>
            {jenisTiketList.map(j => <option key={j} value={j} className="bg-[#1a1535]">{j}</option>)}
          </select>
          <select
            value={filterGender}
            onChange={e => setFilterGender(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm font-medium text-white/70 border border-white/10 outline-none focus:border-violet-500 transition cursor-pointer w-fit"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <option value="" className="bg-[#1a1535]">Semua Gender</option>
            <option value="L" className="bg-[#1a1535]">Laki-laki</option>
            <option value="P" className="bg-[#1a1535]">Perempuan</option>
          </select>
        </div>

        {/* ── Mobile: Card List (< md) ── */}
        <div className="block md:hidden">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
              <p className="mt-3 text-white/30 text-sm">Memuat data...</p>
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍 </div>
              <p className="text-white/30 text-sm">Tidak ada data yang cocok.</p>
            </div>
          ) : (
            paginatedData.map((p, i) => (
              <ParticipantCard
                key={p.id}
                p={p}
                index={(currentPage - 1) * itemsPerPage + i + 1}
                onDetail={() => setDetailParticipant(p)}
                onToggle={() => toggleStatus(p.id!, p.status_pembayaran!)}
                onWa={() => sendWhatsApp(p)}
                onWaKonfirmasi={() => sendKonfirmasiWhatsApp(p)}
                onToggleWa={() => toggleWAStatus(p)}
                onDelete={() => deleteParticipant(p.id!, p.nama_lengkap)}
                showCheckin={activeTab === 'Sudah Hadir'}
              />
            ))
          )}
        </div>

        {/* ── Desktop: Table (≥ md) ── */}
        <div
          className="hidden md:block rounded-2xl border border-white/5 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.02)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-4 px-5 text-white/40 font-semibold text-[11px] uppercase tracking-wider w-12 text-center">No</th>
                  <th className="py-4 px-5 text-white/40 font-semibold text-[11px] uppercase tracking-wider">Nama Peserta</th>
                  <th className="py-4 px-5 text-white/40 font-semibold text-[11px] uppercase tracking-wider">
                    <button
                      className="flex items-center gap-1.5 hover:text-white/70 transition"
                      onClick={() => handleSort('nama_lengkap')}
                    >
                      Kontak <SortIcon field="nama_lengkap" />
                    </button>
                  </th>
                  <th className="py-4 px-5 text-white/40 font-semibold text-[11px] uppercase tracking-wider">Tiket</th>
                  <th className="py-4 px-5 text-white/40 font-semibold text-[11px] uppercase tracking-wider">Pembayaran</th>
                  {activeTab === 'Sudah Hadir' && (
                    <th className="py-4 px-5 text-white/40 font-semibold text-[11px] uppercase tracking-wider">Check-in</th>
                  )}
                  {activeTab === 'Sudah Hadir' && (
                    <th className="py-4 px-5 text-white/40 font-semibold text-[11px] uppercase tracking-wider">Waktu Absen</th>
                  )}
                  <th className="py-4 px-5 text-white/40 font-semibold text-[11px] uppercase tracking-wider">Status WA</th>
                  <th className="py-4 px-5 text-white/40 font-semibold text-[11px] uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={activeTab === 'Sudah Hadir' ? 9 : 7} className="text-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
                      <p className="mt-3 text-white/30 text-sm">Memuat data...</p>
                    </td>
                  </tr>
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={activeTab === 'Sudah Hadir' ? 9 : 7}>
                      <div className="text-center py-16">
                        <div className="text-4xl mb-3">🔍 </div>
                        <p className="text-white/30 text-sm">Tidak ada data yang cocok.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((p, i) => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      {/* No */}
                      <td className="py-4 px-5 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-white/5 text-white/40 text-xs font-bold border border-white/10">
                          {(currentPage - 1) * itemsPerPage + i + 1}
                        </span>
                      </td>
                      {/* Nama Peserta */}
                      <td className="py-4 px-5">
                        <p className="font-semibold text-white/90">
                          {p.nama_lengkap} <span className="text-white/40 font-normal ml-1">({p.jenis_tiket})</span>
                        </p>
                        <p className="text-[11px] text-white/40 mt-1">{p.email}</p>
                      </td>
                      {/* Kontak */}
                      <td className="py-4 px-5">
                        <p className="text-xs text-white/70 font-medium mb-1.5">{p.no_whatsapp}</p>
                        {(() => {
                          const valid = validatePhoneNumber(p.no_whatsapp || '');
                          return (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${valid.color}`}>
                              {!valid.isValid && <AlertCircle className="w-2.5 h-2.5" />}
                              {valid.message}
                            </span>
                          );
                        })()}
                      </td>
                      {/* Tiket */}
                      <td className="py-4 px-5">
                        <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold text-violet-300 bg-violet-500/10 mb-1.5">
                          {p.jenis_tiket} {getHarga(p.jenis_tiket || '') > 0 && <span className="text-violet-400/70 font-normal">({currency(getHarga(p.jenis_tiket || ''))})</span>}
                        </span>
                        <p className="text-[11px] text-white/40">{p.jumlah_tiket} tiket</p>
                      </td>
                      {/* Pembayaran */}
                      <td className="py-4 px-5">
                        <p className="text-[11px] text-white/70 font-medium mb-1.5">{p.metode_pembayaran || 'Transfer'}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            p.status_pembayaran === 'Lunas'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-orange-500/15 text-orange-400'
                          }`}
                        >
                          {p.status_pembayaran === 'Lunas'
                            ? <CheckCircle2 className="w-2.5 h-2.5" />
                            : <AlertCircle className="w-2.5 h-2.5" />}
                          {p.status_pembayaran}
                        </span>
                      </td>

                      {/* Check-in */}
                      {activeTab === 'Sudah Hadir' && (
                        <td className="py-4 px-5">
                          <div className="flex flex-col gap-1.5 w-24">
                            <div className="flex justify-between items-center text-[10px] text-white/50">
                              <span>0/{p.jumlah_tiket}</span>
                              <span>{p.jumlah_checkin ?? 0}/{p.jumlah_tiket}</span>
                            </div>
                            <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full rounded-full bg-cyan-500 transition-all"
                                style={{ width: `${((p.jumlah_checkin || 0) / (p.jumlah_tiket || 1)) * 100}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      )}
                      {/* Waktu Absen (Dynamic) */}
                      {activeTab === 'Sudah Hadir' && (
                        <td className="py-3.5 px-4 text-xs text-white/50">
                          {p.waktu_absen ? new Date(p.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      )}
                      {/* Status WA */}
                      <td className="py-4 px-5">
                        <button
                          onClick={() => toggleWAStatus(p)}
                          title="Klik untuk mengubah status WA"
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition hover:brightness-110 cursor-pointer ${
                            p.status_wa 
                              ? 'bg-green-500/15 text-green-400 border-green-500/30' 
                              : 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                          }`}
                        >
                          {p.status_wa ? (
                            <><CheckCircle2 className="w-3.5 h-3.5" /> Terkirim</>
                          ) : (
                            <><AlertCircle className="w-3.5 h-3.5" /> Belum</>
                          )}
                        </button>
                      </td>
                      {/* Aksi */}
                      <td className="py-4 px-5 text-right relative">
                        <button
                          onClick={() => setOpenActionId(openActionId === p.id ? null : (p.id || null))}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/60 bg-white/5 hover:bg-white/10 transition text-xs font-medium border border-white/10"
                        >
                          Aksi <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {openActionId === p.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenActionId(null)} />
                            <div className="absolute right-5 top-12 w-36 rounded-xl border border-white/10 shadow-2xl z-20 py-1.5 overflow-hidden" style={{ background: '#1c172e' }}>
                              <button
                                onClick={() => { setDetailParticipant(p); setOpenActionId(null); }}
                                className="w-full text-left px-4 py-2.5 text-[11px] font-medium text-white/70 hover:bg-white/5 transition flex items-center gap-2"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <a
                                href={`/t/${p.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full text-left px-4 py-2.5 text-[11px] font-medium text-violet-300 hover:bg-white/5 transition flex items-center gap-2"
                                onClick={() => setOpenActionId(null)}
                              >
                                <ExternalLink className="w-3.5 h-3.5" /> E-Tiket
                              </a>
                              <button
                                onClick={() => { sendKonfirmasiWhatsApp(p); setOpenActionId(null); }}
                                className="w-full text-left px-4 py-2.5 text-[11px] font-medium text-sky-400 hover:bg-white/5 transition flex items-center gap-2"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> Konfirmasi WA
                              </button>
                              <button
                                onClick={() => { sendWhatsApp(p); setOpenActionId(null); }}
                                className="w-full text-left px-4 py-2.5 text-[11px] font-medium text-emerald-400 hover:bg-white/5 transition flex items-center gap-2"
                              >
                                <MessageCircle className="w-3.5 h-3.5" /> Kirim Pesan WA
                              </button>
                              <button
                                onClick={() => { deleteParticipant(p.id!, p.nama_lengkap); setOpenActionId(null); }}
                                className="w-full text-left px-4 py-2.5 text-[11px] font-medium text-red-400 hover:bg-white/5 transition flex items-center gap-2 border-t border-white/5"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Hapus
                              </button>
                              {p.status_pembayaran === 'Pending' && (
                                <button
                                  onClick={() => { toggleStatus(p.id!, p.status_pembayaran!); setOpenActionId(null); }}
                                  className="w-full text-left px-4 py-2.5 text-[11px] font-medium text-emerald-400 hover:bg-white/5 transition flex items-center gap-2 border-t border-white/5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Pagination Controls ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 px-1">
            <span className="text-xs text-white/40">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, filteredSorted.length)} dari {filteredSorted.length} data
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                  // Simple truncation if many pages
                  if (totalPages > 7 && page > 2 && page < totalPages - 1 && Math.abs(page - currentPage) > 1) {
                    if (page === 3 || page === totalPages - 2) return <span key={page} className="text-white/30 text-xs px-1">...</span>;
                    return null;
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-xl text-xs font-medium transition ${
                        currentPage === page
                          ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25 border border-violet-500'
                          : 'text-white/60 hover:text-white hover:bg-white/10 border border-transparent'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€ Import Preview Modal â”€â”€ */}
      {importPreview && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setImportPreview(null)}
        >
          <div
            className="w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-white/10 p-6"
            style={{ background: '#1a1535' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold text-lg">Preview Import</h2>
              <button
                onClick={() => setImportPreview(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className="rounded-xl border border-white/5 p-4 mb-4"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{importPreview.fileName}</p>
                  <p className="text-white/50 text-xs mt-0.5">{importPreview.rows.length} baris data siap diimport</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-4">
              <p className="text-amber-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1 text-orange-400" /> Status default: <strong>Pending</strong>. Barcode di-generate otomatis (UUID).
              </p>
            </div>
            {importError && <p className="text-red-400 text-sm mb-4">{importError}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setImportPreview(null)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 border border-white/10 hover:bg-white/5 transition"
              >
                Batal
              </button>
              <button
                onClick={confirmImport}
                disabled={importLoading}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                {importLoading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Mengimport...</span></>
                  : <><Upload className="w-4 h-4" /><span>Konfirmasi Import</span></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Detail Modal â”€â”€ */}
      {detailParticipant && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setDetailParticipant(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 p-6 max-h-[85vh] overflow-y-auto"
            style={{ background: '#1a1535' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-bold text-lg">Ubah Data Peserta</h2>
              <button
                onClick={() => setDetailParticipant(null)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 mt-2">
              <div>
                <label className="block text-white/40 text-xs mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  value={detailParticipant.nama_lengkap || ''}
                  onChange={e => setDetailParticipant({ ...detailParticipant, nama_lengkap: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 bg-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-1.5">Email</label>
                <input
                  type="email"
                  value={detailParticipant.email || ''}
                  onChange={e => setDetailParticipant({ ...detailParticipant, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 bg-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-1.5">No. WhatsApp</label>
                <input
                  type="text"
                  value={detailParticipant.no_whatsapp || ''}
                  onChange={e => setDetailParticipant({ ...detailParticipant, no_whatsapp: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 bg-transparent outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white/40 text-xs mb-1.5">Usia</label>
                  <input
                    type="number"
                    value={detailParticipant.usia || ''}
                    onChange={e => setDetailParticipant({ ...detailParticipant, usia: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 bg-transparent outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1.5">Jenis Kelamin</label>
                  <select
                    value={detailParticipant.jenis_kelamin || ''}
                    onChange={e => setDetailParticipant({ ...detailParticipant, jenis_kelamin: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 outline-none transition"
                    style={{ background: '#1a1535' }}
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-white/40 text-xs mb-1.5">Jenis Tiket</label>
                    <select
                      value={detailParticipant.jenis_tiket || ''}
                      onChange={e => setDetailParticipant({ ...detailParticipant, jenis_tiket: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 bg-[#1a1535] outline-none transition"
                    >
                      <option value="" disabled>-- Pilih Jenis Tiket --</option>
                      <option value="Reguler 110K">Reguler (Rp110.000)</option>
                      <option value="Silver 150K">Silver (Rp150.000)</option>
                      <option value="Gold 200K">Gold (Rp200.000)</option>
                      <option value="VVIP">VVIP</option>
                      <option value="VIP">VIP</option>
                    </select>
                </div>
                <div>
                    <label className="block text-white/40 text-xs mb-1.5">Jumlah Tiket</label>
                    <input
                      type="number"
                      value={detailParticipant.jumlah_tiket || ''}
                      onChange={e => setDetailParticipant({ ...detailParticipant, jumlah_tiket: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 bg-transparent outline-none transition"
                    />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-white/40 text-xs mb-1.5">Metode Pembayaran</label>
                    <input
                      type="text"
                      value={detailParticipant.metode_pembayaran || ''}
                      onChange={e => setDetailParticipant({ ...detailParticipant, metode_pembayaran: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 bg-transparent outline-none transition"
                    />
                </div>
                <div>
                  <label className="block text-white/40 text-xs mb-1.5">Status Pembayaran</label>
                  <select
                    value={detailParticipant.status_pembayaran || ''}
                    onChange={e => setDetailParticipant({ ...detailParticipant, status_pembayaran: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 outline-none transition"
                    style={{ background: '#1a1535' }}
                  >
                    <option value="Pending">Pending</option>
                    <option value="Lunas">Lunas</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-1.5">Tujuan Event</label>
                <input
                  type="text"
                  value={detailParticipant.tujuan_event || ''}
                  onChange={e => setDetailParticipant({ ...detailParticipant, tujuan_event: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 bg-transparent outline-none transition"
                />
              </div>
              <div>
                <label className="block text-white/40 text-xs mb-1.5">Sumber Info (Pisahkan dengan koma)</label>
                <input
                  type="text"
                  value={Array.isArray(detailParticipant.sumber_info) ? detailParticipant.sumber_info.join(', ') : detailParticipant.sumber_info || ''}
                  onChange={e => setDetailParticipant({ ...detailParticipant, sumber_info: e.target.value.split(',').map(s => s.trim()) })}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 bg-transparent outline-none transition"
                />
              </div>
              <div className="flex items-center gap-6 pt-1">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="status_wa_edit"
                    checked={detailParticipant.status_wa || false}
                    onChange={e => setDetailParticipant({ ...detailParticipant, status_wa: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-transparent text-green-500 focus:ring-green-500 cursor-pointer"
                  />
                  <label htmlFor="status_wa_edit" className="text-white/60 text-sm cursor-pointer">Status WA Terkirim</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pernyataan_benar_edit"
                    checked={detailParticipant.pernyataan_benar || false}
                    onChange={e => setDetailParticipant({ ...detailParticipant, pernyataan_benar: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-transparent text-violet-500 focus:ring-violet-500 cursor-pointer"
                  />
                  <label htmlFor="pernyataan_benar_edit" className="text-white/60 text-sm cursor-pointer">Pernyataan data benar</label>
                </div>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setDetailParticipant(null)}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white/60 border border-white/10 hover:bg-white/5 transition"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateParticipant}
                disabled={isSaving}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Summary Modal ── */}
      {importSummary && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={() => setImportSummary(null)}
        >
          <div
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 p-6 text-center max-h-[90vh] flex flex-col"
            style={{ background: '#1a1535' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-white font-bold text-xl mb-2">Laporan Import</h2>
              <p className="text-white/60 text-sm mb-4">
                Total {importSummary.total} baris Excel diproses.
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto min-h-[100px] mb-4 text-left pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-white/40 mb-1 uppercase tracking-wider">Data Baru</p>
                  <p className="text-2xl font-bold text-emerald-400">+{importSummary.new}</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-white/40 mb-1 uppercase tracking-wider">Diperbarui</p>
                  <p className="text-2xl font-bold text-violet-400">{importSummary.updated}</p>
                </div>
              </div>

              {importSummary.rejected > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4 flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-200/80">
                    <strong className="text-red-400">{importSummary.rejected} baris ditolak</strong> karena WA tidak valid atau kosong.
                  </p>
                </div>
              )}

              {/* TABS HEADER */}
              <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2 overflow-x-auto scrollbar-hide">
                <button
                  onClick={() => setSummaryTab('diperbarui')}
                  className={`flex-1 whitespace-nowrap px-3 py-2 text-xs font-semibold rounded-lg transition ${summaryTab === 'diperbarui' ? 'bg-violet-500/20 text-violet-300' : 'text-white/40 hover:bg-white/5'}`}
                >
                  Diperbarui ({importSummary.updated})
                </button>
                <button
                  onClick={() => setSummaryTab('baru')}
                  className={`flex-1 whitespace-nowrap px-3 py-2 text-xs font-semibold rounded-lg transition ${summaryTab === 'baru' ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/40 hover:bg-white/5'}`}
                >
                  Data Baru ({importSummary.new})
                </button>
                <button
                  onClick={() => setSummaryTab('dilewati')}
                  className={`flex-1 whitespace-nowrap px-3 py-2 text-xs font-semibold rounded-lg transition ${summaryTab === 'dilewati' ? 'bg-slate-500/20 text-slate-300' : 'text-white/40 hover:bg-white/5'}`}
                >
                  Dilewati ({(importSummary.skippedDetails || []).length})
                </button>
                <button
                  onClick={() => setSummaryTab('ditolak')}
                  className={`flex-1 whitespace-nowrap px-3 py-2 text-xs font-semibold rounded-lg transition ${summaryTab === 'ditolak' ? 'bg-red-500/20 text-red-300' : 'text-white/40 hover:bg-white/5'}`}
                >
                  Ditolak ({importSummary.rejected})
                </button>
              </div>

              {/* TABS CONTENT */}
              <div className="bg-black/20 rounded-xl p-4 border border-white/5 min-h-[150px]">
                {summaryTab === 'diperbarui' && (
                  <>
                    {importSummary.updatedDetails.length === 0 ? (
                      <p className="text-sm text-white/40 text-center py-4">Tidak ada data yang diperbarui.</p>
                    ) : (
                      <ul className="space-y-3">
                        {importSummary.updatedDetails.map((item, i) => (
                          <li key={i} className="text-sm flex flex-col items-start text-left">
                            <span className="text-white/80 font-medium">{item.name}</span>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {item.changes.map((c, j) => (
                                <span key={j} className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                                  {c}
                                </span>
                              ))}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                
                {summaryTab === 'baru' && (
                  <>
                    {importSummary.newNames.length === 0 ? (
                      <p className="text-sm text-white/40 text-center py-4">Tidak ada data baru.</p>
                    ) : (
                      <ul className="text-sm text-white/60 space-y-1.5 list-disc pl-4 text-left">
                        {importSummary.newNames.map((name, i) => (
                          <li key={i}>{name}</li>
                        ))}
                      </ul>
                    )}
                  </>
                )}

                {summaryTab === 'dilewati' && (
                  <>
                    {(importSummary.skippedDetails || []).length === 0 ? (
                      <p className="text-sm text-white/40 text-center py-4">Tidak ada data yang dilewati.</p>
                    ) : (
                      <ul className="space-y-3">
                        {(importSummary.skippedDetails || []).map((item, i) => (
                          <li key={i} className="text-sm flex flex-col items-start text-left">
                            <span className="text-white/80 font-medium">{item.name}</span>
                            <span className="text-[11px] text-white/40 mt-0.5">{item.reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
                
                {summaryTab === 'ditolak' && (
                  <>
                    {(importSummary.rejectedDetails || []).length === 0 ? (
                      <p className="text-sm text-white/40 text-center py-4">Tidak ada data yang ditolak.</p>
                    ) : (
                      <ul className="space-y-3">
                        {(importSummary.rejectedDetails || []).map((item, i) => (
                          <li key={i} className="text-sm flex flex-col items-start text-left">
                            <span className="text-white/80 font-medium">{item.name}</span>
                            <span className="text-[11px] text-red-400 mt-0.5 font-medium">{item.reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 mt-2">
              <button
                onClick={() => setImportSummary(null)}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
              >
                Tutup Laporan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
