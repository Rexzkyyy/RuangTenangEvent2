const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://tydfbrcdvzeggrlzabfq.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5ZGZicmNkdnplZ2dybHphYmZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0NTUyMDEsImV4cCI6MjA5MzAzMTIwMX0.75_AK06B7aGjIbZk_rG6KBgD6yqDHygPRYg_GHeMJ6o'
);

async function clean() {
  const { error } = await supabase
    .from('rt_participants_dev')
    .delete()
    .eq('id', '4d78ce2d-4aa9-4735-8f2b-1edc6e534f86'); // ID of the duplicate Reguler
    
  if (error) {
    console.error(error);
  } else {
    console.log("Deleted duplicate Reguler!");
  }
}

clean();
