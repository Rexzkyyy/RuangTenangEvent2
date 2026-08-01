export interface RTParticipant {
  id?: string;
  created_at?: string;
  nama_lengkap: string;
  email: string;
  no_whatsapp: string;
  usia: number;
  jenis_kelamin: string;
  jenis_tiket: string;
  sumber_info: string[];
  jumlah_tiket: number;
  metode_pembayaran: string;
  bukti_transfer_url: string;
  tujuan_event: string;
  bukti_follow_ig_url: string;
  pernyataan_benar: boolean;
  status_pembayaran?: string;
  jumlah_checkin?: number;
  status_wa?: boolean;
  waktu_absen?: string;
  updated_at?: string;
  barcode?: string;
}
