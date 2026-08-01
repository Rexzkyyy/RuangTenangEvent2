import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { RTParticipant } from '../types';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { formatTicketCode } from '../utils';

import {
  Download, Search, CheckCircle2, RefreshCw, Loader2,
  Upload, Filter, X, ChevronDown, ExternalLink,
  ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet,
  Users, CreditCard, CheckSquare, AlertCircle, MoreHorizontal,
  Database, MessageCircle, Trash2, Pencil, Save,
} from 'lucide-react';

/* â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
type SortField = 'created_at' | 'nama_lengkap' | 'id';
type SortDir   = 'asc' | 'desc';

interface ImportPreview {
  rows: Partial<RTParticipant>[];
  fileName: string;
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
}> = ({ label, value, icon, color }) => (
  <div
    className="rounded-2xl p-4 flex items-center gap-3 border border-white/5"
    style={{ background: 'rgba(255,255,255,0.04)' }}
  >
    <div
      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: color }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-white/50 text-xs font-medium truncate">{label}</p>
      <p className="text-white text-xl sm:text-2xl font-bold leading-tight">{value}</p>
    </div>
  </div>
);

/* â”€â”€â”€ Mobile Participant Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const ParticipantCard: React.FC<{
  p: RTParticipant;
  onDetail: () => void;
  onToggle: () => void;
  onWa: () => void;
  onDelete: () => void;
}> = ({ p, onDetail, onToggle, onWa, onDelete }) => {
  const isLunas = p.status_pembayaran === 'Lunas';
  const checkinPct = ((p.jumlah_checkin || 0) / (p.jumlah_tiket || 1)) * 100;

  return (
    <div
      className="rounded-xl border border-white/5 p-4 mb-3"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <p className="font-semibold text-white text-sm truncate">{p.nama_lengkap}</p>
          <p className="text-xs text-white/40 truncate mt-0.5">{p.email}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-white/30">{p.no_whatsapp}</p>
            {p.status_wa && (
              <span className="text-[10px] bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded border border-green-500/20 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-2.5 h-2.5" /> WA
              </span>
            )}
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
          {p.jenis_tiket}
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
          onClick={onWa}
          className={`flex items-center gap-1.5 text-xs font-medium transition px-2.5 h-[30px] rounded-lg border ${p.status_wa ? 'text-green-300 bg-green-500/20 border-green-500/30 hover:bg-green-500/30' : 'text-emerald-300 bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30'}`}
        >
          <MessageCircle className={`w-3.5 h-3.5 ${p.status_wa ? 'fill-current' : ''}`} />
          <span>Kirim WA</span>
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
  const searchTerm = useDebounce(searchInput, 300);   // ← debounced
  const [filterStatus, setFilterStatus] = useState<'all' | 'Lunas' | 'Pending'>('all');
  const [filterTiket, setFilterTiket]   = useState('');
  const [filterKehadiran, setFilterKehadiran] = useState<'all' | 'sudah' | 'belum'>('all');
  const [sortField, setSortField]       = useState<SortField>('created_at');
  const [sortDir, setSortDir]           = useState<SortDir>('desc');
  const [showFilters, setShowFilters]   = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  /* ── Modal state ────────────────────────────────────────────────── */
  const [importPreview, setImportPreview]       = useState<ImportPreview | null>(null);
  const [importError, setImportError]           = useState('');
  const [importSummary, setImportSummary]       = useState<{ new: number, updated: number, total: number } | null>(null);
  const [detailParticipant, setDetailParticipant] = useState<RTParticipant | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdateParticipant = async () => {
    if (!detailParticipant?.id) return;
    setIsSaving(true);
    const { id, created_at, ...updateData } = detailParticipant;
    const { error } = await supabase
      .from('rt_participants')
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
      .from('rt_participants')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching:', error);
    else setParticipants(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchParticipants(); }, [fetchParticipants]);

  /* ── Toggle Status ────────────────────────────────────────────────── */
  const toggleStatus = useCallback(async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Pending' ? 'Lunas' : 'Pending';
    const { error } = await supabase
      .from('rt_participants')
      .update({ status_pembayaran: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) fetchParticipants();
  }, [fetchParticipants]);

  const sendWhatsApp = useCallback(async (p: RTParticipant) => {
    const ticketUrl = `${window.location.origin}/t/${p.id}`;
    const ticketCode = formatTicketCode(p.barcode || p.id || '');
    const waving = decodeURIComponent('%F0%9F%91%8B');
    const sparkles = decodeURIComponent('%E2%9C%A8');
    const ticket = decodeURIComponent('%F0%9F%8E%AB');
    const star = decodeURIComponent('%E2%AD%90');
    const calendar = decodeURIComponent('%F0%9F%93%85');
    const pin = decodeURIComponent('%F0%9F%93%8D');
    const link = decodeURIComponent('%F0%9F%94%97');
    const flower = decodeURIComponent('%F0%9F%8C%B8');

    const message = `Halo Kak *${p.nama_lengkap}*! ${waving}\n\nTerima kasih banyak telah mendaftar di acara *Jeda Sejenak Menguatkan Hati*. Kami sangat antusias menyambut kehadiran Kakak! ${sparkles}\n\nBerikut adalah rincian E-Tiket Kakak:\n\n${ticket} *Nomor Tiket:* ${ticketCode}\n${star} *Kategori Tiket:* ${p.jenis_tiket}\n${calendar} *Waktu:* Kamis, 3 Sept 2026 (08.00 - 12.00 WITA)\n${pin} *Lokasi:* Hotel Zahra Syariah, Kendari\n\n${link} *Link E-Tiket:* \n${ticketUrl}\n\nMohon siapkan dan tunjukkan barcode yang ada di link tersebut kepada panitia saat registrasi ulang ya.\n\nSampai jumpa di acara nanti! Semoga harinya menyenangkan. ${flower}`;
    const waNumber = (p.no_whatsapp || '').replace(/\D/g, '');
    
    // Update DB
    await supabase
      .from('rt_participants')
      .update({ status_wa: true, updated_at: new Date().toISOString() })
      .eq('id', p.id);
    fetchParticipants();

    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
  }, [fetchParticipants]);

  const deleteParticipant = useCallback(async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus data peserta "${name}"?\nData yang dihapus tidak dapat dikembalikan.`)) {
      return;
    }
    const { error } = await supabase
      .from('rt_participants')
      .delete()
      .eq('id', id);
    if (error) {
      alert(`Gagal menghapus data: ${error.message}`);
    } else {
      fetchParticipants();
    }
  }, [fetchParticipants]);

  /* ── Export Excel ────────────────────────────────────────────────── */
  const handleExportExcel = useCallback(() => {
    const exportData = filteredSorted.map(p => ({
      'Timestamp':          p.created_at ? new Date(p.created_at).toLocaleString('id-ID') : '',
      'Nama Lengkap':       p.nama_lengkap,
      'Email':              p.email,
      'No. WhatsApp':       p.no_whatsapp,
      'Usia':               p.usia,
      'Jenis Kelamin':      p.jenis_kelamin,
      'Jenis Tiket':        p.jenis_tiket,
      'Sumber Info':        Array.isArray(p.sumber_info) ? p.sumber_info.join(', ') : p.sumber_info,
      'Jumlah Tiket':       `${p.jumlah_tiket} Tiket`,
      'Metode Pembayaran':  p.metode_pembayaran,
      'Bukti Transfer URL': p.bukti_transfer_url,
      'Tujuan Event':       p.tujuan_event,
      'Bukti Follow IG':    p.bukti_follow_ig_url,
      'Pernyataan Benar':   p.pernyataan_benar ? 'Ya' : 'Tidak',
      'Status Pembayaran':  p.status_pembayaran,
      'Jumlah Check-in':    `${p.jumlah_checkin ?? 0} / ${p.jumlah_tiket}`,
      'Barcode':            p.barcode || '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');
    XLSX.writeFile(wb, 'Data_Pendaftar_Ruang_Tenang.xlsx');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, searchTerm, filterStatus, filterTiket, sortField, sortDir]);

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

          const p: Partial<RTParticipant> = {
            id:                  uuidv4(),
            created_at:          valCreated ? new Date(valCreated as string).toISOString() : new Date().toISOString(),
            updated_at:          new Date().toISOString(),
            nama_lengkap:        baseNama,
            email:               valEmail?.toString().trim() || '-',
            no_whatsapp:         cleanedWa,
            usia:                finalUsia,
            jenis_kelamin:       valKelamin?.toString().trim() || '-',
            jenis_tiket:         valJenisTiket?.toString().trim() || 'VIP Gold 185K',
            sumber_info:         sumberInfo,
            jumlah_tiket:        finalTiket,
            metode_pembayaran:   valMetode?.toString().trim() || '-',
            bukti_transfer_url:  valBukti?.toString().trim() || '-',
            tujuan_event:        valTujuan?.toString().trim() || '-',
            bukti_follow_ig_url: valFollow?.toString().trim() || '-',
            pernyataan_benar:    pernyataanBenar,
            status_pembayaran:   'Pending', // Default
            jumlah_checkin:      0,         // Default
            status_wa:           false,     // Default
          };
          
          return p;
        });
        setImportPreview({ rows: mapped, fileName: file.name });
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

    const upsertPayload = importPreview.rows.map(newP => {
      // Pencocokan data lama (Anti-Duplicate berdasarkan Nama dan WA)
      const match = participants.find(extP => 
        extP.nama_lengkap?.toLowerCase() === newP.nama_lengkap?.toLowerCase() &&
        extP.no_whatsapp === newP.no_whatsapp
      );

      if (match) {
         updatedCount++;
         // Tetap gunakan ID lama agar tidak duplikat, dan pertahankan status krusial
         return {
           ...newP,
           id: match.id,
           status_pembayaran: match.status_pembayaran,
           jumlah_checkin: match.jumlah_checkin,
           status_wa: match.status_wa,
           waktu_absen: match.waktu_absen,
           created_at: match.created_at,
           updated_at: new Date().toISOString()
         };
      }
      newCount++;
      return newP;
    });

    const { error } = await supabase.from('rt_participants').upsert(upsertPayload);
    
    if (error) { setImportError(`Gagal import: ${error.message}`); }
    else { 
      setImportPreview(null); 
      setImportSummary({ new: newCount, updated: updatedCount, total: importPreview.rows.length });
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

  /* ── Memoized filter + sort ───────────────────────────────────────── */
  const filteredSorted = useMemo(() => {
    const term = searchTerm.toLowerCase();

    // Pre-cache timestamps for sort (avoid re-parsing in comparator)
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
        const matchStatus = filterStatus === 'all' || p.status_pembayaran === filterStatus;
        const matchTiket  = !filterTiket || p.jenis_tiket === filterTiket;
        const matchKehadiran = filterKehadiran === 'all' || (filterKehadiran === 'sudah' ? (p.jumlah_checkin || 0) > 0 : (p.jumlah_checkin || 0) === 0);
        return matchSearch && matchStatus && matchTiket && matchKehadiran;
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
  }, [participants, searchTerm, filterStatus, filterTiket, filterKehadiran, sortField, sortDir]);

  /* ── Stats ────────────────────────────────────────────────────────── */
  const { totalLunas, totalCheckin, jenisTiketList } = useMemo(() => ({
    totalLunas:    participants.filter(p => p.status_pembayaran === 'Lunas').length,
    totalCheckin:  participants.reduce((s, p) => s + (p.jumlah_checkin || 0), 0),
    jenisTiketList:[...new Set(participants.map(p => p.jenis_tiket).filter(Boolean))],
  }), [participants]);

  const hasActiveFilters = filterStatus !== 'all' || !!filterTiket || filterKehadiran !== 'all' || !!searchInput;

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-full">
      {/* ── Desktop top bar ── */}
      <div
        className="hidden md:flex sticky top-0 z-20 items-center justify-between border-b border-white/5 px-6 h-14"
        style={{ background: 'rgba(13,11,31,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-violet-400" />
          <h1 className="text-white font-semibold text-sm">Data Tiket</h1>
        </div>
        <button
          onClick={fetchParticipants}
          className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 sm:px-6 py-5 sm:py-6 max-w-screen-xl mx-auto">

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-8">
          <StatCard
            label="Total Pendaftar"
            value={participants.length}
            icon={<Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            color="linear-gradient(135deg,#7c3aed,#4f46e5)"
          />
          <StatCard
            label="Sudah Lunas"
            value={totalLunas}
            icon={<CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            color="linear-gradient(135deg,#059669,#10b981)"
          />
          <StatCard
            label="Pending"
            value={participants.length - totalLunas}
            icon={<AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            color="linear-gradient(135deg,#d97706,#f59e0b)"
          />
          <StatCard
            label="Total Check-in"
            value={totalCheckin}
            icon={<CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 text-white" />}
            color="linear-gradient(135deg,#0891b2,#06b6d4)"
          />
        </div>

        {/* ── Toolbar ── */}
        <div
          className="rounded-2xl border border-white/5 p-3 sm:p-4 mb-4"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          {/* Row 1: Search + Buttons */}
          <div className="flex gap-2 sm:gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari nama, email, WA..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-white placeholder-white/25 text-sm border border-white/10 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30 transition"
                style={{ background: 'rgba(255,255,255,0.05)', fontSize: '16px' }}
              />
            </div>

            {/* Filter */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition flex-shrink-0 ${
                showFilters
                  ? 'border-violet-500 text-violet-400 bg-violet-500/10'
                  : 'border-white/10 text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filter</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
              )}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform hidden sm:block ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop: Tambah + Import + Export inline | Mobile: "Actions" dropdown */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-violet-500/40 text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Import Excel</span>
              </button>
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium border border-emerald-500/40 text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 transition"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>

            {/* Mobile: Actions dropdown */}
            <div className="relative sm:hidden flex-shrink-0">
              <button
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="flex items-center gap-1 px-3 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-white/60 hover:bg-white/5 transition"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {showActionsMenu && (
                <div
                  className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-white/10 overflow-hidden z-20 shadow-xl"
                  style={{ background: '#1a1535' }}
                >
                  <button
                    onClick={() => { fileInputRef.current?.click(); setShowActionsMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-violet-300 hover:bg-white/5 transition text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Import Excel
                  </button>
                  <button
                    onClick={() => { handleExportExcel(); setShowActionsMenu(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-emerald-300 hover:bg-white/5 transition text-left border-t border-white/5"
                  >
                    <Download className="w-4 h-4" />
                    Export Excel
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

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Status */}
              <div>
                <label className="block text-white/40 text-xs mb-1.5">Status Pembayaran</label>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value as 'all' | 'Lunas' | 'Pending')}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500 transition"
                  style={{ background: 'rgba(255,255,255,0.07)', fontSize: '16px' }}
                >
                  <option value="all">Semua Status</option>
                  <option value="Lunas">Lunas</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>

              {/* Jenis Tiket */}
              <div>
                <label className="block text-white/40 text-xs mb-1.5">Jenis Tiket</label>
                <select
                  value={filterTiket}
                  onChange={e => setFilterTiket(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500 transition"
                  style={{ background: 'rgba(255,255,255,0.07)', fontSize: '16px' }}
                >
                  <option value="">Semua Tiket</option>
                  {jenisTiketList.map(j => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>

              {/* Kehadiran */}
              <div>
                <label className="block text-white/40 text-xs mb-1.5">Kehadiran</label>
                <select
                  value={filterKehadiran}
                  onChange={e => setFilterKehadiran(e.target.value as 'all' | 'sudah' | 'belum')}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500 transition"
                  style={{ background: 'rgba(255,255,255,0.07)', fontSize: '16px' }}
                >
                  <option value="all">Semua</option>
                  <option value="sudah">Sudah Hadir</option>
                  <option value="belum">Belum Hadir</option>
                </select>
              </div>

              {/* Sort Field */}
              <div>
                <label className="block text-white/40 text-xs mb-1.5">Urutkan berdasarkan</label>
                <select
                  value={sortField}
                  onChange={e => setSortField(e.target.value as SortField)}
                  className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 outline-none focus:border-violet-500 transition"
                  style={{ background: 'rgba(255,255,255,0.07)', fontSize: '16px' }}
                >
                  <option value="created_at">Tanggal Daftar</option>
                  <option value="nama_lengkap">Nama</option>
                  <option value="id">ID</option>
                </select>
              </div>

              {/* Sort Direction + Reset */}
              <div>
                <label className="block text-white/40 text-xs mb-1.5">Arah Urut</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}
                    className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white/60 border border-white/10 hover:bg-white/5 transition"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                  >
                    {sortDir === 'asc' ? '↑ A–Z' : '↓ Z–A'}
                  </button>
                  {hasActiveFilters && (
                    <button
                      onClick={() => { setFilterStatus('all'); setFilterTiket(''); setSearchInput(''); }}
                      className="px-3 py-2.5 rounded-xl text-sm text-red-400 border border-red-500/20 hover:bg-red-500/10 transition flex-shrink-0"
                      title="Reset Filter"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Result count ── */}
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-white/40 text-sm">
            Menampilkan{' '}
            <span className="text-white font-semibold">{filteredSorted.length}</span>
            {' '}dari {participants.length} peserta
          </span>
        </div>

        {/* ── Mobile: Card List (< md) ── */}
        <div className="block md:hidden">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
              <p className="mt-3 text-white/30 text-sm">Memuat data...</p>
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-4xl mb-3">🔍 </div>
              <p className="text-white/30 text-sm">Tidak ada data yang cocok.</p>
            </div>
          ) : (
            filteredSorted.map(p => (
              <ParticipantCard
                key={p.id}
                p={p}
                onDetail={() => setDetailParticipant(p)}
                onToggle={() => toggleStatus(p.id!, p.status_pembayaran!)}
                onWa={() => sendWhatsApp(p)}
                onDelete={() => deleteParticipant(p.id!, p.nama_lengkap)}
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
                  <th className="py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">
                    <button
                      className="flex items-center gap-1.5 hover:text-white/70 transition"
                      onClick={() => handleSort('nama_lengkap')}
                    >
                      Peserta <SortIcon field="nama_lengkap" />
                    </button>
                  </th>
                  <th className="py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">Tiket</th>
                  <th className="py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">Pembayaran</th>
                  <th className="py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">Check-in</th>
                  {filterKehadiran === 'sudah' && (
                    <th className="py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">Waktu Absen</th>
                  )}
                  <th className="py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider">Status WA</th>
                  <th className="py-3 px-4 text-white/40 font-medium text-xs uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={filterKehadiran === 'sudah' ? 7 : 6} className="text-center py-16">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
                      <p className="mt-3 text-white/30 text-sm">Memuat data...</p>
                    </td>
                  </tr>
                ) : filteredSorted.length === 0 ? (
                  <tr>
                    <td colSpan={filterKehadiran === 'sudah' ? 7 : 6} className="text-center py-16">
                      <div className="text-4xl mb-3">🔍 </div>
                      <p className="text-white/30 text-sm">Tidak ada data yang cocok.</p>
                    </td>
                  </tr>
                ) : (
                  filteredSorted.map(p => (
                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition">
                      {/* Peserta */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-white">{p.nama_lengkap}</p>
                        <p className="text-xs text-white/40 mt-0.5">{p.email}</p>
                        <p className="text-xs text-white/30 mt-0.5">{p.no_whatsapp}</p>
                      </td>
                      {/* Tiket */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-1 rounded-md text-xs font-semibold text-violet-300 border border-violet-500/30 bg-violet-500/10 mb-1">
                          {p.jenis_tiket}
                        </span>
                        <p className="text-xs text-white/50">{p.jumlah_tiket} tiket</p>
                      </td>
                      {/* Pembayaran */}
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-white/40 mb-1">{p.metode_pembayaran}</p>
                        <span
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                            p.status_pembayaran === 'Lunas'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                              : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                          }`}
                        >
                          {p.status_pembayaran === 'Lunas'
                            ? <CheckCircle2 className="w-3 h-3" />
                            : <Loader2 className="w-3 h-3" />}
                          {p.status_pembayaran}
                        </span>
                      </td>

                      {/* Check-in */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-cyan-400 transition-all"
                              style={{ width: `${((p.jumlah_checkin || 0) / (p.jumlah_tiket || 1)) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-white/50">{p.jumlah_checkin ?? 0}/{p.jumlah_tiket}</span>
                        </div>
                      </td>
                      {/* Waktu Absen (Dynamic) */}
                      {filterKehadiran === 'sudah' && (
                        <td className="py-3.5 px-4 text-xs text-white/50">
                          {p.waktu_absen ? new Date(p.waktu_absen).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </td>
                      )}
                      {/* Status WA */}
                      <td className="py-3.5 px-4">
                        {p.status_wa ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-green-500/15 text-green-400 border border-green-500/20">
                            <CheckCircle2 className="w-3 h-3" /> Dikirim
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded bg-white/5 text-white/40 border border-white/10">
                            Belum
                          </span>
                        )}
                      </td>
                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-3 whitespace-nowrap">
                          <button
                            onClick={() => setDetailParticipant(p)}
                            className="px-2.5 h-[30px] rounded-lg text-violet-300 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 transition touch-sm flex items-center gap-1.5 justify-center text-xs font-medium"
                            title="Ubah Data"
                          >
                            <Pencil className="w-3.5 h-3.5 fill-current" />
                            <span>Ubah</span>
                          </button>
                          <a
                            href={`/t/${p.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 h-[30px] rounded-lg text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 transition touch-sm flex items-center gap-1.5 justify-center text-xs font-medium box-border"
                            title="Lihat Tiket"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>E-Tiket</span>
                          </a>
                          <button
                            onClick={() => sendWhatsApp(p)}
                            className={`px-2.5 h-[30px] rounded-lg border transition touch-sm flex items-center gap-1.5 justify-center text-xs font-medium ${p.status_wa ? 'text-green-300 bg-green-500/20 hover:bg-green-500/30 border-green-500/30' : 'text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 border-emerald-500/30'}`}
                            title="Kirim WA"
                          >
                            <MessageCircle className={`w-3.5 h-3.5 ${p.status_wa ? 'fill-current' : ''}`} />
                            <span>Kirim WA</span>
                          </button>
                          <button
                            onClick={() => deleteParticipant(p.id!, p.nama_lengkap)}
                            className="px-2.5 h-[30px] rounded-lg text-red-300 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 transition touch-sm flex items-center gap-1.5 justify-center text-xs font-medium"
                            title="Hapus Data"
                          >
                            <Trash2 className="w-3.5 h-3.5 fill-current" />
                            <span>Hapus</span>
                          </button>
                          {p.status_pembayaran === 'Pending' && (
                            <button
                              onClick={() => toggleStatus(p.id!, p.status_pembayaran!)}
                              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition touch-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                âš ï¸ Status default: <strong>Pending</strong>. Barcode di-generate otomatis (UUID).
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
                    <input
                      type="text"
                      value={detailParticipant.jenis_tiket || ''}
                      onChange={e => setDetailParticipant({ ...detailParticipant, jenis_tiket: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white border border-white/10 focus:border-violet-500 bg-transparent outline-none transition"
                    />
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
            className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl border border-white/10 p-6 text-center"
            style={{ background: '#1a1535' }}
            onClick={e => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-white font-bold text-xl mb-2">Import Berhasil!</h2>
            <p className="text-white/60 text-sm mb-6">
              Total {importSummary.total} data telah diproses.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1">Data Baru Ditambahkan</p>
                <p className="text-xl font-bold text-emerald-400">+{importSummary.new}</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-1">Data Lama Diperbarui</p>
                <p className="text-xl font-bold text-violet-400">{importSummary.updated}</p>
              </div>
            </div>
            <button
              onClick={() => setImportSummary(null)}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
