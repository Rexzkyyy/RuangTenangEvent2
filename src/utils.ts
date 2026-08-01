export const formatTicketCode = (code: string) => {
  if (!code) return '';
  if (code.startsWith('PY')) return code;
  // Jika panjang karakter lebih dari 8 (kemungkinan UUID), ambil 8 karakter pertama
  if (code.length > 8) {
    const short = code.substring(0, 8).toUpperCase();
    return `PY-${short}`;
  }
  // Jika berupa angka pendek (ID manual lama)
  if (!isNaN(Number(code)) && code.length > 5) return `PY${code.slice(-3)}`;
  return `PY${code.padStart(3, '0')}`;
};

export const normalizeJenisTiket = (jenis: string) => {
  if (!jenis) return '';
  const upper = jenis.toUpperCase();
  
  if (upper.includes('DISKON 100K') || upper.includes('PROMO')) {
    return 'Silver Diskon 100K';
  }
  
  if (upper.includes('MAHASISWA') || upper.includes('DISKON 50K')) {
    return 'Silver Diskon 50K';
  }

  if (upper.includes('SILVER')) {
    return 'Silver 150K';
  }
  if (upper.includes('GOLD') || upper.includes('VIP')) {
    return 'Gold 200K';
  }
  if (upper.includes('REGULER') || upper.includes('REGULAR')) {
    return 'Reguler 110K';
  }
  
  return jenis;
};
