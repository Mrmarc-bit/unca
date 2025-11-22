import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Loader2, Database, AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { supabase, getErrorMessage } from '../services/supabaseClient';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  
  // Update mode state untuk mendukung 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResetSuccess(false);

    try {
        if (mode === 'login') {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            navigate('/dashboard');
        } 
        else if (mode === 'register') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            });
            if (error) throw error;
            alert('Registrasi berhasil! Silakan cek email Anda untuk verifikasi (jika diaktifkan) atau langsung login.');
            setMode('login');
        }
        else if (mode === 'forgot') {
            // Logika Reset Password
            // Redirect user ke halaman settings setelah klik link di email
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/#/settings', 
            });
            if (error) throw error;
            setResetSuccess(true);
        }
    } catch (err: any) {
        console.error(err);
        setError(getErrorMessage(err));
    } finally {
        setIsLoading(false);
    }
  };

  // Helper untuk teks header dinamis
  const getHeader = () => {
      if (mode === 'forgot') return { title: 'Reset Password', desc: 'Masukkan email untuk instruksi reset.' };
      if (mode === 'register') return { title: 'Daftar Akun Baru', desc: 'Mulai perjalanan organisasimu di sini' };
      return { title: 'Selamat Datang Kembali', desc: 'Masuk untuk mengelola event kampusmu' };
  };

  const header = getHeader();

  return (
    <div className="w-full max-w-md relative z-10">
        {/* Decorating Blobs */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl"></div>

        <Card glass className="relative p-10 shadow-2xl">
            <div className="text-center mb-8">
                <div className="w-12 h-12 bg-indigo-600 rounded-xl mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/30">U</div>
                <h2 className="text-2xl font-bold text-slate-900">
                    {header.title}
                </h2>
                <p className="text-slate-500 mt-2">
                    {header.desc}
                </p>
            </div>

            {/* Pesan Sukses Reset Password */}
            {resetSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl animate-in fade-in zoom-in">
                    <div className="flex gap-3 items-start">
                        <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
                        <div>
                            <p className="font-semibold">Email Terkirim!</p>
                            <p className="text-sm mt-1">Cek inbox email Anda (termasuk folder spam) untuk tautan reset password.</p>
                            <button 
                                onClick={() => { setMode('login'); setResetSuccess(false); }}
                                className="text-sm font-bold underline mt-2 hover:text-green-800"
                            >
                                Kembali ke Login
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div className="flex gap-2 font-semibold mb-1">
                        <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                        {mode === 'forgot' ? 'Gagal Mengirim' : 'Login Gagal'}
                    </div>
                    <p>{error}</p>
                    {error.includes('Invalid login credentials') && (
                        <p className="mt-2 text-xs text-red-500 bg-white/50 p-2 rounded border border-red-100">
                            <strong>Tips:</strong> Pastikan email terdaftar atau password benar.
                        </p>
                    )}
                </div>
            )}

            {!resetSuccess && (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <Input 
                        type="email" 
                        label="Email" 
                        placeholder="nama@unugha.ac.id" 
                        icon={Mail} 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    
                    {/* Field Password disembunyikan saat mode forgot */}
                    {mode !== 'forgot' && (
                        <Input 
                            type="password" 
                            label="Password" 
                            placeholder="••••••••" 
                            icon={Lock} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    )}

                    {mode === 'login' && (
                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                                <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                                Ingat saya
                            </label>
                            <button 
                                type="button"
                                onClick={() => { setMode('forgot'); setError(null); }}
                                className="text-indigo-600 hover:text-indigo-700 font-medium"
                            >
                                Lupa password?
                            </button>
                        </div>
                    )}

                    <Button type="submit" className="w-full justify-center text-lg h-12 mt-4" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : (
                            mode === 'login' ? 'Masuk Sekarang' : 
                            mode === 'register' ? 'Daftar Sekarang' : 
                            'Kirim Link Reset'
                        )} 
                        {!isLoading && mode !== 'forgot' && <ArrowRight size={18} />}
                    </Button>

                    {/* Tombol Kembali untuk Mode Forgot */}
                    {mode === 'forgot' && (
                        <Button 
                            type="button" 
                            variant="ghost" 
                            onClick={() => { setMode('login'); setError(null); }}
                            className="w-full justify-center text-slate-500"
                        >
                            <ArrowLeft size={16} /> Kembali ke Login
                        </Button>
                    )}
                </form>
            )}

            <div className="mt-8 pt-6 border-t border-slate-200">
                {mode !== 'forgot' && (
                    <p className="text-center text-slate-500 text-sm mt-6">
                        {mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
                        <button 
                            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
                            className="text-indigo-600 font-semibold cursor-pointer hover:underline"
                        >
                            {mode === 'login' ? 'Daftar Sekarang' : 'Login di sini'}
                        </button>
                    </p>
                )}

                {/* Shortcut to Seeder */}
                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                    <Link to="/seed" className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors">
                        <Database size={14} />
                        Database Seeder & Tools
                    </Link>
                </div>
            </div>
        </Card>
    </div>
  );
};

export default Login;