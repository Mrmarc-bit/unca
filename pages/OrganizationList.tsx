import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users, ArrowRight, Star, Loader2, AlertTriangle } from 'lucide-react';
import { Card, Button, Badge } from '../components/UI';
import { supabase, getStorageUrl, getErrorMessage } from '../services/supabaseClient';
import { Organization } from '../types';

const OrganizationList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrgs = async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*');
        
        if (error) throw error;
        setOrganizations(data || []);
      } catch (err: any) {
        console.error('Error fetching organizations:', err);
        const message = getErrorMessage(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrgs();
  }, []);

  const filteredOrgs = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (org.type && org.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (error) {
      return (
          <div className="max-w-7xl mx-auto px-4 py-20 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">Terjadi Kesalahan</h2>
              <p className="text-slate-600 mb-6 max-w-2xl mx-auto bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-xs text-left overflow-auto whitespace-pre-wrap">
                  {error}
              </p>
              
              {(error.includes('does not exist') || error.includes('42P01')) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-md mx-auto text-left mb-6">
                      <p className="text-sm text-yellow-800 font-medium">Tips:</p>
                      <p className="text-sm text-yellow-700 mt-1">
                          Tabel <strong>'organizations'</strong> belum dibuat di database Supabase. 
                          Silakan jalankan script SQL untuk membuat tabel ini, atau gunakan fitur Seeder.
                      </p>
                  </div>
              )}

              <Link to="/seed">
                <Button>Ke Database Seeder</Button>
              </Link>
          </div>
      );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Organisasi Mahasiswa</h1>
        <p className="text-slate-500 max-w-2xl mx-auto mb-8">
          Temukan komunitas yang sesuai dengan minatmu. Bergabung, berkontribusi, dan kembangkan dirimu bersama organisasi kampus.
        </p>
        
        <div className="max-w-md mx-auto">
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Search size={20} />
                </div>
                <input 
                    type="text" 
                    placeholder="Cari UKM, Himpunan, atau Komunitas..." 
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-full pl-12 pr-4 py-3.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : filteredOrgs.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
            Belum ada organisasi terdaftar. 
            <Link to="/seed" className="text-indigo-600 hover:underline ml-1">Generate Dummy Data?</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrgs.map((org) => (
            <Link key={org.id} to={`/organizations/${org.id}`} className="group">
                <Card className="h-full p-0 overflow-hidden border-0 hover:shadow-xl transition-all duration-300">
                <div className="h-32 bg-slate-200 relative overflow-hidden">
                    <img src={getStorageUrl(org.banner_url) || 'https://via.placeholder.com/800x300?text=Banner'} alt="Banner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                </div>
                
                <div className="px-6 pb-6 relative">
                    <div className="flex justify-between items-end -mt-10 mb-4">
                        <div className="w-20 h-20 rounded-2xl bg-white p-1 shadow-md">
                            <img src={getStorageUrl(org.image_url) || 'https://via.placeholder.com/200?text=Logo'} alt={org.name} className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <Badge status={org.type || 'Umum'} className="mb-2 bg-indigo-50 text-indigo-600 border border-indigo-100" />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">{org.name}</h3>
                    <p className="text-slate-500 text-sm line-clamp-2 mb-4 h-10">
                        {org.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-sm">
                        <div className="flex items-center gap-4 text-slate-500">
                            <span className="flex items-center gap-1"><Users size={14} /> {org.members_count}</span>
                            <span className="flex items-center gap-1"><Star size={14} className="text-orange-400" /> {org.rating || 4.5}</span>
                        </div>
                        <span className="text-indigo-600 font-semibold flex items-center gap-1 text-xs uppercase tracking-wide">
                            Lihat Profil <ArrowRight size={14} />
                        </span>
                    </div>
                </div>
                </Card>
            </Link>
            ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationList;