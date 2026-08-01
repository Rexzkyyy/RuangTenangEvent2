import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

/* ── Lazy-loaded pages ───────────────────────────────────── */
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const DataPenjualan  = React.lazy(() => import('./pages/DataPenjualan'));
const Scanner        = React.lazy(() => import('./pages/Scanner'));
const Login          = React.lazy(() => import('./pages/Login'));
const PublicTicket   = React.lazy(() => import('./pages/PublicTicket'));
const TambahManual   = React.lazy(() => import('./pages/TambahManual'));

/* ── Full-screen loading fallback ────────────────────────── */
const PageLoader: React.FC = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)' }}
  >
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      <p className="text-white/40 text-sm">Memuat halaman...</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* / → redirect ke /admin */}
          <Route path="/" element={<Navigate to="/admin" replace />} />

          {/* Halaman Login (publik) */}
          <Route path="/login" element={<Login />} />

          {/* Halaman Tiket Publik (publik, tidak perlu login) */}
          <Route path="/t/:id" element={<PublicTicket />} />

          {/* ── Protected Routes (wajib login) — semua pakai AppLayout ── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AdminDashboard />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/penjualan"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <DataPenjualan />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/scanner"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <Scanner />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tambah"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <TambahManual />
                </AppLayout>
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
