import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Compass, 
  Plus, 
  Bell, 
  Search, 
  LogOut,
  Menu,
  X,
  User as UserIcon,
  Settings,
  ChevronDown,
  ArrowUpRight // Added for the new navbar design
} from 'lucide-react';
import { Button } from './components/UI';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import EventDetail from './pages/EventDetail';
import Discover from './pages/Discover';
import CalendarPage from './pages/CalendarPage';
import Seeder from './pages/Seeder';
import ProfileSettings from './pages/ProfileSettings';

// Types
import { User } from './types';

// --- Helper Components ---

const TimeDisplay = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="hidden lg:block text-sm font-medium text-slate-500 tabular-nums tracking-wide">
      {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', '.')} WIB
    </span>
  );
};

// --- Navigation Components ---

const PublicNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/80 backdrop-blur-xl border-b border-transparent">
      <div className="w-full max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* Left: Logo */}
        <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer group">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              U
            </div>
            <span className="font-bold text-xl text-slate-800 tracking-tight hidden sm:block">UNUGHA Events</span>
        </Link>

        {/* Right: Actions (Luma Style) */}
        <div className="flex items-center gap-4 sm:gap-6">
            
            {/* Time Display */}
            <TimeDisplay />

            {/* Explore Link */}
            <Link 
                to="/discover" 
                className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
                Jelajahi Acara 
                <ArrowUpRight size={16} className="text-slate-400" />
            </Link>

            {/* Login/Dashboard Button */}
            {user ? (
                <div className="flex items-center gap-3">
                    <Link to="/dashboard">
                       <button className="px-5 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold transition-colors">
                           Dashboard
                       </button>
                    </Link>
                </div>
            ) : (
                <Link to="/login">
                    <button className="px-6 py-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-semibold transition-all hover:scale-105 active:scale-95">
                        Masuk
                    </button>
                </Link>
            )}

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center ml-2">
                <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600 p-2 hover:bg-slate-100 rounded-full transition-colors">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 px-6 py-6 space-y-4 shadow-2xl absolute w-full left-0 animate-in slide-in-from-top-5">
            <Link to="/discover" className="flex items-center justify-between text-slate-600 font-medium text-lg py-2" onClick={() => setIsMenuOpen(false)}>
                Temukan Event <ArrowUpRight size={20} />
            </Link>
            <div className="pt-4 flex flex-col gap-3 border-t border-slate-100">
              {user ? (
                  <>
                    <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="primary" className="w-full justify-center">Dashboard</Button>
                    </Link>
                    <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="w-full py-3 text-red-600 font-medium text-center hover:bg-red-50 rounded-xl transition-colors">
                        Keluar
                    </button>
                  </>
              ) : (
                  <>
                    <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="secondary" className="w-full justify-center bg-slate-100 border-transparent text-slate-900">Masuk</Button>
                    </Link>
                    <Link to="/login?mode=register" onClick={() => setIsMenuOpen(false)}>
                        <Button variant="primary" className="w-full justify-center">Daftar Akun</Button>
                    </Link>
                  </>
              )}
            </div>
        </div>
      )}
    </nav>
  );
};

const DashboardNavbar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const isActive = (path: string) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const handleLogout = async () => {
      await signOut();
      navigate('/');
  };

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get user display name
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  
  // Logic Avatar: Uploaded -> Metadata -> 3D Char Fallback
  const avatarSrc = user?.user_metadata?.avatar_url 
    ? user.user_metadata.avatar_url 
    : `https://api.dicebear.com/9.x/adventurer/svg?seed=${user?.email}&backgroundColor=b6e3f4`;

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-3">
          
          {/* Left: Logo & Nav */}
          <div className="flex items-center gap-8">
             <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                U
              </div>
            </Link>

            <div className="hidden md:flex items-center bg-slate-100/50 p-1 rounded-full border border-slate-200/50">
              <Link to="/dashboard">
                <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/dashboard') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Dashboard
                </div>
              </Link>
              <Link to="/calendar">
                <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/calendar') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Kalender
                </div>
              </Link>
              <Link to="/discover">
                <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive('/discover') ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                  Explore
                </div>
              </Link>
            </div>
          </div>

          {/* Center: Search (Desktop) */}
          <div className="hidden md:block w-96">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Cari event..." 
                className="w-full bg-slate-100 border-transparent focus:bg-white focus:border-indigo-500 rounded-full pl-10 pr-4 py-2 text-sm transition-all outline-none border"
              />
            </div>
          </div>

          {/* Right: User & Actions */}
          <div className="flex items-center gap-4">
            <Link to="/create-event">
              <button className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                <Plus size={16} />
                <span>Buat</span>
              </button>
            </Link>
            
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 relative" ref={userMenuRef}>
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 hover:bg-slate-50 p-1 pr-2 rounded-full transition-colors"
              >
                <div className="text-right hidden lg:block">
                  <p className="text-sm font-semibold text-slate-800 leading-none truncate max-w-[100px]">{displayName}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-indigo-50 border-2 border-white shadow-sm overflow-hidden">
                   <img 
                     src={avatarSrc}
                     alt="User" 
                     className="w-full h-full object-cover" 
                   />
                </div>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {/* User Dropdown */}
              {isUserMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-sm font-semibold text-slate-900 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>
                  <Link 
                    to="/settings" 
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <Settings size={16} /> Pengaturan Profil
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-1"
                  >
                    <LogOut size={16} /> Keluar Aplikasi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- Layout Wrapper ---

const AppLayout = ({ children, type = 'public' }: { children?: React.ReactNode, type?: 'public' | 'dashboard' | 'auth' }) => {
  const { user } = useAuth();
  const location = useLocation();

  let effectiveType = type;
  
  // Exception: Landing page (/) selalu pakai public navbar biar cantik
  const isLanding = location.pathname === '/';

  if (type === 'public' && user && !isLanding) {
    effectiveType = 'dashboard';
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {effectiveType === 'public' && <PublicNavbar />}
      {effectiveType === 'dashboard' && <DashboardNavbar />}
      
      {/* Padding adjustment: Public navbar is fixed (needs pt-20), Dashboard is sticky (needs no padding) */}
      <main className={`flex-grow ${effectiveType === 'public' ? 'pt-20' : ''} ${effectiveType === 'auth' ? 'flex items-center justify-center p-4' : ''}`}>
        {children}
      </main>

      {effectiveType === 'public' && (
        <footer className="bg-white border-t border-slate-200 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-slate-500">© 2024 UNUGHA Event Platform. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<AppLayout type="public"><Landing /></AppLayout>} />
          <Route path="/login" element={<AppLayout type="auth"><Login /></AppLayout>} />
          
          {/* Publicly accessible pages */}
          <Route path="/discover" element={<AppLayout type="public"><Discover /></AppLayout>} />
          <Route path="/event/:id" element={<AppLayout type="public"><EventDetail /></AppLayout>} />
          
          {/* Protected/Dashboard Routes */}
          {/* Calendar is now Dashboard only */}
          <Route path="/calendar" element={<AppLayout type="dashboard"><CalendarPage /></AppLayout>} />
          
          <Route path="/dashboard" element={<AppLayout type="dashboard"><Dashboard /></AppLayout>} />
          <Route path="/create-event" element={<AppLayout type="dashboard"><CreateEvent /></AppLayout>} />
          <Route path="/seed" element={<AppLayout type="dashboard"><Seeder /></AppLayout>} />
          <Route path="/settings" element={<AppLayout type="dashboard"><ProfileSettings /></AppLayout>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;