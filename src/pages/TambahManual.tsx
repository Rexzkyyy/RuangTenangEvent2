import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import type { RTParticipant } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  UserPlus, Save, Loader2, CheckCircle2, ArrowLeft,
} from 'lucide-react';

/* ── Empty form default ─────────────────────────────────── */
const emptyForm = {
  nama_lengkap:        '',
  email:               '',
  no_whatsapp:         '',
  usia:                '',
  jenis_kelamin:       'Laki-laki',
  jenis_tiket:         '',
  jumlah_tiket:        '1',
  metode_pembayaran:   '',
  status_pembayaran:   'Pending',
  tujuan_event:        '',
  bukti_transfer_url:  '',
  bukti_follow_ig_url: '',
  pernyataan_benar:    false,
  sumber_info:         '',
};

/* ── Field wrapper ──────────────────────────────────────── */
const Field: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div>
    <label className="block text-white/60 text-xs mb-1.5 font-medium">
      {label}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
    {children}
  </div>
);

/* ── Input style shared ─────────────────────────────────── */
const inputCls = 'w-full px-3.5 py-2.5 rounded-xl text-white placeholder-white/20 text-sm border border-white/10 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/25 transition';
const inputStyle = { background: 'rgba(255,255,255,0.06)', fontSize: '16px' };

/* ── Section header ─────────────────────────────────────── */
const Section: React.FC<{ title: string }> = ({ title }) => (
  <div className="pt-1">
    <p className="text-white/40 text-xs font-semibold uppercase tracking-wider">{title}</p>
    <div className="mt-2 border-t border-white/5" />
  </div>
);

/* ── Main ────────────────────────────────────────────────── */
const TambahManual: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm]       = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);

  // Custom states for the new UI fields
  const [metodeOption, setMetodeOption] = useState<string>('');
  const [metodeOther, setMetodeOther]   = useState<string>('');

  const [sumberOptions, setSumberOptions] = useState<string[]>([]);
  const [sumberOther, setSumberOther]     = useState<string>('');

  const handleSumberToggle = (option: string) => {
    setSumberOptions(prev => 
      prev.includes(option) ? prev.filter(o => o !== option) : [...prev, option]
    );
  };

  const set = (field: string, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.nama_lengkap.trim() || !form.no_whatsapp.trim()) {
      setError('Nama Lengkap dan No. WhatsApp wajib diisi.');
      return;
    }
    setLoading(true);

    const payload: Partial<RTParticipant> = {
      nama_lengkap:        form.nama_lengkap.trim(),
      email:               form.email.trim(),
      no_whatsapp:         form.no_whatsapp.trim(),
      usia:                parseInt(form.usia || '0', 10),
      jenis_kelamin:       form.jenis_kelamin,
      jenis_tiket:         form.jenis_tiket.trim(),
      jumlah_tiket:        parseInt(form.jumlah_tiket || '1', 10),
      metode_pembayaran:   (metodeOption === 'Other' ? metodeOther : metodeOption).trim(),
      status_pembayaran:   form.status_pembayaran,
      tujuan_event:        form.tujuan_event.trim(),
      bukti_transfer_url:  form.bukti_transfer_url.trim(),
      bukti_follow_ig_url: form.bukti_follow_ig_url.trim(),
      pernyataan_benar:    form.pernyataan_benar,
      sumber_info:         [...sumberOptions, ...(sumberOther.trim() ? [sumberOther.trim()] : [])],
      jumlah_checkin: 0,
      barcode:        uuidv4(),
    };

    const { error: dbErr } = await supabase.from('rt_participants').insert([payload]);
    if (dbErr) {
      setError(`Gagal menyimpan: ${dbErr.message}`);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  /* ── Success state ── */
  if (success) {
    return (
      <div className="min-h-full flex items-center justify-center px-4 py-12">
        <div className="max-w-sm w-full text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'linear-gradient(135deg,#059669,#10b981)' }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Data Berhasil Disimpan!</h2>
          <p className="text-white/40 text-sm mb-6">Peserta baru telah ditambahkan ke database.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => { setForm(emptyForm); setSuccess(false); }}
              className="flex-1 py-3 rounded-xl text-sm font-medium border border-white/10 text-white/60 hover:bg-white/5 transition"
            >
              Tambah Lagi
            </button>
            <button
              onClick={() => navigate('/admin')}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              Lihat Data Tiket
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="min-h-full">
      {/* Desktop top bar */}
      <div
        className="hidden md:flex sticky top-0 z-20 items-center gap-3 border-b border-white/5 px-6 h-14"
        style={{ background: 'rgba(13,11,31,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <UserPlus className="w-4 h-4 text-sky-400" />
        <h1 className="text-white font-semibold text-sm">Tambah Data Manual</h1>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-6">

        {/* Mobile back button */}
        <button
          onClick={() => navigate(-1)}
          className="md:hidden flex items-center gap-1.5 text-white/40 hover:text-white text-sm mb-5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Identitas ── */}
          <Section title="Identitas Peserta" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="Nama Lengkap" required>
                <input type="text" required value={form.nama_lengkap}
                  onChange={e => set('nama_lengkap', e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className={inputCls} style={inputStyle} />
              </Field>
            </div>
            <Field label="Email">
              <input type="email" value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="budi@email.com"
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="No. WhatsApp" required>
              <input type="text" required value={form.no_whatsapp}
                onChange={e => set('no_whatsapp', e.target.value)}
                placeholder="+6281234567890"
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Usia">
              <input type="number" min="1" max="99" value={form.usia}
                onChange={e => set('usia', e.target.value)}
                placeholder="25"
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Jenis Kelamin">
              <select value={form.jenis_kelamin}
                onChange={e => set('jenis_kelamin', e.target.value)}
                className={inputCls} style={inputStyle}>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </Field>
          </div>

          {/* ── Info Tiket ── */}
          <Section title="Info Tiket" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Jenis Tiket">
              <select value={form.jenis_tiket}
                onChange={e => set('jenis_tiket', e.target.value)}
                className={inputCls} style={inputStyle}>
                <option value="" disabled>-- Pilih Jenis Tiket --</option>
                <option value="Reguler 110K">Reguler (Rp110.000)</option>
                <option value="Silver 150K">Silver (Rp150.000)</option>
                <option value="Gold 200K">Gold (Rp200.000)</option>
              </select>
            </Field>
            <Field label="Jumlah Tiket">
              <input type="number" min="1" value={form.jumlah_tiket}
                onChange={e => set('jumlah_tiket', e.target.value)}
                className={inputCls} style={inputStyle} />
            </Field>
            <Field label="Metode Pembayaran">
              <select value={metodeOption}
                onChange={e => {
                  setMetodeOption(e.target.value);
                  if (e.target.value !== 'Other') setMetodeOther('');
                }}
                className={inputCls} style={inputStyle}>
                <option value="" disabled>-- Pilih Metode --</option>
                <option value="M-Bangking">M-Bangking</option>
                <option value="E-Wallet">E-Wallet</option>
                <option value="Other">Other (Tulis sendiri)</option>
              </select>
              {metodeOption === 'Other' && (
                <input type="text"
                  value={metodeOther}
                  onChange={e => setMetodeOther(e.target.value)}
                  placeholder="Ketik metode pembayaran..."
                  className={`${inputCls} mt-3`} style={inputStyle}
                  autoFocus
                />
              )}
            </Field>
            <Field label="Status Pembayaran">
              <select value={form.status_pembayaran}
                onChange={e => set('status_pembayaran', e.target.value)}
                className={inputCls} style={inputStyle}>
                <option value="Pending">Pending</option>
                <option value="Lunas">Lunas</option>
              </select>
            </Field>
          </div>

          {/* ── Info Tambahan ── */}
          <Section title="Info Tambahan" />
          <div className="space-y-4">
            <Field label="Tujuan Ikut Event">
              <textarea rows={2} value={form.tujuan_event}
                onChange={e => set('tujuan_event', e.target.value)}
                placeholder="Apa yang ingin didapatkan dari event ini?"
                className={`${inputCls} resize-none`} style={inputStyle} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="URL Bukti Transfer">
                <input type="url" value={form.bukti_transfer_url}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(prev => ({
                      ...prev,
                      bukti_transfer_url: val,
                      ...(val.trim() ? { status_pembayaran: 'Lunas' } : {})
                    }));
                  }}
                  placeholder="https://drive.google.com/..."
                  className={inputCls} style={inputStyle} />
              </Field>
              <Field label="URL Bukti Follow IG">
                <input type="url" value={form.bukti_follow_ig_url}
                  onChange={e => set('bukti_follow_ig_url', e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className={inputCls} style={inputStyle} />
              </Field>
            </div>
            <Field label="Sumber Info (Boleh pilih lebih dari satu)">
              <div className="flex flex-wrap gap-x-6 gap-y-3 mt-2">
                {['Tiktok', 'Instagram', 'WhatsApp', 'Facebook', 'Komunitas', 'Teman/Keluarga', 'Other'].map(opt => (
                  <label key={opt} className="flex items-center gap-3 cursor-pointer text-sm text-white/80">
                    <input type="checkbox"
                      checked={opt === 'Other' ? sumberOther !== '' || sumberOptions.includes('Other') : sumberOptions.includes(opt)}
                      onChange={(e) => {
                        if (opt === 'Other') {
                          if (!e.target.checked) setSumberOther('');
                          handleSumberToggle('Other');
                        } else {
                          handleSumberToggle(opt);
                        }
                      }}
                      className="w-4 h-4 rounded text-sky-500 bg-white/5 border-white/20 focus:ring-sky-500/50" />
                    {opt === 'Other' ? (
                      <div className="flex items-center gap-2 flex-1">
                        <span>Other:</span>
                        <input type="text"
                          value={sumberOther}
                          onChange={(e) => {
                            if (!sumberOptions.includes('Other')) handleSumberToggle('Other');
                            setSumberOther(e.target.value);
                          }}
                          className="flex-1 min-w-[120px] bg-transparent border-b border-white/20 focus:border-sky-500 outline-none px-1 py-0.5 text-white/90"
                        />
                      </div>
                    ) : (
                      <span>{opt}</span>
                    )}
                  </label>
                ))}
              </div>
            </Field>

            {/* Pernyataan checkbox */}
            <div
              className="flex items-start gap-3 cursor-pointer group py-1 select-none"
              onClick={() => set('pernyataan_benar', !form.pernyataan_benar)}
            >
              <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                form.pernyataan_benar
                  ? 'bg-sky-500 border-sky-500'
                  : 'border-white/20 group-hover:border-white/40'
              }`}>
                {form.pernyataan_benar && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-white/60 text-sm leading-snug">
                Saya menyatakan data yang diisi sudah benar
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2 pb-6">
            <button
              type="button"
              onClick={() => navigate('/admin')}
              className="sm:w-36 py-3 rounded-xl text-sm font-medium text-white/60 border border-white/10 hover:bg-white/5 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#0891b2,#06b6d4)' }}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Menyimpan...</span></>
                : <><Save className="w-4 h-4" /><span>Simpan Data</span></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TambahManual;
