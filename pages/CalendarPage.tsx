
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Clock, MapPin, Calendar as CalendarIcon, ArrowRight } from 'lucide-react';
import { Card, Button } from '../components/UI';

const CalendarPage: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  
  // Generating dummy calendar grid with richer data for the modal
  const grid = Array(35).fill(null).map((_, i) => {
    const day = i - 2; // Offset start
    if (day < 1 || day > 30) return null;
    
    // Add fake events to some days
    const hasEvent = [5, 12, 15, 22, 28].includes(day);
    
    const events = [];
    if (hasEvent) {
        // Mock event 1
        events.push({ 
            id: `evt-${day}-1`,
            title: 'Rapat Organisasi BEM', 
            type: 'internal',
            time: '14:00 - 16:00',
            location: 'Ruang Rapat Lt. 2',
            category: 'Organisasi',
            description: 'Rapat bulanan evaluasi program kerja BEM dan persiapan acara akhir tahun.'
        });
        
        // Mock event 2 (on specific date)
        if (day === 15) {
            events.push({
                id: `evt-${day}-2`,
                title: 'Seminar Nasional Tech', 
                type: 'public',
                time: '08:00 - 13:00',
                location: 'Auditorium Utama',
                category: 'Seminar',
                description: 'Seminar akbar membahas perkembangan AI terbaru dengan pembicara dari Google & GoTo.'
            });
        }
    }

    return {
        day,
        events
    };
  });

  const handleEventClick = (e: React.MouseEvent, event: any) => {
    e.stopPropagation();
    setSelectedEvent(event);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Kalender Kegiatan</h1>
                <p className="text-slate-500">Jadwal event kampus bulan November 2024</p>
            </div>
            <div className="flex items-center gap-4">
                <button className="p-2 rounded-full hover:bg-slate-100 transition-colors"><ChevronLeft /></button>
                <span className="font-bold text-lg text-slate-800">November 2024</span>
                <button className="p-2 rounded-full hover:bg-slate-100 transition-colors"><ChevronRight /></button>
            </div>
        </div>

        <Card className="p-0 overflow-hidden shadow-lg border-0">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {days.map(d => (
                    <div key={d} className="py-4 text-center text-sm font-semibold text-slate-600 uppercase tracking-wider">
                        {d}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 bg-white">
                {grid.map((cell, i) => (
                    <div key={i} className="min-h-[140px] border-b border-r border-slate-100 p-2 relative group hover:bg-slate-50/50 transition-colors">
                        {cell && (
                            <>
                                <span className={`text-sm font-medium inline-block mb-2 ${cell.day === 15 ? 'w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-md' : 'text-slate-700'}`}>
                                    {cell.day}
                                </span>
                                <div className="space-y-1.5">
                                    {cell.events.map((ev, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={(e) => handleEventClick(e, ev)}
                                            className={`text-xs px-2.5 py-1.5 rounded-lg truncate font-medium cursor-pointer transition-all hover:scale-[1.02] shadow-sm border border-transparent hover:border-black/5 ${
                                                ev.type === 'public' 
                                                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white' 
                                                : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                            }`}
                                        >
                                            {ev.title}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                ))}
            </div>
        </Card>

        {/* Event Preview Modal */}
        {selectedEvent && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity"
                    onClick={() => setSelectedEvent(null)}
                ></div>

                {/* Modal Content */}
                <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                    {/* Modal Image Header */}
                    <div className="h-40 bg-slate-200 relative">
                        <img 
                            src={`https://picsum.photos/seed/${selectedEvent.id}/800/400`} 
                            alt="Event Banner" 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        
                        <button 
                            onClick={() => setSelectedEvent(null)}
                            className="absolute top-4 right-4 w-8 h-8 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-colors"
                        >
                            <X size={18} />
                        </button>
                        
                        <div className="absolute bottom-4 left-6">
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide backdrop-blur-md border border-white/20 ${
                                selectedEvent.type === 'public' ? 'bg-indigo-500/80 text-white' : 'bg-orange-500/80 text-white'
                             }`}>
                                {selectedEvent.category}
                             </span>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 leading-tight">{selectedEvent.title}</h3>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <CalendarIcon size={16} />
                                </div>
                                <span className="text-sm font-medium">November {selectedEvent.id.split('-')[1]}, 2024</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Clock size={16} />
                                </div>
                                <span className="text-sm font-medium">{selectedEvent.time}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <MapPin size={16} />
                                </div>
                                <span className="text-sm font-medium">{selectedEvent.location}</span>
                            </div>
                        </div>

                        <p className="text-slate-500 text-sm leading-relaxed mb-8">
                            {selectedEvent.description}
                        </p>

                        <div className="flex gap-3">
                            <Link to={`/event/1`} className="flex-1">
                                <Button className="w-full justify-center text-sm h-11">
                                    Lihat Detail <ArrowRight size={16} />
                                </Button>
                            </Link>
                            {selectedEvent.type === 'internal' && (
                                <Button variant="secondary" className="px-4 h-11">
                                    Edit
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default CalendarPage;
