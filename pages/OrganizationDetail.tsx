import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Calendar, MapPin, Globe, Instagram, MessageCircle, UserPlus, Settings, ChevronLeft, Loader2 } from 'lucide-react';
import { Button, Card, Badge } from '../components/UI';
import { supabase, getStorageUrl } from '../services/supabaseClient';
import { Organization, Event } from '../types';

const OrganizationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Events');
  const [orgData, setOrgData] = useState<Organization | null>(null);
  const [orgEvents, setOrgEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        if (!id) return;
        try {
            // Fetch Organization Data
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', id)
                .single();
            
            if (orgError) throw orgError;
            setOrgData(org);

            // Fetch Linked Events
            const { data: events, error: eventsError } = await supabase
                .from('events')
                .select('*')
                .eq('organization_id', id)
                .order('date', { ascending: false });

            if (eventsError && eventsError.code !== 'PGRST116') { 
                // Ignore generic errors for events if strictly not found/empty in some cases
                console.warn('Error fetching events:', eventsError);
            }
            setOrgEvents(events || []);

        } catch (err) {
            console.error('Error fetching organization detail:', err);
        } finally {
            setLoading(false);
        }
    };

    fetchData();
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  if (!orgData) return <div className="min-h-screen flex items-center justify-center text-slate-500">Organisasi tidak ditemukan.</div>;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Hero Header */}
      <div className="relative bg-white pb-16">
        <div className="h-64 w-full overflow-hidden relative bg-slate-900">
             <img 
                src={getStorageUrl(orgData.banner_url) || 'https://via.placeholder.com/1200x400?text=Banner'} 
                alt="Banner" 
                className="w-full h-full object-cover opacity-90" 
             />
             <div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/60"></div>
             <Link to="/organizations" className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-2 rounded-full text-white hover:bg-white/40 transition-colors z-10">
                <ChevronLeft size={24} />
             </Link>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
            <div className="flex flex-col md:flex-row items-end md:items-end -mt-12 gap-6">
                <div className="w-32 h-32 rounded-2xl bg-white p-1.5 shadow-xl shrink-0">
                    <img 
                        src={getStorageUrl(orgData.image_url) || 'https://via.placeholder.com/200?text=Logo'} 
                        alt="Logo" 
                        className="w-full h-full object-cover rounded-xl" 
                    />
                </div>
                <div className="flex-grow mb-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">{orgData.name}</h1>
                            <p className="text-slate-500 font-medium">{orgData.type} • Est. 2020</p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="secondary" className="h-10 px-4 text-sm">
                                <MessageCircle size={16} /> Hubungi
                            </Button>
                            <Button className="h-10 px-6 text-sm shadow-indigo-500/20">
                                <UserPlus size={16} /> Gabung
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Left Sidebar Info */}
            <div className="space-y-6">
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-3 text-slate-600">
                        <Users size={20} className="text-indigo-600" />
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Anggota</p>
                            <p className="font-semibold">{orgData.members_count} Mahasiswa</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                        <Calendar size={20} className="text-indigo-600" />
                        <div>
                            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">Event Total</p>
                            <p className="font-semibold">{orgEvents.length} Kegiatan</p>
                        </div>
                    </div>
                    <hr className="border-slate-100" />
                    <div className="flex gap-4 justify-center pt-2">
                        <button className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-pink-100 hover:text-pink-600 transition-colors"><Instagram size={20} /></button>
                        <button className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-blue-100 hover:text-blue-600 transition-colors"><Globe size={20} /></button>
                    </div>
                </Card>

                {/* Admin Action (Simulation) */}
                <Card className="p-6 bg-gradient-to-br from-slate-800 to-slate-900 text-white border-none">
                    <h3 className="font-bold mb-2">Pengurus Organisasi?</h3>
                    <p className="text-slate-300 text-sm mb-4">Kelola event dan anggota organisasimu di sini.</p>
                    <Button variant="secondary" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <Settings size={16} /> Kelola Organisasi
                    </Button>
                </Card>
            </div>

            {/* Main Tabs Area */}
            <div className="lg:col-span-2">
                <div className="flex items-center gap-6 border-b border-slate-200 mb-6 overflow-x-auto no-scrollbar">
                    {['Events', 'Tentang', 'Pengurus'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`pb-3 font-medium text-sm whitespace-nowrap transition-all relative ${
                                activeTab === tab ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab}
                            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></div>}
                        </button>
                    ))}
                </div>

                {activeTab === 'Tentang' && (
                    <Card className="p-8">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Deskripsi Organisasi</h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                            {orgData.description}
                        </p>
                        <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">Visi & Misi</h3>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2.5 shrink-0"></div>
                                <p className="text-slate-600">Mengembangkan potensi mahasiswa secara profesional.</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2.5 shrink-0"></div>
                                <p className="text-slate-600">Menyediakan wadah kolaborasi antar program studi.</p>
                            </div>
                        </div>
                    </Card>
                )}

                {activeTab === 'Events' && (
                    <div className="space-y-4">
                        {orgEvents.length === 0 ? (
                            <div className="text-center py-10 border border-dashed border-slate-300 rounded-xl text-slate-500">
                                Belum ada event yang terkait dengan organisasi ini.
                            </div>
                        ) : (
                            orgEvents.map(event => (
                                <Link key={event.id} to={`/event/${event.id}`}>
                                    <Card className="flex flex-col sm:flex-row gap-4 p-4 hover:border-indigo-300 transition-all group">
                                        <div className="w-full sm:w-48 h-32 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                                            <img src={getStorageUrl(event.imageUrl) || getStorageUrl(event['image_url']) || 'https://via.placeholder.com/300x200'} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <div className="flex-grow py-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <Badge status={event.status || 'Terbuka'} />
                                                    <span className="text-xs text-slate-400">{event.date}</span>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                                                <div className="flex items-center gap-2 text-slate-500 text-sm mt-2">
                                                    <MapPin size={14} /> {event.location}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'Pengurus' && (
                    <div className="grid sm:grid-cols-2 gap-4">
                         {[1, 2, 3, 4].map((i) => (
                             <Card key={i} className="p-4 flex items-center gap-4">
                                 <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden">
                                     <img src={`https://i.pravatar.cc/150?u=${i}`} alt="User" />
                                 </div>
                                 <div>
                                     <h4 className="font-bold text-slate-900">Pengurus {i}</h4>
                                     <p className="text-xs text-slate-500">Divisi Acara</p>
                                 </div>
                             </Card>
                         ))}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationDetail;