const fs = require('fs');
const localTest = fs.readFileSync('local_test_db.sql', 'utf8');
const fullSync = fs.readFileSync('full_sync_database.sql', 'utf8');

const combined = `
-- ========================================================
-- [STEP 1] RESET DATABASE & MASUKKAN DATA AWAL (107 JUTA)
-- ========================================================
` + localTest + `\n\n
-- ========================================================
-- [STEP 2] SINKRONISASI DENGAN EXCEL & PENYESUAIAN (TARGET: 120 JUTA)
-- ========================================================
` + fullSync;

fs.writeFileSync('reset_and_sync_120.sql', combined);
console.log('Created reset_and_sync_120.sql');
