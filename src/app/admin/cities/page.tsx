"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  MapPin, 
  Plus, 
  Search, 
  Globe, 
  Building2,
  Calendar,
  Users,
  Loader2,
  X,
  ChevronRight,
  Check,
  Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function CitiesPage() {
  const { data: session } = useSession();
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCity, setEditingCity] = useState<any>(null);
  const [newCity, setNewCity] = useState({
    name: "",
    slug: "",
    regionName: "",
    regionalLeaderIds: [] as string[],
    localLeaderIds: [] as string[]
  });
  const [potentialLeaders, setPotentialLeaders] = useState<any[]>([]);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    fetchCities();
    fetchPotentialLeaders();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await fetch("/api/admin/cities");
      const data = await res.json();
      if (Array.isArray(data)) setCities(data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPotentialLeaders = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) {
        // Show all users as potential leaders
        setPotentialLeaders(data.users);
      }
    } catch (error) {
      console.error("Error fetching potential leaders:", error);
    }
  };

  const handleCreateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/admin/cities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCity),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details ? `${data.error}: ${data.details}` : (data.error || "Erro ao criar cidade"));
      }

      setStatus({ type: "success", message: "Cidade criada com sucesso!" });
      setTimeout(() => {
        setIsModalOpen(false);
        fetchCities();
        setNewCity({ name: "", slug: "", regionName: "", regionalLeaderIds: [], localLeaderIds: [] });
        setStatus({ type: "", message: "" });
      }, 1500);
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch(`/api/admin/cities/${editingCity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCity),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar cidade");
      }

      setStatus({ type: "success", message: "Cidade atualizada com sucesso!" });
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingCity(null);
        fetchCities();
        setStatus({ type: "", message: "" });
      }, 1500);
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCity = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta cidade? Esta ação é irreversível e afetará eventos vinculados.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/cities/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchCities();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir cidade");
      }
    } catch (error) {
      console.error("Error deleting city:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-4">
            <Building2 className="w-10 h-10 text-amber-500" />
            Cidades & Expansão
          </h1>
          <p className="text-zinc-500 font-medium">Gestão global de unidades CRIE no mundo</p>
        </div>

        {session?.user?.role === "MASTER_ADMIN" && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-5 h-5" />
            Adicionar Cidade
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
        ) : cities.length === 0 ? (
          <div className="col-span-full bg-[#111111] border border-zinc-800/50 rounded-3xl p-20 text-center">
            <p className="text-zinc-500 font-bold">Nenhuma cidade cadastrada</p>
          </div>
        ) : (
          cities.map((city, idx) => (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={city.id}
              className="bg-[#111111] overflow-hidden border border-zinc-800/50 rounded-3xl group relative"
            >
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all group-hover:scale-125">
                 <Globe className="w-24 h-24 text-white" />
              </div>

              <div className="p-8 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800">
                    <MapPin className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white">{city.name}</h3>
                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest">{city.regionName || "Global"}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between text-zinc-400">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-tighter">
                      <Calendar className="w-4 h-4 text-zinc-600" />
                      Eventos
                    </div>
                    <span className="text-white font-black">{city._count.events}</span>
                  </div>
                  <Link href="/admin/members" className="flex items-center justify-between text-zinc-400 group/members relative cursor-pointer hover:text-white transition-colors block">
                    <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-tighter">
                      <Users className="w-4 h-4 text-zinc-600 group-hover/members:text-amber-500 transition-colors" />
                      Membros
                    </div>
                    <span className="text-white font-black">{city._count.users}</span>
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/members:opacity-100 transition-opacity whitespace-nowrap bg-amber-500 text-black font-black text-[10px] uppercase px-2 py-1 rounded-lg pointer-events-none">
                      Aceder ao menu Membros
                    </span>
                  </Link>
                </div>

                <div className="mt-auto pt-6 border-t border-zinc-800/50 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Regionais</p>
                      <p className="text-xs font-bold text-zinc-300 truncate">
                        {city.regionalLeaders && city.regionalLeaders.length > 0
                          ? city.regionalLeaders.map((u: any) => u.name).join(", ")
                          : "---"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Locais</p>
                      <p className="text-xs font-bold text-zinc-300 truncate">
                        {city.localLeaders && city.localLeaders.length > 0 
                          ? city.localLeaders.map((u: any) => u.name).join(", ") 
                          : "---"}
                      </p>
                    </div>
                  </div>

                  {session?.user?.role === "MASTER_ADMIN" && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingCity({
                            id: city.id,
                            name: city.name,
                            regionName: city.regionName || "",
                            regionalLeaderIds: city.regionalLeaders?.map((u: any) => u.id) || [],
                            localLeaderIds: city.localLeaders?.map((u: any) => u.id) || []
                          });
                          setIsEditModalOpen(true);
                        }}
                        className="flex-1 py-2 rounded-xl bg-zinc-800/50 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteCity(city.id)}
                        className="px-3 py-2 rounded-xl bg-red-500/5 text-red-500/50 hover:bg-red-500 hover:text-white transition-all transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Criar Cidade */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white">Nova Cidade</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateCity} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Nome da Cidade</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Porto"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                    value={newCity.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-');
                      setNewCity({...newCity, name, slug});
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2 font-medium">Região / Estado</label>
                  <input
                    type="text"
                    placeholder="Ex: Norte"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                    value={newCity.regionName}
                    onChange={(e) => setNewCity({...newCity, regionName: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Líderes Regionais (Dedicado)</label>
                  <div className="flex flex-wrap gap-2">
                    {potentialLeaders.map(leader => {
                      const isSelected = newCity.regionalLeaderIds.includes(leader.id);
                      return (
                        <button
                          key={'reg-'+leader.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewCity({...newCity, regionalLeaderIds: newCity.regionalLeaderIds.filter(id => id !== leader.id)});
                            } else {
                              setNewCity({...newCity, regionalLeaderIds: [...newCity.regionalLeaderIds, leader.id]});
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black border transition-all flex items-center gap-2 uppercase tracking-tighter",
                            isSelected 
                              ? "bg-amber-500 border-amber-500 text-black" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          )}
                        >
                          {isSelected ? <Check className="w-3" /> : <Shield className="w-3" />}
                          {leader.name} ({leader.role})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Líderes Locais (Operação)</label>
                  <div className="flex flex-wrap gap-2">
                    {potentialLeaders.map(leader => {
                      const isSelected = newCity.localLeaderIds.includes(leader.id);
                      return (
                        <button
                          key={leader.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewCity({...newCity, localLeaderIds: newCity.localLeaderIds.filter(id => id !== leader.id)});
                            } else {
                              setNewCity({...newCity, localLeaderIds: [...newCity.localLeaderIds, leader.id]});
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black border transition-all flex items-center gap-2 uppercase tracking-tighter",
                            isSelected 
                              ? "bg-amber-500 border-amber-500 text-black" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          )}
                        >
                          {isSelected ? <Check className="w-3" /> : <Shield className="w-3" />}
                          {leader.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {status.message && (
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-bold",
                    status.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {status.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Cadastrar Unidade
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Editar Cidade */}
      <AnimatePresence>
        {isEditModalOpen && editingCity && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsEditModalOpen(false); setEditingCity(null); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white">Editar Cidade</h2>
                <button onClick={() => { setIsEditModalOpen(false); setEditingCity(null); }} className="p-2 text-zinc-500 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdateCity} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Nome da Cidade</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                    value={editingCity.name}
                    onChange={(e) => setEditingCity({...editingCity, name: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2 font-medium">Região / Estado</label>
                  <input
                    type="text"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                    value={editingCity.regionName}
                    onChange={(e) => setEditingCity({...editingCity, regionName: e.target.value})}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Líderes Regionais (Dedicado)</label>
                  <div className="flex flex-wrap gap-2">
                    {potentialLeaders.map(leader => {
                      const isSelected = editingCity.regionalLeaderIds.includes(leader.id);
                      return (
                        <button
                          key={'reg-'+leader.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setEditingCity({...editingCity, regionalLeaderIds: editingCity.regionalLeaderIds.filter((id: string) => id !== leader.id)});
                            } else {
                              setEditingCity({...editingCity, regionalLeaderIds: [...editingCity.regionalLeaderIds, leader.id]});
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black border transition-all flex items-center gap-2 uppercase tracking-tighter",
                            isSelected 
                              ? "bg-amber-500 border-amber-500 text-black" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          )}
                        >
                          {isSelected ? <Check className="w-3" /> : <Shield className="w-3" />}
                          {leader.name} ({leader.role})
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Líderes Locais (Operação)</label>
                  <div className="flex flex-wrap gap-2">
                    {potentialLeaders.map(leader => {
                      const isSelected = editingCity.localLeaderIds.includes(leader.id);
                      return (
                        <button
                          key={leader.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setEditingCity({...editingCity, localLeaderIds: editingCity.localLeaderIds.filter((id: string) => id !== leader.id)});
                            } else {
                              setEditingCity({...editingCity, localLeaderIds: [...editingCity.localLeaderIds, leader.id]});
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black border transition-all flex items-center gap-2 uppercase tracking-tighter",
                            isSelected 
                              ? "bg-amber-500 border-amber-500 text-black" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          )}
                        >
                          {isSelected ? <Check className="w-3" /> : <Shield className="w-3" />}
                          {leader.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {status.message && (
                  <div className={cn(
                    "p-4 rounded-2xl text-sm font-bold",
                    status.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {status.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                  Salvar Alterações
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
