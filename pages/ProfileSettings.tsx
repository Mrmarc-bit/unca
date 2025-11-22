import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Camera, Save, LogOut, Loader2, AlertCircle, Check, UploadCloud } from 'lucide-react';
import { Button, Input, Card } from '../components/UI';
import { useAuth } from '../context/AuthContext';
import { supabase, getErrorMessage, getStorageUrl } from '../services/supabaseClient';

const ProfileSettings: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      // Get name from metadata
      const metaName = user.user_metadata?.full_name || user.user_metadata?.name || '';
      setFullName(metaName);
      
      // Get avatar from metadata
      if (user.user_metadata?.avatar_url) {
          setAvatarUrl(user.user_metadata.avatar_url);
      }
    }
  }, [user]);

  // Handle Profile Text Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      if (error) throw error;
      
      // Also update profiles table if exists
      if (user) {
          await supabase.from('profiles').update({ full_name: fullName }).eq('id', user.id);
      }

      setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  // Handle Avatar Upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (!event.target.files || event.target.files.length === 0) {
          return;
      }
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploading(true);
      setMessage(null);

      try {
          if (!user) throw new Error('User not authenticated');

          // 1. Upload to Supabase Storage 'avatars' bucket
          const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, file);

          if (uploadError) throw uploadError;

          // 2. Get Public URL
          const publicUrl = getStorageUrl(filePath, 'avatars');

          // 3. Update User Metadata
          const { error: updateError } = await supabase.auth.updateUser({
              data: { avatar_url: publicUrl }
          });

          if (updateError) throw updateError;
          
          // 4. Update profiles table mirror
          await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);

          setAvatarUrl(publicUrl);
          setMessage({ type: 'success', text: 'Foto profil berhasil diupload!' });
          
          // Reload page to reflect changes in Navbar (simple way)
          setTimeout(() => window.location.reload(), 1500);

      } catch (error: any) {
          console.error(error);
          setMessage({ type: 'error', text: 'Gagal upload: ' + getErrorMessage(error) });
      } finally {
          setUploading(false);
      }
  };

  // Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) return;
    
    if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'Konfirmasi password tidak cocok.' });
        return;
    }

    if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'Password minimal 6 karakter.' });
        return;
    }

    setPassLoading(true);
    setMessage(null);

    try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Password berhasil diperbarui!' });
        setNewPassword('');
        setConfirmPassword('');
    } catch (err: any) {
        setMessage({ type: 'error', text: getErrorMessage(err) });
    } finally {
        setPassLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  // Logic for displaying avatar: Uploaded URL -> OR -> Cute 3D Character (Dicebear Adventurer)
  const displayAvatar = avatarUrl 
      ? avatarUrl 
      : `https://api.dicebear.com/9.x/adventurer/svg?seed=${user?.email}&backgroundColor=b6e3f4`;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Pengaturan Profil</h1>
        <p className="text-slate-500">Kelola informasi akun dan preferensi Anda.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Actions */}
        <div className="space-y-6">
          <Card className="p-6 text-center">
            <div className="relative w-36 h-36 mx-auto mb-6 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-indigo-50 shadow-lg shadow-indigo-100 bg-indigo-50 transition-transform duration-300 group-hover:scale-105">
                 {uploading ? (
                     <div className="w-full h-full flex items-center justify-center bg-slate-100">
                         <Loader2 className="animate-spin text-indigo-600" size={32} />
                     </div>
                 ) : (
                    <img 
                        src={displayAvatar} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                 )}
              </div>
              
              {/* Camera Overlay */}
              <div className="absolute bottom-1 right-1 bg-indigo-600 text-white p-2.5 rounded-full border-4 border-white shadow-lg transition-transform group-hover:rotate-12 group-hover:scale-110">
                <Camera size={18} />
              </div>

              {/* Hidden File Input */}
              <input 
                 type="file" 
                 ref={fileInputRef}
                 className="hidden"
                 accept="image/png, image/jpeg, image/jpg"
                 onChange={handleAvatarUpload}
              />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 mb-1">{fullName || 'User'}</h3>
            <p className="text-sm text-slate-500 mb-6 truncate px-2">{email}</p>
            
            <div className="pt-6 border-t border-slate-100 space-y-3">
               <Button 
                 variant="secondary" 
                 className="w-full justify-center text-xs h-9"
                 onClick={() => fileInputRef.current?.click()}
                 disabled={uploading}
               >
                 <UploadCloud size={14} /> Ganti Foto
               </Button>
               
               <Button 
                 variant="ghost" 
                 onClick={handleLogout} 
                 className="w-full justify-center text-red-500 hover:bg-red-50 hover:text-red-600 h-9 text-xs"
               >
                 <LogOut size={14} /> Keluar
               </Button>
            </div>
          </Card>
        </div>

        {/* Right Column: Forms */}
        <div className="md:col-span-2 space-y-6">
           
           {/* Global Message Alert */}
           {message && (
              <div className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
                message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

          {/* Profile Info Form */}
          <Card className="p-8">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-4 mb-6">Informasi Dasar</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <Input 
                label="Nama Lengkap" 
                icon={User}
                placeholder="Masukkan nama lengkap"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              
              <div className="opacity-75 cursor-not-allowed">
                <Input 
                  label="Email" 
                  icon={Mail}
                  value={email}
                  disabled
                  className="bg-slate-100 text-slate-500 border-slate-200"
                />
                <p className="text-xs text-slate-400 mt-2 ml-1">Email tidak dapat diubah untuk saat ini.</p>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading} className="shadow-lg shadow-indigo-500/20">
                  {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Simpan Profil</>}
                </Button>
              </div>
            </form>
          </Card>

          {/* Password Update Form */}
          <Card className="p-8">
             <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                <h3 className="text-lg font-bold text-slate-900">Keamanan / Ganti Password</h3>
             </div>
             
             <form onSubmit={handleUpdatePassword} className="space-y-4">
                 <p className="text-sm text-slate-500 mb-2">Jika Anda baru saja melakukan reset password, silakan masukkan password baru di bawah ini.</p>
                 
                 <Input 
                    label="Password Baru" 
                    type="password" 
                    placeholder="Min. 6 karakter" 
                    icon={Lock}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                 <Input 
                    label="Konfirmasi Password Baru" 
                    type="password" 
                    placeholder="Ulangi password baru" 
                    icon={Lock}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="pt-2">
                    <Button type="submit" variant="secondary" disabled={passLoading} className="w-full sm:w-auto">
                        {passLoading ? <Loader2 className="animate-spin" /> : 'Update Password'}
                    </Button>
                </div>
             </form>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;