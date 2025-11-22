import React, { useState } from 'react';
import { Database, Check, AlertCircle, Loader2, UserPlus, ShieldCheck, Mail, Lock, RefreshCw, Copy, Terminal } from 'lucide-react';
import { Button, Card, Input } from '../components/UI';
import { supabase, getErrorMessage } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

const Seeder: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'warning' | null, message: string }>({ type: null, message: '' });
  const [activeTab, setActiveTab] = useState<'seeder' | 'schema'>('seeder');

  // Custom Admin Inputs
  const [adminEmail, setAdminEmail] = useState('muchlisinmaruf@gmail.com');
  const [adminPassword, setAdminPassword] = useState('admin1234');

  const sqlScript = `-- SKEMA DATABASE LENGKAP - UNUGHA EVENT PLATFORM
-- Jalankan script ini di Supabase SQL Editor untuk mereset dan menyiapkan database.

-- ⚠️ PERINGATAN: Script ini akan menghapus tabel public yang sudah ada!
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;
DROP TABLE IF EXISTS public.registrations;
DROP TABLE IF EXISTS public.events;
DROP TABLE IF EXISTS public.organizations;
DROP TABLE IF EXISTS public.profiles;

-- ==========================================
-- 1. TABEL PROFILES (Data Tambahan User)
-- ==========================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'participant' CHECK (role IN ('participant', 'organizer', 'admin')),
  bio TEXT,
  university_id TEXT -- NIM/NIDN
);

-- Trigger: Otomatis buat profile saat User Sign Up
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Backfill: Buat profile untuk user lama yang belum punya profile
INSERT INTO public.profiles (id, full_name)
SELECT id, raw_user_meta_data->>'full_name' FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. TABEL ORGANISASI (BEM, UKM, Himpunan)
-- ==========================================
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  type TEXT, -- Contoh: UKM, Himpunan, Komunitas
  description TEXT,
  email TEXT,
  instagram TEXT,
  website TEXT,
  members_count INTEGER DEFAULT 0,
  rating NUMERIC DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  banner_url TEXT
);

-- ==========================================
-- 3. TABEL EVENTS (Acara Kampus)
-- ==========================================
CREATE TABLE public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  title TEXT NOT NULL,
  slug TEXT,
  date DATE, -- Menggunakan tipe DATE agar bisa disortir
  time TIME, -- Menggunakan tipe TIME
  end_time TIME,
  location TEXT,
  type TEXT, -- Seminar, Workshop, Lomba, dll
  status TEXT DEFAULT 'Terbuka', -- Terbuka, Ditutup, Selesai, Draft
  image_url TEXT,
  description TEXT,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  price NUMERIC DEFAULT 0, -- 0 = Gratis
  is_public BOOLEAN DEFAULT TRUE,
  
  -- Relasi
  host_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, 
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- ==========================================
-- 4. TABEL REGISTRATIONS (Pendaftaran Peserta)
-- ==========================================
CREATE TABLE public.registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'registered', -- registered, attended, cancelled
  ticket_code UUID DEFAULT gen_random_uuid(),
  notes TEXT,
  
  -- Constraint: Satu user hanya bisa daftar sekali per event
  UNIQUE(user_id, event_id)
);

-- ==========================================
-- 5. SECURITY (Row Level Security / RLS)
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Policies: Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Policies: Organizations
CREATE POLICY "Organizations are viewable by everyone" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create organizations" ON public.organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies: Events
CREATE POLICY "Public events are viewable by everyone" ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Hosts can update their events" ON public.events FOR UPDATE USING (auth.uid() = host_id);
CREATE POLICY "Hosts can delete their events" ON public.events FOR DELETE USING (auth.uid() = host_id);

-- Policies: Registrations
CREATE POLICY "Users can view own registrations" ON public.registrations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can register themselves" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Host Event bisa melihat siapa yang mendaftar ke event mereka
CREATE POLICY "Hosts can view registrations for their events" ON public.registrations FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE public.events.id = public.registrations.event_id
    AND public.events.host_id = auth.uid()
  )
);

-- ==========================================
-- 6. STORAGE BUCKETS
-- ==========================================
-- Membuat bucket jika belum ada
INSERT INTO storage.buckets (id, name, public) VALUES ('banners', 'banners', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- Policies Storage: Banner
-- Drop policy lama jika ada agar tidak error saat re-run
DROP POLICY IF EXISTS "Public Access Banners" ON storage.objects;
CREATE POLICY "Public Access Banners" ON storage.objects FOR SELECT USING ( bucket_id = 'banners' );

DROP POLICY IF EXISTS "Auth Upload Banners" ON storage.objects;
CREATE POLICY "Auth Upload Banners" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'banners' AND auth.role() = 'authenticated' );

-- Policies Storage: Avatar
DROP POLICY IF EXISTS "Public Access Avatars" ON storage.objects;
CREATE POLICY "Public Access Avatars" ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Auth Upload Avatars" ON storage.objects;
CREATE POLICY "Auth Upload Avatars" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' AND auth.role() = 'authenticated' );
`;

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlScript);
    setStatus({ type: 'success', message: 'SQL Script berhasil disalin! Tempel di Supabase SQL Editor.' });
    setTimeout(() => setStatus({ type: null, message: '' }), 3000);
  };

  const generateRandomEmail = () => {
    const randomStr = Math.random().toString(36).substring(7);
    setAdminEmail(`admin_${randomStr}@unugha.ac.id`);
    setAdminPassword('admin1234');
    setStatus({ type: null, message: '' });
  };

  const dummyEvents = [
    {
      title: 'Seminar Nasional Teknologi 5.0',
      type: 'Teknologi',
      date: '2024-11-15',
      time: '09:00',
      location: 'Auditorium Utama',
      description: 'Membahas masa depan AI dan dampaknya terhadap industri kreatif. Menghadirkan pembicara dari Google dan Tokopedia.',
      is_public: true,
      status: 'Terbuka',
      image_url: 'https://picsum.photos/seed/semnas/800/400'
    },
    {
      title: 'Workshop React & Supabase',
      type: 'Workshop',
      date: '2024-11-20',
      time: '13:00',
      location: 'Lab Komputer 2',
      description: 'Belajar membuat aplikasi fullstack dalam 3 jam. Peserta diharapkan membawa laptop masing-masing.',
      is_public: true,
      status: 'Mendatang',
      image_url: 'https://picsum.photos/seed/workshopreact/800/400'
    },
    {
      title: 'Pentas Seni Tahunan: Gema Nusantara',
      type: 'Seni Budaya',
      date: '2024-12-01',
      time: '19:00',
      location: 'Gedung Serbaguna',
      description: 'Penampilan teater, tari, dan musik dari berbagai UKM di UNUGHA. Jangan lewatkan kemeriahannya!',
      is_public: true,
      status: 'Mendatang',
      image_url: 'https://picsum.photos/seed/pensi/800/400'
    },
    {
      title: 'Lomba Futsal Antar Prodi',
      type: 'Lomba',
      date: '2024-11-25',
      time: '08:00',
      location: 'GOR Kampus',
      description: 'Turnamen futsal tahunan untuk memperebutkan piala Rektor. Segera daftarkan tim prodi kalian.',
      is_public: true,
      status: 'Terbuka',
      image_url: 'https://picsum.photos/seed/futsal/800/400'
    },
    {
      title: 'Webinar Cyber Security Awareness',
      type: 'Teknologi',
      date: '2024-11-18',
      time: '10:00',
      location: 'Online (Zoom)',
      description: 'Pentingnya menjaga data pribadi di era digital. Tips dan trik aman berselancar di internet.',
      is_public: true,
      status: 'Terbuka',
      image_url: 'https://picsum.photos/seed/cyber/800/400'
    },
    {
      title: 'Pelatihan Public Speaking Dasar',
      type: 'Workshop',
      date: '2024-11-22',
      time: '15:00',
      location: 'Ruang Kelas A1',
      description: 'Tingkatkan kepercayaan dirimu berbicara di depan umum. Cocok untuk mahasiswa baru.',
      is_public: true,
      status: 'Terbuka',
      image_url: 'https://picsum.photos/seed/publicspeak/800/400'
    },
    {
      title: 'Turnamen Mobile Legends Campus Cup',
      type: 'Lomba',
      date: '2024-11-30',
      time: '10:00',
      location: 'Aula Kampus',
      description: 'Buktikan skill timmu di turnamen MLBB terbesar se-kampus. Total hadiah jutaan rupiah!',
      is_public: true,
      status: 'Mendatang',
      image_url: 'https://picsum.photos/seed/mlbb/800/400'
    },
    {
      title: 'Bakti Sosial Raya 2024',
      type: 'UKM',
      date: '2024-10-15',
      time: '07:00',
      location: 'Desa Binaan',
      description: 'Kegiatan pengabdian masyarakat, tanam pohon, dan pembagian sembako.',
      is_public: true,
      status: 'Ditutup',
      image_url: 'https://picsum.photos/seed/baksos/800/400'
    },
    {
      title: 'Pameran Fotografi: Wajah Kampus',
      type: 'Seni Budaya',
      date: '2024-12-05',
      time: '09:00',
      location: 'Lobby Utama',
      description: 'Pameran karya fotografi mahasiswa yang menangkap momen-momen indah di lingkungan kampus.',
      is_public: true,
      status: 'Mendatang',
      image_url: 'https://picsum.photos/seed/photoex/800/400'
    },
    {
      title: 'English Club: Weekly Conversation',
      type: 'UKM',
      date: '2024-11-16',
      time: '16:00',
      location: 'Taman Diskusi',
      description: 'Join us for a fun afternoon of English conversation and games. Topic: "Dream Jobs".',
      is_public: true,
      status: 'Terbuka',
      image_url: 'https://picsum.photos/seed/englishclub/800/400'
    }
  ];

  const handleCreateAdmin = async () => {
    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
        // 1. Coba Register
        const { data, error } = await supabase.auth.signUp({
            email: adminEmail,
            password: adminPassword,
            options: {
                data: {
                    full_name: 'Admin User',
                    role: 'organizer'
                }
            }
        });
        
        if (error) throw error;

        // 2. Cek Session
        if (data.user && !data.session) {
             setStatus({ 
                 type: 'warning', 
                 message: 'User berhasil dibuat, namun butuh VERIFIKASI EMAIL. Cek inbox Anda, atau matikan fitur "Confirm Email" di Supabase Dashboard.' 
             });
        } else {
             setStatus({ type: 'success', message: 'User berhasil dibuat dan otomatis login!' });
        }

    } catch (err: any) {
        const errorMsg = getErrorMessage(err);
        
        // Jika errornya "User already registered"
        if (errorMsg.includes('already registered') || err?.code === 'user_already_exists') {
            console.log("User exists, trying to login...");
            
            // Attempt Login
            const { error: loginError } = await supabase.auth.signInWithPassword({
                email: adminEmail,
                password: adminPassword,
            });

            if (loginError) {
                console.error(loginError);
                const loginMsg = getErrorMessage(loginError);
                
                if (loginMsg.includes('Invalid login credentials')) {
                    setStatus({ 
                        type: 'error', 
                        message: 'GAGAL LOGIN: Password salah atau Email belum dikonfirmasi. Coba gunakan email baru dengan tombol "Generate Acak" di atas.' 
                    });
                } else if (loginMsg.includes('Email not confirmed')) {
                    setStatus({ 
                        type: 'warning', 
                        message: 'Email ini sudah terdaftar tapi BELUM DIVERIFIKASI. Silakan cek inbox email Anda atau gunakan email lain.' 
                    });
                } else {
                    setStatus({ type: 'error', message: 'Gagal Login: ' + loginMsg });
                }
            } else {
                setStatus({ type: 'success', message: 'User sudah ada & Berhasil Login otomatis!' });
            }
        } else {
            setStatus({ type: 'error', message: 'Gagal Registrasi: ' + errorMsg });
        }
    } finally {
        setLoading(false);
    }
  };

  const handleSeed = async () => {
    if (!user) {
      setStatus({ type: 'error', message: 'Anda harus login terlebih dahulu untuk mengisi data.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      // Insert Events linked to current User
      console.log("Seeding Events...");
      
      const eventsWithHost = dummyEvents.map((ev) => {
        return {
          ...ev,
          host_id: user.id, // Using current user as host
          organization_id: null // No organization required
        };
      });

      const { error: eventsError } = await supabase
        .from('events')
        .insert(eventsWithHost);

      if (eventsError) throw eventsError;

      setStatus({ type: 'success', message: 'Database berhasil diisi dengan 10 data dummy event! Silakan cek halaman Discover.' });
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: 'Gagal mengisi data: ' + getErrorMessage(error) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-20">
      <Card className="p-8">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Database size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Database & Setup</h1>
            <p className="text-slate-500">
              Tools untuk mempersiapkan database Supabase Anda.
            </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
            <button 
                onClick={() => setActiveTab('seeder')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'seeder' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                1. Data Seeder
            </button>
            <button 
                onClick={() => setActiveTab('schema')}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${activeTab === 'schema' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                2. Schema SQL
            </button>
        </div>

        {/* Status Messages */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-left animate-in fade-in slide-in-from-top-2 ${
              status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 
              status.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
              'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.type === 'success' && <Check className="shrink-0 mt-0.5" size={18} />}
            {status.type === 'warning' && <AlertCircle className="shrink-0 mt-0.5" size={18} />}
            {status.type === 'error' && <AlertCircle className="shrink-0 mt-0.5" size={18} />}
            <div>
                <p className="text-sm font-bold">{status.type === 'error' ? 'Gagal' : status.type === 'warning' ? 'Perhatian' : 'Sukses'}</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{status.message}</p>
            </div>
          </div>
        )}

        {/* TAB 1: SEEDER */}
        {activeTab === 'seeder' && (
            <div className="space-y-8 animate-in slide-in-from-left-4 fade-in duration-300">
                {/* Quick Admin Creation */}
                <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 text-left relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-indigo-200 rounded-full blur-2xl opacity-50"></div>
                    <div className="flex items-center gap-3 mb-4 relative z-10">
                        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                            {user ? <ShieldCheck size={24} /> : <UserPlus size={24} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-indigo-900">
                                {user ? `Login sebagai: ${user.email}` : 'Buat / Masuk Admin'}
                            </h3>
                            <p className="text-xs text-indigo-600">
                                {user ? 'Anda sudah login dan siap generate data.' : 'User otomatis login jika sudah ada.'}
                            </p>
                        </div>
                    </div>
                    
                    {!user && (
                        <div className="space-y-3 relative z-10">
                            <div className="flex items-end gap-2">
                                <div className="flex-grow">
                                    <Input 
                                        label="Email Admin" 
                                        value={adminEmail} 
                                        onChange={(e) => setAdminEmail(e.target.value)}
                                        icon={Mail}
                                        className="bg-white border-indigo-200 focus:border-indigo-500"
                                    />
                                </div>
                                <button 
                                    onClick={generateRandomEmail}
                                    type="button"
                                    className="mb-[1px] p-3.5 bg-white border border-indigo-200 text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-colors"
                                    title="Generate Email Acak"
                                >
                                    <RefreshCw size={20} />
                                </button>
                            </div>

                            <Input 
                                label="Password" 
                                type="password"
                                value={adminPassword} 
                                onChange={(e) => setAdminPassword(e.target.value)}
                                icon={Lock}
                                className="bg-white border-indigo-200 focus:border-indigo-500"
                            />
                            <div className="flex gap-2 pt-2">
                                <Button 
                                    onClick={handleCreateAdmin} 
                                    disabled={loading}
                                    variant="primary"
                                    className="w-full justify-center shadow-indigo-200"
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : 'Buat / Masuk Admin'}
                                </Button>
                            </div>
                            
                        </div>
                    )}
                </div>

                {/* Seeder Action */}
                <div className={`transition-all duration-300 ${!user ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
                    <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Langkah 2: Isi Data Dummy</h3>
                    <p className="text-xs text-slate-500 mb-3">Pastikan tabel 'events' sudah ada. Jika belum, lihat tab Schema SQL.</p>
                    <Button 
                    onClick={handleSeed} 
                    disabled={loading || !user}
                    variant="secondary"
                    className="w-full justify-center h-12 text-lg border-slate-300"
                    >
                    {loading ? <Loader2 className="animate-spin" /> : 'Generate 10 Dummy Events'}
                    </Button>
                </div>
            </div>
        )}

        {/* TAB 2: SCHEMA SQL */}
        {activeTab === 'schema' && (
            <div className="animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
                        <div className="flex items-center gap-2 text-slate-300 text-sm font-mono">
                            <Terminal size={16} /> schema_setup.sql
                        </div>
                        <button 
                            onClick={handleCopySQL}
                            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                        >
                            <Copy size={14} /> Salin SQL
                        </button>
                    </div>
                    <div className="p-4 overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                        <pre className="text-xs md:text-sm font-mono text-indigo-300 leading-relaxed">
                            {sqlScript}
                        </pre>
                    </div>
                </div>
                <div className="mt-6 bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <h4 className="font-bold text-indigo-900 mb-2 text-sm">Cara Menggunakan:</h4>
                    <ol className="list-decimal list-inside text-sm text-indigo-800 space-y-1">
                        <li>Salin kode SQL di atas.</li>
                        <li>Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="underline font-semibold">Supabase Dashboard</a>.</li>
                        <li>Masuk ke menu <strong>SQL Editor</strong>.</li>
                        <li>Tempel kode (Paste) dan klik <strong>Run</strong>.</li>
                        <li>Kembali ke tab <strong>Data Seeder</strong> untuk mengisi data contoh.</li>
                    </ol>
                </div>
            </div>
        )}

      </Card>
    </div>
  );
};

export default Seeder;