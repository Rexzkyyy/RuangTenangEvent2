const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tydfbrcdvzeggrlzabfq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZGZicmNkdnplZ2dybHphYmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTUyMDEsImV4cCI6MjA5MzAzMTIwMX0.75_AK06B7aGjIbZk_rG6KBgD6yqDHygPRYg_GHeMJ6o'
);

async function check() {
  const { data, error } = await supabase
    .from('rt_participants')
    .select('*')
    .ilike('nama_lengkap', '%eky%');
    
  if (error) {
    console.error(error);
    return;
  }
  
  console.log("Found " + data.length + " records for Eky:");
  data.forEach(d => {
    console.log(`ID: ${d.id} | Nama: ${d.nama_lengkap} | WA: ${d.no_whatsapp} | Tiket: ${d.jenis_tiket}`);
  });
}

check();
