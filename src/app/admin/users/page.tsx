"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Users2, 
  UserPlus, 
  Search, 
  MoreVertical, 
  Shield, 
  MapPin,
  Phone,
  Mail,
  Loader2,
  X,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function UsersPage() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "APOIADOR",
    cityIds: [] as string[]
  });
  const [cities, setCities] = useState<any[]>([]);
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    fetchUsers();
    fetchCities();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      if (data.users) setUsers(data.users);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await fetch("/api/admin/cities");
      const data = await res.json();
      if (data.cities) setCities(data.cities);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.details ? `${data.error}: ${data.details}` : (data.error || "Erro ao criar usuário"));
      }

      setStatus({ type: "success", message: "Usuário criado com sucesso!" });
      setIsModalOpen(false);
      fetchUsers();
      setNewUser({ name: "", email: "", phone: "", password: "", role: "APOIADOR", cityIds: [] });
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2 flex items-center gap-4">
            <Users2 className="w-10 h-10 text-amber-500" />
            Gestão de Usuários
          </h1>
          <p className="text-zinc-500 font-medium">Controle de acessos e permissões por cidade</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-4 rounded-2xl font-black flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-amber-500/20"
        >
          <UserPlus className="w-5 h-5" />
          Novo Usuário
        </button>
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-zinc-500" />
        </div>
        <input
          type="text"
          placeholder="Buscar por nome ou email..."
          className="w-full bg-[#111111] border border-zinc-800/50 rounded-2xl py-5 pl-16 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="col-span-full bg-[#111111] border border-zinc-800/50 rounded-3xl p-20 text-center">
            <p className="text-zinc-500 font-bold">Nenhum usuário encontrado</p>
          </div>
        ) : (
          filteredUsers.map((user, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={user.id}
              className="bg-[#111111] border border-zinc-800/50 rounded-3xl p-6 hover:border-amber-500/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center font-black text-black text-xl shadow-lg shadow-amber-500/10">
                  {user.name.charAt(0)}
                </div>
                <div className="bg-zinc-900/80 px-4 py-1.5 rounded-full border border-zinc-800/50">
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <h3 className="text-xl font-bold text-white mb-4 truncate">{user.name}</h3>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium">
                  <Phone className="w-4 h-4" />
                  {user.phone || "Sem telefone"}
                </div>
                <div className="flex items-center gap-3 text-zinc-500 text-sm font-medium">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    {user.cities && user.cities.length > 0 
                      ? user.cities.map((c: any) => c.name).join(", ") 
                      : "Sem cidade vinculada"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/50 flex gap-2">
                <button className="flex-1 py-2 rounded-xl bg-zinc-800/50 text-white font-bold text-xs hover:bg-zinc-800 transition-all">
                  Editar
                </button>
                <button className="px-3 py-2 rounded-xl bg-red-500/5 text-red-500/50 hover:bg-red-500 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Modal Criar Usuário */}
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
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-white">Novo Usuário</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-zinc-500 hover:text-white transition-all">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Nome</label>
                    <input
                      required
                      type="text"
                      className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Email</label>
                    <input
                      required
                      type="email"
                      className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Telefone</label>
                    <input
                      type="text"
                      className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                      value={newUser.phone}
                      onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Senha</label>
                    <input
                      required
                      type="password"
                      className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Função (Role)</label>
                  <select
                    className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium appearance-none"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="APOIADOR">Apoiador (Check-in)</option>
                    {["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER"].includes(session?.user?.role as string) && (
                      <option value="LOCAL_LEADER">Líder Local (Gestão Cidade)</option>
                    )}
                    {["MASTER_ADMIN", "GLOBAL_LEADER"].includes(session?.user?.role as string) && (
                      <option value="REGIONAL_LEADER">Líder Regional (Multi-Cidades)</option>
                    )}
                    {["MASTER_ADMIN", "GLOBAL_LEADER"].includes(session?.user?.role as string) && (
                      <option value="GLOBAL_LEADER">Líder Global (Visualização Total)</option>
                    )}
                    {session?.user?.role === "MASTER_ADMIN" && (
                      <option value="MASTER_ADMIN">Master Admin (Config. Sistema)</option>
                    )}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Cidades Atreladas (Opcional)</label>
                  <div className="flex flex-wrap gap-2">
                    {cities.map(city => {
                      const isSelected = newUser.cityIds.includes(city.id);
                      return (
                        <button
                          key={city.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setNewUser({...newUser, cityIds: newUser.cityIds.filter(id => id !== city.id)});
                            } else {
                              setNewUser({...newUser, cityIds: [...newUser.cityIds, city.id]});
                            }
                          }}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2",
                            isSelected 
                              ? "bg-amber-500 border-amber-500 text-black" 
                              : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                          )}
                        >
                          {isSelected ? <Check className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                          {city.name}
                        </button>
                      );
                    })}
                  </div>
                  {cities.length === 0 && <p className="text-xs text-zinc-600 pl-2">Nenhuma cidade cadastrada</p>}
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
                  Finalizar Cadastro
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
