
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  MapPin, 
  Video, 
  ArrowUpRight, 
  Share2, 
  Copy,
  ChevronsRight,
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Smile,
  CalendarPlus,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle
} from 'lucide-react';
import { Button } from './UI';
import { getStorageUrl } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

interface EventPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}

const EventPreviewModal: React.FC<EventPreviewModalProps> = ({ isOpen, onClose, event }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(false);

  // Reset state when event changes
  useEffect(() => {
    if (isOpen) {
        setIsRegistered(false);
        // In a real app, you would fetch the registration status here
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/#/event/${event.id}`;
    navigator.clipboard.writeText(url);
    // Simple feedback
    const btn = document.getElementById('btn-copy');
    if(btn) btn.innerHTML = 'Disalin!';
    setTimeout(() => {
        if(btn) btn.innerHTML = 'Salin Tautan';
    }, 2000);
  };

  const handleRegisterAction = () => {
    // Logika Utama: Cek User Login
    if (!user) {
        // Jika belum login, arahkan ke Login page
        navigate('/login');
        return;
    }
    
    // Jika sudah login, simulasi daftar (atau navigate ke detail untuk proses)
    // Untuk demo UI "sama persis", kita navigate ke detail
    navigate(`/event/${event.id}`);
  };

  // Helper untuk format tanggal
  const dateObj = new Date(event.date);
  const month = isNaN(dateObj.getTime()) ? 'NOV' : dateObj.toLocaleDateString('id-ID', { month: 'short' }).toUpperCase();
  const day = isNaN(dateObj.getTime()) ? '28' : dateObj.getDate();
  const fullDate = isNaN(dateObj.getTime()) ? event.date : dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const timeString = event.time ? `${event.time} WIB` : 'Waktu belum ditentukan';

  // Logic Icon Online/Offline sesuai request
  const isOnline = event.location?.toLowerCase().includes('virtual') || 
                   event.location?.toLowerCase().includes('online') || 
                   event.location?.toLowerCase().includes('zoom') ||
                   event.location?.toLowerCase().includes('meet');
                   
  const imageUrl = getStorageUrl(event.image_url) || 'https://via.placeholder.com/800x800?text=Event';

  return (
    <div className="fixed inset-0 z-[100] flex justify-end items-start pointer-events-none font-sans">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-300 pointer-events-auto"
        onClick={onClose}
      ></div>

      {/* Modal Panel - Desain Floating Side Panel */}
      <div className="relative w-full max-w-[500px] h-[calc(100vh-16px)] m-2 bg-white rounded-[24px] shadow-2xl flex flex-col animate-in slide-in-from-right-4 duration-300 pointer-events-auto overflow-hidden ring-1 ring-black/5">
        
        {/* Header Section */}
        <div className="absolute top-0 left-0 right-0 h-[68px] flex items-center justify-between px-6 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-50/50">
            <div className="flex items-center gap-3">
                {/* Close Button (Double Chevron) */}
                <button 
                    onClick={onClose}
                    className="p-2 -ml-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
                >
                    <ChevronsRight size={22} />
                </button>
                
                <div className="h-6 w-[1px] bg-slate-200 mx-1" />

                {/* Header Actions (Pill Shape) */}
                <button 
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 transition-colors shadow-sm"
                >
                    <Copy size={14} /> <span id="btn-copy">Salin Tautan</span>
                </button>
                
                <Link to={`/event/${event.id}`}>
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-600 transition-colors shadow-sm">
                        Halaman Acara <ArrowUpRight size={14} />
                    </button>
                </Link>
            </div>
            
            {/* Up/Down Nav */}
            <div className="flex items-center gap-1">
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><ChevronUp size={18} /></button>
                <button className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"><ChevronDown size={18} /></button>
            </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-[80px] px-6 pb-8">
             
             {/* 1. Square Image with Glow */}
             <div className="relative w-full aspect-square mb-6 group select-none">
                 {/* Background Blur Glow */}
                 <div className="absolute inset-6 bg-inherit blur-3xl opacity-50 scale-110 rounded-full z-0">
                    <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                 </div>
                 
                 {/* Main Image */}
                 <div className="relative z-10 w-full h-full rounded-[24px] overflow-hidden shadow-sm ring-1 ring-black/5 bg-slate-100">
                     <img src={imageUrl} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                 </div>
             </div>

             {/* 2. Title & Organizer */}
             <div className="mb-8">
                <h2 className="text-[28px] font-bold text-slate-900 leading-tight mb-4 tracking-tight">{event.title}</h2>
                
                <div className="flex items-center gap-3">
                     <div className="w-7 h-7 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center overflow-hidden shrink-0">
                         <img src={`https://ui-avatars.com/api/?name=${event.type}&background=random`} alt="" className="w-full h-full object-cover" />
                     </div>
                     <p className="text-slate-600 text-sm font-medium truncate">
                        Diselenggarakan oleh <span className="text-slate-900 font-bold">{event.type || 'Panitia Kampus'}</span>
                     </p>
                </div>

                {/* Links & Tags similar to image layout */}
                <div className="flex flex-wrap gap-4 mt-4 text-xs font-medium text-slate-400">
                    <button className="hover:text-indigo-600 transition-colors">Hubungi Penyelenggara</button>
                    <button className="hover:text-indigo-600 transition-colors">Laporkan Acara</button>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">#{event.type?.split(' ')[0] || 'Event'}</span>
                </div>
             </div>

             {/* 3. Info Rows (Date & Location) */}
             <div className="space-y-5 mb-8">
                {/* Date Row */}
                <div className="flex items-start gap-4">
                     {/* Date Widget */}
                     <div className="w-[42px] h-[42px] rounded-[10px] border border-slate-200 flex flex-col items-center justify-center bg-white shrink-0 shadow-sm">
                         <span className="text-[9px] font-bold text-slate-500 uppercase leading-none mt-0.5">{month}</span>
                         <span className="text-lg font-bold text-slate-900 leading-none mb-0.5">{day}</span>
                     </div>
                     <div>
                         <h4 className="font-bold text-slate-900 text-[15px] leading-snug">{fullDate}</h4>
                         <p className="text-slate-500 text-sm mt-0.5">{timeString}</p>
                     </div>
                </div>

                {/* Location Row */}
                <div className="flex items-start gap-4">
                     {/* Location Icon Logic: Camera if Online, Pin if Offline */}
                     <div className="w-[42px] h-[42px] rounded-[10px] border border-slate-200 flex items-center justify-center bg-white shrink-0 shadow-sm text-slate-700">
                         {isOnline ? <Video size={20} /> : <MapPin size={20} />}
                     </div>
                     <div>
                         <h4 className="font-bold text-slate-900 text-[15px] leading-snug">
                            {isOnline ? 'Virtual' : 'Lokasi Langsung'}
                         </h4>
                         <p className="text-slate-500 text-sm mt-0.5">{event.location}</p>
                     </div>
                </div>
             </div>

             {/* 4. Registration / Status Card (Beige) */}
             {/* Background #FDFBF7 matches the "cream" look in reference */}
             <div className="bg-[#FDFBF7] rounded-[20px] p-5 border border-stone-100/50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full bg-[#E3F5E1] flex items-center justify-center text-green-600">
                         <Smile size={18} />
                    </div>
                    <div>
                        <h4 className="font-bold text-[#4A3E38] text-[15px]">
                            {user ? 'Siap Mendaftar?' : 'Pendaftaran Dibuka'}
                        </h4>
                        <p className="text-[#8C8178] text-xs">
                            {user ? 'Amankan tiketmu sekarang.' : 'Login untuk mendaftar event ini.'}
                        </p>
                    </div>
                </div>

                {/* Countdown Mockup */}
                <div className="bg-[#F5F2EB] rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
                    <Clock size={16} className="text-[#8C8178]" />
                    <span className="text-[#6B5D54] text-sm font-medium">Acara dimulai dalam <span className="text-[#C96F45] font-bold">5d 18h</span></span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 mb-3">
                    <button 
                        onClick={handleRegisterAction}
                        className="flex-1 bg-[#5D4E46] hover:bg-[#4a3e38] text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-md shadow-[#5D4E46]/10 flex items-center justify-center gap-2"
                    >
                         {user ? 'Daftar Sekarang' : 'Masuk untuk Daftar'}
                    </button>
                    <button className="px-4 bg-[#EFECE6] hover:bg-[#e5e2dc] text-[#5D4E46] font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                        <Share2 size={18} /> <span className="hidden sm:inline">Undang</span>
                    </button>
                </div>
                
                {/* Secondary Action Link */}
                <div className="text-center">
                     <button className="text-[11px] text-[#8C8178] hover:text-[#5D4E46] underline decoration-stone-300 underline-offset-2">
                        Tidak bisa hadir? Beritahu tuan rumah.
                     </button>
                </div>
             </div>

             {/* 5. Profile Section (Beige Card) */}
             <div className="mt-6">
                 <button className="flex items-center justify-between w-full mb-3 group">
                     <h4 className="font-bold text-slate-900 text-[15px]">Bersiaplah untuk Acara</h4>
                     <ChevronDown size={18} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                 </button>

                 <div className="bg-[#FDFBF7] rounded-[20px] p-5 border border-stone-100/50">
                     {user ? (
                         <>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-[#D3E5FF] flex items-center justify-center text-indigo-600 border-2 border-white shadow-sm">
                                     <UserIcon size={20} />
                                </div>
                                <div className="flex-1">
                                     <p className="text-xs text-[#8C8178]">Profil Anda</p>
                                     <h5 className="font-bold text-[#4A3E38]">{user.email?.split('@')[0] || 'Peserta'}</h5>
                                </div>
                            </div>
                            <button className="w-full bg-[#EFECE6] hover:bg-[#e5e2dc] text-[#5D4E46] font-medium py-2.5 rounded-xl text-xs transition-colors mb-6">
                                Perbarui Profil
                            </button>
                         </>
                     ) : (
                         <div className="text-center py-4">
                             <p className="text-xs text-[#8C8178] mb-3">Anda belum login.</p>
                         </div>
                     )}

                     {/* Settings Toggles */}
                     <div className="space-y-4 pt-2 border-t border-[#EFECE6]">
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-[#4A3E38]">
                                 <Mail size={16} className="text-[#8C8178]" />
                                 <span className="text-xs font-semibold">Email Reminder</span>
                             </div>
                             {/* Mock Toggle */}
                             <div className="w-10 h-6 bg-[#5D4E46] rounded-full relative cursor-pointer">
                                 <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                             </div>
                         </div>
                         <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2 text-[#4A3E38]">
                                 <MessageCircle size={16} className="text-[#8C8178]" />
                                 <span className="text-xs font-semibold">WhatsApp</span>
                             </div>
                             {/* Mock Toggle */}
                             <div className="w-10 h-6 bg-[#EFECE6] rounded-full relative cursor-pointer">
                                 <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default EventPreviewModal;
