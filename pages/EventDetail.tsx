import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Share2, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2,
  Video,
  Smile,
  User as UserIcon,
  Mail,
  MessageCircle,
  ChevronDown,
  Copy
} from 'lucide-react';
import { Button } from '../components/UI';
import { supabase, getStorageUrl, getErrorMessage } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const fetchEventAndStatus = async () => {
      if (!id) return;
      try {
        // 1. Fetch Event Details
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', id)
          .single();

        if (eventError) throw eventError;
        setEvent(eventData);

        // 2. Check if User is Registered (if logged in)
        if (user) {
            const { data: regData } = await supabase
                .from('registrations')
                .select('*')
                .eq('event_id', id)
                .eq('user_id', user.id)
                .single();
            
            if (regData) setIsRegistered(true);
        }

      } catch (err: any) {
        console.error('Error fetching event:', err);
        setError('Gagal memuat detail event.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventAndStatus();
  }, [id, user]);

  const handleRegister = async () => {
      if (!user) {
          // Redirect to login if not authenticated
          navigate('/login');
          return;
      }

      setRegistering(true);
      try {
          const { error } = await supabase
              .from('registrations')
              .insert([
                  { user_id: user.id, event_id: id }
              ]);

          if (error) throw error;

          setIsRegistered(true);
          alert('Berhasil mendaftar! Event ini telah ditambahkan ke Dashboard Anda.');

      } catch (err: any) {
          const msg = getErrorMessage(err);
          alert('Gagal mendaftar: ' + msg);
      } finally {
          setRegistering(false);
      }
  };

  const handleCopyLink = () => {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      alert('Tautan berhasil disalin!');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]"><Loader2 className="animate-spin text-[#5D4E46]" size={40} /></div>;
  if (error || !event) return <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 bg-[#FDFBF7]"><p>{error || 'Event tidak ditemukan'}</p><Link to="/discover"><Button variant="ghost" className="mt-4">Kembali</Button></Link></div>;

  // Format Helpers matching the Modal
  const dateObj = new Date(event.date);
  const month = isNaN(dateObj.getTime()) ? 'NOV' : dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
  const day = isNaN(dateObj.getTime()) ? '28' : dateObj.getDate();
  const fullDate = isNaN(dateObj.getTime()) ? event.date : dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeString = event.time ? `${event.time} WIB` : 'Waktu belum ditentukan';

  const isOnline = event.location?.toLowerCase().includes('virtual') || 
                   event.location?.toLowerCase().includes('online') || 
                   event.location?.toLowerCase().includes('zoom') ||
                   event.location?.toLowerCase().includes('meet');

  return (
    <div className="min-h-screen bg-white pb-20 pt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Breadcrumb / Back */}
            <div className="mb-8 flex items-center justify-between">
                <Link to="/discover" className="inline-flex items-center gap-2 text-slate-500 hover:text-[#5D4E46] transition-colors font-medium">
                    <ArrowLeft size={20} /> Kembali ke Explore
                </Link>
                <div className="flex gap-2">
                    <button onClick={handleCopyLink} className="p-2 rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
                        <Copy size={18} />
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-12 items-start">
                
                {/* LEFT COLUMN: Image (Square with Glow) */}
                <div className="lg:col-span-5 relative">
                    <div className="sticky top-24">
                        <div className="relative w-full aspect-square mb-6 group select-none">
                            {/* Background Blur Glow */}
                            <div className="absolute inset-6 bg-inherit blur-3xl opacity-50 scale-110 rounded-full z-0">
                                <img src={getStorageUrl(event.image_url)} alt="" className="w-full h-full object-cover" />
                            </div>
                            
                            {/* Main Image */}
                            <div className="relative z-10 w-full h-full rounded-[32px] overflow-hidden shadow-sm ring-1 ring-black/5 bg-slate-100">
                                <img 
                                    src={getStorageUrl(event.image_url) || 'https://via.placeholder.com/800x800?text=Event'} 
                                    alt={event.title} 
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                />
                            </div>
                        </div>

                        <div className="hidden lg:block mt-6">
                             <div className="flex flex-col gap-2 text-sm text-slate-500">
                                <p className="font-medium text-slate-900">Diselenggarakan Oleh:</p>
                                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                        {event.type?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-900">{event.type || 'Organisasi Kampus'}</p>
                                        <p className="text-xs text-slate-500">Verified Organizer</p>
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Details & Actions */}
                <div className="lg:col-span-7 space-y-8">
                    
                    {/* Header Info */}
                    <div>
                        <div className="flex gap-3 mb-4">
                            <span className="px-3 py-1 rounded-md bg-[#FDFBF7] border border-[#EFECE6] text-[#5D4E46] text-xs font-bold uppercase tracking-wider">
                                #{event.type?.split(' ')[0]}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 leading-[1.1] mb-6 tracking-tight">
                            {event.title}
                        </h1>

                        {/* Info Widgets */}
                        <div className="flex flex-col sm:flex-row gap-6 border-y border-slate-100 py-6">
                             {/* Date */}
                             <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl border border-slate-200 flex flex-col items-center justify-center bg-white shrink-0 shadow-sm">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase leading-none mt-0.5">{month}</span>
                                    <span className="text-2xl font-bold text-slate-900 leading-none mb-0.5">{day}</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg leading-snug">{fullDate}</h4>
                                    <p className="text-slate-500 text-sm mt-0.5">{timeString}</p>
                                </div>
                             </div>

                             {/* Location */}
                             <div className="flex items-start gap-4 sm:border-l sm:border-slate-100 sm:pl-6">
                                <div className="w-14 h-14 rounded-2xl border border-slate-200 flex items-center justify-center bg-white shrink-0 shadow-sm text-slate-700">
                                    {isOnline ? <Video size={24} /> : <MapPin size={24} />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg leading-snug">
                                        {isOnline ? 'Virtual Event' : 'Lokasi Langsung'}
                                    </h4>
                                    <p className="text-slate-500 text-sm mt-0.5">{event.location}</p>
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Registration Card (The Beige Box) */}
                    <div className="bg-[#FDFBF7] rounded-[32px] p-6 md:p-8 border border-[#EFECE6] relative overflow-hidden">
                         <div className="relative z-10">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-[#E3F5E1] flex items-center justify-center text-green-700">
                                        {isRegistered ? <CheckCircle2 size={24} /> : <Smile size={24} />}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-[#4A3E38]">
                                            {isRegistered ? 'Kamu Sudah Terdaftar!' : (user ? 'Siap Bergabung?' : 'Pendaftaran Dibuka')}
                                        </h3>
                                        <p className="text-[#8C8178] text-sm">
                                            {isRegistered ? 'Simpan tiketmu dan sampai jumpa di lokasi.' : (user ? 'Amankan kursimu sekarang sebelum penuh.' : 'Login akunmu untuk mendaftar event ini.')}
                                        </p>
                                    </div>
                                </div>
                                {isRegistered && (
                                    <div className="px-4 py-2 bg-white rounded-xl border border-[#E3F5E1] text-green-700 font-bold text-sm">
                                        Tiket Terkonfirmasi
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                {isRegistered ? (
                                     <Button variant="secondary" className="flex-1 bg-white border-[#EFECE6] text-[#5D4E46] h-14 rounded-2xl text-base">
                                        Lihat Tiket di Dashboard
                                     </Button>
                                ) : (
                                    <Button 
                                        onClick={handleRegister}
                                        disabled={registering}
                                        className="flex-1 bg-[#5D4E46] hover:bg-[#4a3e38] text-white h-14 rounded-2xl text-base font-bold shadow-xl shadow-[#5D4E46]/10"
                                    >
                                        {registering ? <Loader2 className="animate-spin mr-2" /> : null}
                                        {user ? 'Daftar Sekarang' : 'Masuk untuk Daftar'}
                                    </Button>
                                )}
                                
                                <Button variant="secondary" className="px-6 bg-[#EFECE6] hover:bg-[#e5e2dc] border-transparent text-[#5D4E46] h-14 rounded-2xl">
                                    <Share2 size={20} />
                                </Button>
                            </div>

                            {!isRegistered && (
                                <div className="mt-4 flex items-center gap-2 text-xs text-[#8C8178] font-medium bg-[#F5F2EB] p-3 rounded-xl w-fit">
                                    <Clock size={14} />
                                    Acara dimulai dalam <span className="text-[#C96F45] font-bold">5d 18h 30m</span>
                                </div>
                            )}
                         </div>
                    </div>

                    {/* Profile & Notification Settings Section */}
                    <div className="border-t border-slate-100 pt-8">
                        <div className="bg-white rounded-2xl border border-slate-100 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="font-bold text-slate-900">Pengaturan Notifikasi</h4>
                                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">Opsional</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                            <Mail size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">Email Reminder</p>
                                            <p className="text-xs text-slate-400">H-1 sebelum acara</p>
                                        </div>
                                    </div>
                                    {/* Mock Toggle Active */}
                                    <div className="w-11 h-6 bg-[#5D4E46] rounded-full relative transition-colors">
                                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"></div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                                            <MessageCircle size={16} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-700">WhatsApp Info</p>
                                            <p className="text-xs text-slate-400">Update mendadak</p>
                                        </div>
                                    </div>
                                    {/* Mock Toggle Inactive */}
                                    <div className="w-11 h-6 bg-slate-200 rounded-full relative transition-colors">
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="prose prose-slate prose-lg max-w-none pt-4">
                        <h3 className="font-bold text-slate-900 mb-4">Tentang Acara Ini</h3>
                        <div className="text-slate-600 leading-relaxed whitespace-pre-line">
                            {event.description}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    </div>
  );
};

export default EventDetail;