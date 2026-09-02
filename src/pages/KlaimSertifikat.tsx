import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Download, CheckCircle2, AlertCircle, Gift, Loader2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import type { RTParticipant, RTCertificateClaim } from '../types';
import { jsPDF } from 'jspdf';

const KlaimSertifikat: React.FC = () => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Cek WA, 2: Isi Form, 3: Download Sertifikat
  
  // Step 1 State
  const [waUtama, setWaUtama] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Data
  const [pembeliUtama, setPembeliUtama] = useState<RTParticipant | null>(null);
  const [claimedList, setClaimedList] = useState<RTCertificateClaim[]>([]);
  const [sisaKuota, setSisaKuota] = useState(0);

  // Step 2 State (Form)
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    no_whatsapp: '',
    jenis_kelamin: 'L'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Step 3 State
  const [generatedClaim, setGeneratedClaim] = useState<RTCertificateClaim | null>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [certScale, setCertScale] = useState(0.4375);

  useEffect(() => {
    if (containerRef.current) {
      const observer = new ResizeObserver((entries) => {
        if (entries[0] && entries[0].contentRect.width > 0) {
          setCertScale(entries[0].contentRect.width / 1600);
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }
  }, [step, generatedClaim]);

  const handleSearchWA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waUtama.trim()) return;
    
    setIsSearching(true);
    setSearchError('');
    
    try {
      // Cari pembeli utama menggunakan RPC function (mengatasi masalah izin RLS publik)
      const cleanWa = waUtama.trim();
      const tableName = import.meta.env.VITE_TABLE_NAME || 'rt_participants';
      
      const { data: pembeliData, error: pembeliError } = await supabase
        .rpc('get_ticket_by_wa', { 
          table_name: tableName, 
          search_wa: cleanWa 
        });
        
      if (pembeliError || !pembeliData) {
        setSearchError('Nomor WhatsApp Pembeli tidak ditemukan di sistem.');
        setIsSearching(false);
        return;
      }
      
      setPembeliUtama(pembeliData);
      
      // Cari jumlah klaim yang sudah dibuat
      const { data: claimsData, error: claimsError } = await supabase
        .from(import.meta.env.VITE_TABLE_CLAIMS || 'rt_sertifikat_claims')
        .select('*')
        .eq('wa_pembeli_utama', `62${waUtama.trim()}`);
        
      if (!claimsError && claimsData) {
        setClaimedList(claimsData);
        setSisaKuota(pembeliData.jumlah_tiket - claimsData.length);
      } else {
        setClaimedList([]);
        setSisaKuota(pembeliData.jumlah_tiket);
      }
      
      setStep(2);
    } catch (err) {
      setSearchError('Terjadi kesalahan jaringan.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_lengkap.trim() || !formData.no_whatsapp.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const newClaim = {
        nama_lengkap: formData.nama_lengkap,
        no_whatsapp: `62${formData.no_whatsapp.trim()}`,
        jenis_kelamin: formData.jenis_kelamin,
        wa_pembeli_utama: `62${waUtama.trim()}`
      };
      
      const { data, error } = await supabase
        .from(import.meta.env.VITE_TABLE_CLAIMS || 'rt_sertifikat_claims')
        .insert([newClaim])
        .select()
        .single();
        
      if (error) throw error;
      
      setGeneratedClaim(data);
      setClaimedList([...claimedList, data]);
      setSisaKuota(prev => prev - 1);
      setStep(3);
      
      // Reset form
      setFormData({
        nama_lengkap: '',
        no_whatsapp: '',
        jenis_kelamin: 'L'
      });
    } catch (err) {
      alert('Gagal menyimpan data. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateCertificateCanvas = async () => {
    if (!generatedClaim) return null;
    
    await document.fonts.load('400 120px "Great Vibes"');
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/Serti_fix.png';

    const stampImg = new Image();
    stampImg.crossOrigin = 'anonymous';
    stampImg.src = '/Logo_HD_RT.jpg';

    await Promise.all([
      new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; }),
      new Promise((resolve, reject) => { stampImg.onload = resolve; stampImg.onerror = reject; })
    ]);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      
      // Draw Stamp
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.5; // Transparansi efek stempel
      
      const stampSize = 260;
      const stampX = (canvas.width / 2) - 130; // Digeser ke kiri agar tidak menutupi full tanda tangan
      const stampY = 870; // Digeser sedikit ke atas
      
      ctx.translate(stampX, stampY);
      ctx.rotate(-12 * Math.PI / 180); // Rotasi miring sedikit seperti stempel asli
      ctx.drawImage(stampImg, -stampSize / 2, -stampSize / 2, stampSize, stampSize);
      ctx.restore();
      
      ctx.font = '400 120px "Great Vibes", cursive';
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const x = canvas.width / 2;
      const y = canvas.height * 0.37; // Posisikan di atas tulisan "sebagai" (sekitar 37% dari atas)
      
      ctx.fillText(generatedClaim.nama_lengkap, x, y);
      return canvas;
    }
    return null;
  };

  const downloadCertificatePNG = async () => {
    if (!generatedClaim) return;
    setIsDownloading(true);
    try {
      const canvas = await generateCertificateCanvas();
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `Sertifikat-${generatedClaim.nama_lengkap.replace(/\s+/g, '-')}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh sertifikat PNG.');
    } finally {
      setIsDownloading(false);
    }
  };

  const downloadCertificatePDF = async () => {
    if (!generatedClaim) return;
    setIsDownloading(true);
    try {
      const canvas = await generateCertificateCanvas();
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: "landscape",
          unit: "px",
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(dataUrl, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`Sertifikat-${generatedClaim.nama_lengkap.replace(/\s+/g, '-')}.pdf`);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal mengunduh sertifikat PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0b1f] text-white flex flex-col font-sans">
      <header className="px-6 py-5 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center sticky top-0 z-50">
        {step > 1 && (
          <button onClick={() => setStep(1)} className="mr-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition">
            <ArrowLeft size={20} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Klaim Sertifikat</h1>
          <p className="text-xs text-white/50 mt-0.5">Ruang Tenang Event</p>
        </div>
      </header>

      <main className="flex-1 w-full max-w-md mx-auto p-6 flex flex-col pt-8">
        
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-6">
              <Gift size={32} className="text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2 text-center">Buku Tamu & Sertifikat</h1>
            <p className="text-white/60 text-sm max-w-xs mx-auto text-center mb-8">
              Silakan isi kehadiran Anda untuk mendapatkan E-Sertifikat di akhir acara.
            </p>
            
            <form onSubmit={handleSearchWA} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1.5">Nomor WA Pembeli Tiket Utama</label>
                <div className="flex bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                  <div className="flex items-center justify-center bg-white/5 px-4 border-r border-white/10 text-white/60 font-medium">
                    +62
                  </div>
                  <input 
                    type="tel" 
                    value={waUtama}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      const cleanVal = val.startsWith('0') ? val.substring(1) : (val.startsWith('62') ? val.substring(2) : val);
                      setWaUtama(cleanVal);
                    }}
                    placeholder="8123456789"
                    className="w-full px-4 py-3.5 bg-transparent text-white placeholder-white/30 focus:outline-none"
                    required
                  />
                </div>
                {searchError && (
                  <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={14} /> {searchError}
                  </p>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={isSearching || !waUtama.trim()}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-[15px] shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Mencari Data...' : 'Cari Tiket Saya'}
              </button>
            </form>
          </div>
        )}

        {step === 2 && pembeliUtama && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">{pembeliUtama.nama_lengkap}</h3>
                  <p className="text-sm text-white/60">{pembeliUtama.no_whatsapp}</p>
                </div>
                <div className="bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-500/30">
                  {pembeliUtama.jenis_tiket}
                </div>
              </div>
              
              <div className="flex gap-2 mb-2">
                <div className="flex-1 bg-black/40 rounded-lg p-3 text-center border border-white/5">
                  <p className="text-xs text-white/50 mb-1">Total Kuota</p>
                  <p className="text-lg font-bold">{pembeliUtama.jumlah_tiket}</p>
                </div>
                <div className="flex-1 bg-black/40 rounded-lg p-3 text-center border border-white/5">
                  <p className="text-xs text-white/50 mb-1">Sudah Diklaim</p>
                  <p className="text-lg font-bold text-emerald-400">{claimedList.length}</p>
                </div>
              </div>
            </div>

            {sisaKuota > 0 ? (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 mb-6 text-sm text-indigo-200">
                <p>Isi data di bawah ini untuk Buku Tamu. Setelah diisi, data akan tersimpan dan sertifikat akan dibuat secara otomatis di akhir acara.</p>
              </div>
            ) : null}

            {sisaKuota > 0 ? (
              <div className="bg-indigo-950/30 border border-indigo-500/20 rounded-2xl p-5">
                <form onSubmit={handleSubmitForm} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Nama Lengkap (Untuk Sertifikat)</label>
                    <input 
                      type="text" 
                      value={formData.nama_lengkap}
                      onChange={(e) => setFormData({...formData, nama_lengkap: e.target.value})}
                      className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Nomor WhatsApp Anda</label>
                    <div className="flex bg-black/40 border border-white/10 rounded-xl overflow-hidden focus-within:border-indigo-500 transition-all">
                      <div className="flex items-center justify-center bg-white/5 px-4 border-r border-white/10 text-white/60 text-sm font-medium">
                        +62
                      </div>
                      <input 
                        type="tel" 
                        value={formData.no_whatsapp}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const cleanVal = val.startsWith('0') ? val.substring(1) : (val.startsWith('62') ? val.substring(2) : val);
                          setFormData({...formData, no_whatsapp: cleanVal});
                        }}
                        placeholder="8123456789"
                        className="w-full px-4 py-3 bg-transparent text-white text-sm focus:outline-none"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Jenis Kelamin</label>
                    <div className="flex gap-3">
                      <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-all ${formData.jenis_kelamin === 'L' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300' : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/5'}`}>
                        <input type="radio" name="jk" value="L" checked={formData.jenis_kelamin === 'L'} onChange={() => setFormData({...formData, jenis_kelamin: 'L'})} className="hidden" />
                        Laki-laki
                      </label>
                      <label className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border cursor-pointer transition-all ${formData.jenis_kelamin === 'P' ? 'bg-pink-500/20 border-pink-500 text-pink-300' : 'bg-black/40 border-white/10 text-white/60 hover:bg-white/5'}`}>
                        <input type="radio" name="jk" value="P" checked={formData.jenis_kelamin === 'P'} onChange={() => setFormData({...formData, jenis_kelamin: 'P'})} className="hidden" />
                        Perempuan
                      </label>
                    </div>
                  </div>
                  
                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full py-3.5 mt-2 rounded-xl bg-indigo-600 text-white font-medium text-[15px] hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
                  >
                    {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Menyimpan...</> : 'Simpan Data Kehadiran'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                <h4 className="font-bold text-lg mb-1">Kuota Habis</h4>
                <p className="text-sm text-white/60">Semua sertifikat untuk rombongan ini telah diklaim. Terima kasih!</p>
              </div>
            )}
            
            {claimedList.length > 0 && (
              <div className="mt-8">
                <h4 className="text-sm font-bold text-white/50 uppercase tracking-wider mb-3 px-1">Status E-Sertifikat</h4>
                <div className="space-y-2">
                  {claimedList.map((claim, idx) => (
                    <div key={idx} className="bg-black/30 border border-white/5 rounded-xl p-3 px-4 flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-sm">{claim.nama_lengkap}</p>
                        <p className="text-xs text-white/40">{claim.no_whatsapp}</p>
                      </div>
                      
                      <button 
                        onClick={() => {
                          setGeneratedClaim(claim);
                          setStep(3);
                        }}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition cursor-pointer"
                      >
                        <Download size={14} /> Klaim
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && generatedClaim && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Terima Kasih, {generatedClaim.nama_lengkap.split(' ')[0]}!</h2>
              <p className="text-white/70">
                E-Sertifikat kehadiran Anda sudah siap diunduh.
              </p>
            </div>

              <>
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                  <p className="text-sm text-white/70 text-center mb-4">Preview Sertifikat Anda:</p>
                  <div 
                    ref={containerRef}
                    className="relative mx-auto rounded-lg overflow-hidden shadow-2xl shadow-indigo-500/20 border border-white/10" 
                    style={{ width: '100%', maxWidth: '500px', aspectRatio: '1600/1131' }}
                  >
                    <div 
                      ref={certRef}
                      className="absolute top-0 left-0 bg-white flex flex-col items-center justify-center text-center"
                      style={{ 
                        backgroundImage: 'url(/Serti_fix.png)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        width: '1600px',
                        height: '1131px',
                        transform: `scale(${certScale})`, 
                        transformOrigin: 'top left'
                      }}
                    >
                      <h2 
                        style={{ 
                          fontFamily: '"Great Vibes", cursive', 
                          fontSize: '120px', 
                          color: '#000000',
                          position: 'absolute',
                          top: '37%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '100%',
                          textAlign: 'center'
                        }}
                      >
                        {generatedClaim.nama_lengkap}
                      </h2>
                      
                      {/* Stamp Overlay */}
                      <div
                        style={{
                          position: 'absolute',
                          width: '260px',
                          height: '260px',
                          left: 'calc(50% - 130px)',
                          top: '870px',
                          backgroundImage: 'url(/Logo_HD_RT.jpg)',
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                          opacity: 0.5,
                          mixBlendMode: 'multiply',
                          transform: 'translate(-50%, -50%) rotate(-12deg)',
                          pointerEvents: 'none',
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button 
                    onClick={downloadCertificatePNG}
                    disabled={isDownloading}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/10 text-white font-medium text-[15px] hover:bg-white/20 transition-all disabled:opacity-70 border border-white/10"
                  >
                    {isDownloading ? (
                      <><Loader2 size={18} className="animate-spin" /> ...</>
                    ) : (
                      <><Download size={18} /> Download PNG</>
                    )}
                  </button>

                  <button 
                    onClick={downloadCertificatePDF}
                    disabled={isDownloading}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 text-white font-medium text-[15px] hover:bg-indigo-700 transition-all disabled:opacity-70 shadow-lg shadow-indigo-500/25"
                  >
                    {isDownloading ? (
                      <><Loader2 size={18} className="animate-spin" /> ...</>
                    ) : (
                      <><Download size={18} /> Download PDF</>
                    )}
                  </button>
                </div>
              </>

            <button 
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-medium text-[15px] hover:bg-white/10 transition-all mt-4"
            >
              Isi Buku Tamu untuk Teman Lainnya
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default KlaimSertifikat;
