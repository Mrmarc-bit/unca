import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Calendar, MapPin, Type, Sparkles, Check, Info, Image as ImageIcon, X, Loader2 } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { generateEventDescription } from '../services/geminiService';
import { supabase, getErrorMessage } from '../services/supabaseClient';
import { useAuth } from '../context/AuthContext';

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    type: 'Seminar',
    date: '',
    time: '',
    location: '',
    description: '',
    isPublic: true,
    ticketType: 'Gratis'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("Ukuran file terlalu besar! Maksimal 5MB.");
        return;
      }
      setBannerFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setBannerPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBanner = (e: React.MouseEvent) => {
    e.preventDefault();
    setBannerFile(null);
    setBannerPreview(null);
  };

  const handleAiGenerate = async () => {
    if (!formData.title || !formData.type) {
      alert("Mohon isi Judul dan Tipe Event terlebih dahulu.");
      return;
    }

    setIsGenerating(true);
    const result = await generateEventDescription(formData.title, formData.type, formData.location || 'Kampus UNUGHA');
    setFormData(prev => ({ ...prev, description: result }));
    setIsGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        alert("Anda harus login untuk membuat event.");
        navigate('/login');
        return;
    }

    setIsSubmitting(true);

    try {
        let imagePath = null;

        // 1. Upload Image if exists
        if (bannerFile) {
            const fileExt = bannerFile.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('banners')
                .upload(filePath, bannerFile);

            if (uploadError) throw uploadError;
            imagePath = filePath;
        }

        // 2. Insert Event Data
        const { error: insertError } = await supabase
            .from('events')
            .insert([
                {
                    title: formData.title,
                    date: formData.date,
                    time: formData.time,
                    location: formData.location,
                    description: formData.description,
                    type: formData.type,
                    is_public: formData.isPublic,
                    host_id: user.id,
                    image_url: imagePath,
                    status: 'Terbuka'
                }
            ]);

        if (insertError) throw insertError;

        navigate('/dashboard');
    } catch (error: any) {
        console.error('Error creating event:', error);
        alert('Gagal membuat event: ' + getErrorMessage(error));
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 pb-32">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Buat Acara Baru</h1>
        <p className="text-slate-500 mt-2">Lengkapi detail acara untuk mempublikasikannya.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 0: Banner Upload */}
        <Card className="p-8">
           <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Banner Event</h3>
           
           <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-all group">
               <input 
                   type="file" 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                   accept="image/png, image/jpeg, image/jpg"
                   onChange={handleImageChange}
               />
               
               {bannerPreview ? (
                   <>
                       <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 pointer-events-none">
                           <p className="text-white font-medium flex items-center gap-2"><Upload size={20}/> Ganti Banner</p>
                       </div>
                       <button 
                          onClick={removeBanner}
                          className="absolute top-4 right-4 z-30 bg-white/20 backdrop-blur-md hover:bg-red-500 hover:text-white text-white p-2 rounded-full transition-colors"
                       >
                          <X size={18} />
                       </button>
                   </>
               ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 pointer-events-none">
                       <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                           <ImageIcon size={32} />
                       </div>
                       <p className="text-lg font-semibold text-slate-700">Upload Banner Event</p>
                       <p className="text-sm mt-1 text-slate-400">Format PNG, JPG (Max. 5MB)</p>
                       <p className="text-xs mt-4 text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Rekomendasi: 1280 x 720 px</p>
                   </div>
               )}
           </div>
        </Card>

        {/* Section 1: Basic Info */}
        <Card className="p-8 space-y-6">
           <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Detail Dasar</h3>
           
           <div className="grid md:grid-cols-2 gap-6">
             <div className="md:col-span-2">
                <Input 
                    label="Nama Event" 
                    name="title"
                    placeholder="Contoh: Seminar Nasional AI 2024" 
                    icon={Type} 
                    value={formData.title}
                    onChange={handleChange}
                    required
                />
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Kategori</label>
                <select 
                    name="type"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl px-4 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={formData.type}
                    onChange={handleChange}
                >
                    <option>Seminar</option>
                    <option>Workshop</option>
                    <option>Lomba</option>
                    <option>Seni Budaya</option>
                    <option>Teknologi</option>
                </select>
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Status Kepesertaan</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                        type="button"
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${formData.isPublic ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        onClick={() => setFormData({...formData, isPublic: true})}
                    >
                        Publik
                    </button>
                    <button 
                        type="button"
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${!formData.isPublic ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                        onClick={() => setFormData({...formData, isPublic: false})}
                    >
                        Internal
                    </button>
                </div>
             </div>
           </div>
        </Card>

        {/* Section 2: Time & Location */}
        <Card className="p-8 space-y-6">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4">Waktu & Tempat</h3>
            <div className="grid md:grid-cols-2 gap-6">
                <Input 
                    type="date" 
                    label="Tanggal Mulai" 
                    name="date"
                    icon={Calendar} 
                    value={formData.date}
                    onChange={handleChange}
                    required
                />
                <Input 
                    type="time" 
                    label="Waktu Mulai" 
                    name="time"
                    icon={Calendar}
                    value={formData.time}
                    onChange={handleChange}
                    required
                />
                <div className="md:col-span-2">
                    <Input 
                        label="Lokasi" 
                        name="location"
                        placeholder="Nama Gedung / Link Meeting" 
                        icon={MapPin} 
                        value={formData.location}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>
        </Card>

        {/* Section 3: Description (AI Integrated) */}
        <Card className="p-8 space-y-6 border-indigo-100 shadow-indigo-100/50">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Deskripsi</h3>
                <button 
                    type="button"
                    onClick={handleAiGenerate}
                    disabled={isGenerating}
                    className="flex items-center gap-2 text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                    <Sparkles size={16} />
                    {isGenerating ? 'Menulis...' : 'AI Magic Write'}
                </button>
            </div>
            
            <div>
                <textarea 
                    name="description"
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    placeholder="Jelaskan detail acara..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                ></textarea>
                <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                    <Info size={12} />
                    Gunakan tombol AI Magic Write untuk membuat deskripsi otomatis berdasarkan judul.
                </p>
            </div>
        </Card>

        {/* Bottom Action Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-30">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <Button type="button" variant="ghost" disabled={isSubmitting}>Simpan Draft</Button>
                <Button type="submit" className="w-48 shadow-xl shadow-indigo-500/20" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Check size={18} /> Publikasikan</>}
                </Button>
            </div>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;