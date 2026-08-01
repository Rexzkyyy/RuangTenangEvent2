import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Database, TrendingUp, QrCode, LogOut,
  ChevronLeft, ChevronRight, Menu, X, UserPlus,
} from 'lucide-react';
import { supabase } from '../supabaseClient';

/* ── Nav items ───────────────────────────────────────────── */
const NAV_ITEMS = [
  {
    to:    '/admin',
    label: 'Data Tiket',
    icon:  Database,
  },
  {
    to:    '/penjualan',
    label: 'Data Penjualan',
    icon:  TrendingUp,
  },
  {
    to:    '/scanner',
    label: 'Scan',
    icon:  QrCode,
  },
  {
    to:    '/tambah',
    label: 'Tambah Data',
    icon:  UserPlus,
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const navigate  = useNavigate();
  const location  = useLocation();

  /* Desktop: sidebar expanded vs icon-only */
  const [expanded, setExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar_expanded');
    return saved === null ? true : saved === 'true';
  });

  /* Mobile: drawer open */
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Persist sidebar state */
  useEffect(() => {
    localStorage.setItem('sidebar_expanded', String(expanded));
  }, [expanded]);

  /* Close mobile drawer on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  /* Close mobile drawer on ESC */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  };

  /* ── Sidebar content (shared desktop + mobile) ── */
  const SidebarContent: React.FC<{ onClose?: () => void }> = ({ onClose }) => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={`flex items-center h-16 px-4 border-b border-white/5 flex-shrink-0 ${
          expanded || onClose ? 'gap-3' : 'justify-center'
        }`}
      >
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
        >
          <span className="text-white text-xs font-bold select-none">RT</span>
        </div>
        {(expanded || onClose) && (
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">Ruang Tenang</p>
            <p className="text-white/30 text-xs truncate">Admin Panel</p>
          </div>
        )}
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center rounded-xl transition-all duration-150 group ${
                expanded || onClose ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
              } ${
                isActive
                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                  : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-violet-400' : 'text-white/40 group-hover:text-white/70'
                  }`}
                />
                {(expanded || onClose) && (
                  <span className="text-sm font-medium truncate">{label}</span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom: Logout */}
      <div className="flex-shrink-0 p-2 border-t border-white/5">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center rounded-xl py-2.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 group ${
            expanded || onClose ? 'gap-3 px-3' : 'justify-center'
          }`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:text-red-400 transition-colors" />
          {(expanded || onClose) && (
            <span className="text-sm font-medium">Logout</span>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'linear-gradient(160deg, #0d0b1f 0%, #1a1535 50%, #0d0b1f 100%)' }}
    >
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen border-r border-white/5 transition-all duration-300 ease-in-out ${
          expanded ? 'w-56' : 'w-[60px]'
        }`}
        style={{ background: 'rgba(13,11,31,0.95)' }}
      >
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="absolute -right-3 top-[72px] w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-violet-500/50 hover:bg-violet-500/10 transition-all z-10"
          style={{ background: '#0d0b1f' }}
          title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {expanded
            ? <ChevronLeft  className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </aside>

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile Drawer ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 md:hidden border-r border-white/5 transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ background: 'rgba(13,11,31,0.98)' }}
      >
        <SidebarContent onClose={() => setMobileOpen(false)} />
      </aside>

      {/* ── Main Content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header
          className="md:hidden sticky top-0 z-30 border-b border-white/5 px-4 h-14 flex items-center gap-3 flex-shrink-0"
          style={{ background: 'rgba(13,11,31,0.9)', backdropFilter: 'blur(20px)' }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}
            >
              <span className="text-white text-[9px] font-bold">RT</span>
            </div>
            <span className="text-white font-semibold text-sm">
              {NAV_ITEMS.find(n => location.pathname.startsWith(n.to))?.label ?? 'Ruang Tenang'}
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
