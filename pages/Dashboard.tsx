
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Users, TrendingUp, Plus, MapPin, Clock, MoreHorizontal, Edit, Eye, Loader2, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, Badge, Button } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { supabase, getStorageUrl, getErrorMessage } from '../services/supabaseClient';
import EventPreviewModal from '../components/EventPreviewModal';

const data = [
  { name: 'Jan', events: 4 },
  { name: 'Feb', events: 7 },
  { name: 'Mar', events: 5 },
  { name: 'Apr', events: 12 },
  { name: 'May', events: 9 },
  { name: 'Jun', events: 15 },
];

const Dashboard: React.FC = () => {
  const [viewMode, setViewMode] = useState<'hosted' | 'attending'>('hosted'); // New Tab State
  const [activeTab, setActiveTab] = useState('Semua');
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      if (!authLoading && !user) {
          navigate('/login');
          return;
      }

      const fetchEvents = async () => {
          if (!user) return;
          setIsLoading(true);
          setError(null);
          
          try {
              if (viewMode === 'hosted') {
                  // Fetch events hosted by me
                  const { data, error } = await supabase
                      .from('events')
                      .select('*')
                      .eq('host_id', user.id)
                      .order('created_at', { ascending: false });
                  
                  if (error) throw error;
                  setEvents(data || []);

              } else {
                  // Fetch events I registered for
                  // Note: We join registrations with events
                  const { data, error } = await supabase
                      .from('registrations')
                      .select(`
                          event_id,
                          events:events (*)
                      `)
                      .eq('user_id', user.id);

                  if (error) throw error;
                  
                  // Flatten structure
                  const flattenedEvents = data?.map((item: any) => item.events) || [];
                  setEvents(flattenedEvents.filter((e: any) => e !== null));
              }

          } catch (err) {
              console.error('Error fetching events:', err);
              const msg = getErrorMessage(err);
              if (msg.includes('[object Object]')) {
                   setError("Terjadi kesalahan sistem (Format error tidak valid).");
              } else {
                   setError(msg);
              }
          } finally {
              setIsLoading(false);
          }
      };

      fetchEvents();
  }, [user, authLoading, navigate, viewMode]);

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <Card className="flex items-center gap-5 p-6">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
      </div>
    </Card>
  );

  const filteredEvents = activeTab === 'Semua' ? events : events.filter(e => e.status === activeTab);

  if (authLoading || isLoading && !events.length) {
      return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  }

  if (error) {
      // Helper to check for missing table errors commonly returned by Supabase/Postgres
      const isMissingTable = error.includes('42P01') || 
                             error.toLowerCase().includes('does not exist') || 
                             error.toLowerCase().includes('relation');

      return (
          <div className="max-w-7xl mx-auto px-4 py-8 text-center min-h-[60vh] flex flex-col items-center justify-center">
              <div className="p-6 bg-red-50 rounded-2xl border border-red-100 inline-block text-left max-w-xl w-full shadow-sm">
                   <h3 className="text-red-800 font-bold flex items-center gap-2 mb-2 text-lg">
                       <AlertCircle className="text-red-600" /> Gagal Memuat Data
                   </h3>
                   <p className="text-red-600 mb-6 text-sm bg-white/50 p-3 rounded-lg border border-red-100 font-mono break-words">
                       {error}
                   </p>
                   
                   {isMissingTable && (
                       <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
                           <h4 className="text-slate-800 font-bold mb-1">Database Belum Dikonfigurasi?</h4>
                           <p className="text-slate-500 text-sm mb-4">
                               Sepertinya tabel <strong>'events'</strong> atau <strong>'registrations'</strong> belum ada di Supabase Anda.
                           </p>
                           <Link to="/seed">
                               <Button variant="primary" className="w-full justify-center py-3">Buka Halaman Setup Database</Button>
                           </Link>
                       </div>
                   )}
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Preview Modal */}
      <EventPreviewModal 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
        event={selectedEvent} 
      />

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Halo, {user?.email}. Berikut ringkasan aktivitasmu.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard icon={Calendar} label="Total Event" value={events.length} color="bg-indigo-100 text-indigo-600" />
        <StatCard icon={Users} label="Total Partisipasi" value="-" color="bg-orange-100 text-orange-600" />
        <StatCard icon={TrendingUp} label="Aktivitas" value="Active" color="bg-green-100 text-green-600" />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Event List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                <button 
                   onClick={() => setViewMode('hosted')}
                   className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'hosted' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Event Saya (Host)
                </button>
                <button 
                   onClick={() => setViewMode('attending')}
                   className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${viewMode === 'attending' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                    Event Diikuti
                </button>
            </div>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              {['Semua', 'Terbuka', 'Selesai'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
                 <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" /></div>
            ) : filteredEvents.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-300">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <Calendar size={24} />
                    </div>
                    <p className="text-slate-900 font-medium">Tidak ada event ditemukan</p>
                    <p className="text-slate-500 text-sm mt-1 mb-4">
                        {viewMode === 'hosted' ? 'Mulai buat event pertamamu.' : 'Cari event seru untuk diikuti.'}
                    </p>
                    <Link to={viewMode === 'hosted' ? "/create-event" : "/discover"}>
                        <Button variant="secondary" className="text-sm">
                            {viewMode === 'hosted' ? 'Buat Event Baru' : 'Jelajahi Event'}
                        </Button>
                    </Link>
                </div>
            ) : (
                filteredEvents.map((event) => (
                <Card key={event.id} className="group flex flex-col sm:flex-row gap-4 p-4 hover:border-indigo-200 transition-colors cursor-pointer">
                    <div 
                        onClick={() => setSelectedEvent(event)}
                        className="w-full sm:w-48 h-32 rounded-xl overflow-hidden bg-slate-200 flex-shrink-0 relative"
                    >
                        <img 
                            src={getStorageUrl(event.image_url) || 'https://via.placeholder.com/300x200?text=No+Image'} 
                            alt={event.title} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between py-1">
                    <div onClick={() => setSelectedEvent(event)}>
                        <div className="flex justify-between items-start mb-2">
                        <Badge status={event.status || 'Draft'} />
                        <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={20} /></button>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-500">
                            <div className="flex items-center gap-1"><Clock size={14} /> {event.date}</div>
                            <div className="flex items-center gap-1"><MapPin size={14} /> {event.location}</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <button 
                            onClick={() => setSelectedEvent(event)}
                            className="text-sm font-medium text-slate-600 hover:text-indigo-600 flex items-center gap-1"
                        >
                            <Eye size={16} /> Preview
                        </button>
                        {viewMode === 'hosted' && (
                            <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                                <Edit size={16} /> Edit
                            </button>
                        )}
                    </div>
                    </div>
                </Card>
                ))
            )}
          </div>
        </div>

        {/* Right: Analytics & Quick Actions */}
        <div className="space-y-6">
            {/* Simple Chart */}
            <Card className="p-6">
                <h3 className="font-bold text-slate-900 mb-6">Statistik Partisipasi</h3>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                            <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.1)'}} />
                            <Bar dataKey="events" radius={[4, 4, 4, 4]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 5 ? '#4f46e5' : '#cbd5e1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Create CTA */}
            <Link to="/create-event">
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/20 group cursor-pointer">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Buat Event Baru</h3>
                    <p className="text-indigo-100 text-sm mb-4">Mulai rencanakan kegiatanmu selanjutnya dengan bantuan AI.</p>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        Mulai Sekarang <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">→</div>
                    </div>
                </div>
            </Link>
        </div>
      </div>

      {/* Floating Action Button Mobile */}
      <Link to="/create-event" className="md:hidden fixed bottom-6 right-6 z-50">
        <button className="w-14 h-14 rounded-full bg-indigo-600 text-white shadow-xl flex items-center justify-center">
            <Plus size={28} />
        </button>
      </Link>
    </div>
  );
};

export default Dashboard;
