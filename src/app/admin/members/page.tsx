"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Users, 
  UserPlus, 
  Search, 
  Shield, 
  MapPin,
  Phone,
  Mail,
  Loader2,
  X,
  Check,
  Briefcase,
  Building2,
  Euro,
  Plus,
  Clock,
  ExternalLink,
  ChevronDown,
  Star,
  Trash2,
  CreditCard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Member {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  industry?: string;
  status: string;
  createdAt: string;
  cityId: string;
  city: { name: string };
  payments: any[];
}

export default function MembersPage() {
  return (
    <Suspense fallback={<div className="p-20 flex justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-500" /></div>}>
      <MembersContent />
    </Suspense>
  );
}

function MembersContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [cities, setCities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCityId, setSelectedCityId] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    industry: "",
    cityId: ""
  });

  const [guestSearch, setGuestSearch] = useState("");
  const [guestResults, setGuestResults] = useState<any[]>([]);
  const [searchingGuests, setSearchingGuests] = useState(false);

  const [editingMember, setEditingMember] = useState<any>(null);
  const [paymentData, setPaymentData] = useState({
    memberId: "",
    memberName: "",
    amount: 15.00,
    date: new Date().toISOString().split('T')[0],
    description: "Mensalidade CRIE"
  });

  const [status, setStatus] = useState({ type: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchMembers();
    fetchCities();

    // Check query params to auto-open modal
    const add = searchParams.get("add");
    const searchVal = searchParams.get("search");
    if (add === "true") {
       setIsModalOpen(true);
       if (searchVal) {
          handleGuestSearch(searchVal);
       }
       // Limpar URL
       router.replace("/admin/members", { scroll: false });
    }
  }, [selectedCityId]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/members?cityId=${selectedCityId}`);
      const data = await res.json();
      if (Array.isArray(data)) setMembers(data);
    } catch (error) {
      console.error("Error fetching members:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await fetch("/api/admin/cities");
      const data = await res.json();
      if (Array.isArray(data)) setCities(data);
    } catch (error) {
      console.error("Error fetching cities:", error);
    }
  };

  const handleGuestSearch = async (val: string) => {
    setGuestSearch(val);
    if (val.length < 3) {
      setGuestResults([]);
      return;
    }

    setSearchingGuests(true);
    try {
      console.log(`Searching for guest: ${val}`);
      const res = await fetch(`/api/admin/attendees?search=${encodeURIComponent(val)}`);
      const data = await res.json();
      console.log(`Found ${data.attendees?.length || 0} attendees`);
      if (data.attendees) {
        setGuestResults(data.attendees.slice(0, 5));
      }
    } catch (err) {
      console.error("Guest Search Error:", err);
    } finally {
      setSearchingGuests(false);
    }
  };

  const selectGuest = (guest: any) => {
    setNewMember({
      name: guest.name,
      email: guest.email,
      phone: guest.phone || "",
      company: guest.company || "",
      industry: guest.industry || "",
      cityId: guest.event?.cityId || ""
    });
    setGuestResults([]);
    setGuestSearch("");
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMember),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar membro");
      }

      setStatus({ type: "success", message: "Membro criado com sucesso!" });
      setTimeout(() => {
        setIsModalOpen(false);
        setNewMember({ name: "", email: "", phone: "", company: "", industry: "", cityId: "" });
        setStatus({ type: "", message: "" });
        fetchMembers();
      }, 1500);
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingMember),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar membro");
      }

      setStatus({ type: "success", message: "Membro atualizado com sucesso!" });
      setTimeout(() => {
        setIsEditModalOpen(false);
        setEditingMember(null);
        setStatus({ type: "", message: "" });
        fetchMembers();
      }, 1500);
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/admin/members/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao registrar pagamento");
      }

      setStatus({ type: "success", message: "Pagamento registrado com sucesso!" });
      setTimeout(() => {
        setIsPaymentModalOpen(false);
        setStatus({ type: "", message: "" });
        fetchMembers();
      }, 1500);
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este membro?")) return;
    
    try {
      const res = await fetch(`/api/admin/members?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao excluir membro");
      }
    } catch (error) {
      console.error("Error deleting member:", error);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase flex items-center gap-3">
             <Star className="w-10 h-10 text-amber-500 fill-amber-500" />
             Base de Membros
          </h1>
          <p className="text-zinc-500 font-medium">Gestão de membros ativos e controle de mensalidades.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-3">
             <MapPin className="w-4 h-4 text-zinc-500" />
             <select 
               value={selectedCityId}
               onChange={(e) => setSelectedCityId(e.target.value)}
               className="bg-transparent text-xs font-bold uppercase tracking-tight text-white focus:outline-none appearance-none cursor-pointer"
             >
               <option value="all">Todas as Cidades</option>
               {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
             </select>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-4 bg-amber-500 text-black font-black rounded-2xl hover:bg-amber-400 transition-all text-[11px] uppercase shadow-lg shadow-amber-500/20"
          >
            <UserPlus className="w-4 h-4" />
            Novo Membro
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
        <input
          type="text"
          placeholder="Pesquisar por nome, email ou empresa..."
          className="w-full bg-[#111111] border border-zinc-800 rounded-3xl py-6 pl-16 pr-8 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4">
             <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
             <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Carregando membros...</p>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-[#0f0f0f] border border-zinc-800 rounded-[40px]">
             <Users className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
             <p className="text-zinc-500 font-bold">Nenhum membro encontrado.</p>
          </div>
        ) : (
          filteredMembers.map((member, idx) => {
            const lastPayment = member.payments?.[0];
            const isLate = !lastPayment || new Date(lastPayment.date) < new Date(new Date().setMonth(new Date().getMonth() - 1));

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={member.id}
                className="bg-[#0f0f0f] border border-zinc-800/80 rounded-[32px] p-8 flex flex-col hover:border-amber-500/30 transition-all group relative overflow-hidden"
              >
                {/* Status Badge */}
                <div className="absolute top-0 right-0 p-6">
                   <div className={cn(
                     "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                     member.status === "Ativo" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"
                   )}>
                     {member.status}
                   </div>
                </div>

                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center font-black text-black text-2xl mb-6 shadow-xl shadow-amber-500/10 group-hover:scale-110 transition-transform">
                   {member.name.charAt(0)}
                </div>

                <h3 className="text-xl font-black text-white mb-2 truncate uppercase tracking-tight">{member.name}</h3>
                
                <div className="space-y-4 mb-8 flex-1">
                   <div className="flex items-center gap-3 text-zinc-500 text-xs font-bold">
                     <Mail className="w-3.5 h-3.5" />
                     <span className="truncate">{member.email}</span>
                   </div>
                   <div className="flex items-center gap-3 text-zinc-500 text-xs font-bold">
                     <Building2 className="w-3.5 h-3.5 text-amber-500/50" />
                     <span className="truncate">{member.company || "Profissional Liberal"} • {member.industry}</span>
                   </div>
                   <div className="flex items-center gap-3 text-zinc-500 text-xs font-bold">
                     <MapPin className="w-3.5 h-3.5" />
                     <span>{member.city.name}</span>
                   </div>
                </div>

                {/* Financial Status */}
                <div className="bg-black/40 rounded-2xl p-4 mb-6 border border-zinc-800/50">
                   <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Último Pagamento</p>
                      {isLate ? (
                        <span className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase"><Clock className="w-3 h-3" />Em Atraso</span>
                      ) : (
                        <span className="flex items-center gap-1 text-[9px] font-black text-green-500 uppercase"><Check className="w-3 h-3" />Em Dia</span>
                      )}
                   </div>
                   <p className="text-sm font-black text-white">
                      {lastPayment ? new Date(lastPayment.date).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : "Nenhum histórico"}
                   </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <button 
                     onClick={() => {
                        setEditingMember(member);
                        setIsEditModalOpen(true);
                     }}
                     className="py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                     Editar
                   </button>
                   <button 
                     onClick={() => {
                        setPaymentData({
                          memberId: member.id,
                          memberName: member.name,
                          amount: 15.00,
                          date: new Date().toISOString().split('T')[0],
                          description: "Mensalidade CRIE"
                        });
                        setIsPaymentModalOpen(true);
                     }}
                     className="py-3.5 bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                     Lançar Pago
                   </button>
                </div>
                
                <button 
                  onClick={() => handleDeleteMember(member.id)}
                  className="absolute bottom-8 right-8 p-2 opacity-0 group-hover:opacity-100 text-zinc-800 hover:text-red-500 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Modal Criar Membro */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight">Novo Membro CRIE</h2>
              
              <div className="mb-6 relative">
                 <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2 mb-2 block">Buscar nos Inscritos (Opcional)</label>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input 
                      placeholder="Pesquisar convidado por nome..." 
                      className="w-full bg-[#111111] border border-zinc-800 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 text-sm"
                      value={guestSearch}
                      onChange={(e) => handleGuestSearch(e.target.value)}
                    />
                    {searchingGuests && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-spin" />}
                 </div>

                 <AnimatePresence>
                    {(guestResults.length > 0 || (guestSearch.length >= 3 && !searchingGuests)) && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute left-0 right-0 top-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden z-[110] shadow-2xl"
                      >
                         {guestResults.length > 0 ? (
                           guestResults.map(g => (
                             <button 
                               key={g.id}
                               type="button"
                               onClick={() => selectGuest(g)}
                               className="w-full text-left px-5 py-3 hover:bg-amber-500 hover:text-black transition-all group"
                             >
                                <p className="font-bold text-sm">{g.name}</p>
                                <p className="text-[10px] opacity-70 group-hover:opacity-100">{g.email} • {g.industry}</p>
                             </button>
                           ))
                         ) : (
                            <div className="px-5 py-4 text-zinc-500 text-xs font-bold text-center italic">
                               Convidado não encontrado na base de inscritos.
                            </div>
                         )}
                      </motion.div>
                    )}
                 </AnimatePresence>
              </div>

              <div className="h-px bg-zinc-900 mb-6" />

              <form onSubmit={handleCreateMember} className="space-y-4">
                <input required placeholder="Nome Completo" className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500" value={newMember.name} onChange={(e) => setNewMember({...newMember, name: e.target.value})}/>
                <input required type="email" placeholder="Email" className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})}/>
                <div className="grid grid-cols-2 gap-4">
                   <input placeholder="WhatsApp" className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500" value={newMember.phone} onChange={(e) => setNewMember({...newMember, phone: e.target.value})}/>
                   <select required className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 appearance-none" value={newMember.cityId} onChange={(e) => setNewMember({...newMember, cityId: e.target.value})}>
                     <option value="">Selecione a Cidade</option>
                     {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <input placeholder="Empresa" className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500" value={newMember.company} onChange={(e) => setNewMember({...newMember, company: e.target.value})}/>
                <input placeholder="Indústria/Área" className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500" value={newMember.industry} onChange={(e) => setNewMember({...newMember, industry: e.target.value})}/>
                
                {status.message && <div className={cn("p-4 rounded-2xl text-sm font-bold", status.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{status.message}</div>}
                
                <button type="submit" disabled={submitting} className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-400 flex items-center justify-center gap-2">
                   {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                   Criar Membro
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Pagamento */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPaymentModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 shadow-2xl">
              <h2 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Lançar Mensalidade</h2>
              <p className="text-zinc-500 text-xs mb-8">Membro: <span className="text-amber-500">{paymentData.memberName}</span></p>
              
              <form onSubmit={handleAddPayment} className="space-y-6">
                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2 mb-2 block">Valor</label>
                    <div className="relative">
                       <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                       <input type="number" step="0.01" required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-6 text-xl font-black text-white" value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: parseFloat(e.target.value)})}/>
                    </div>
                 </div>
                 <div>
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-2 mb-2 block">Mês Referente</label>
                    <input type="date" required className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 text-white font-bold" value={paymentData.date} onChange={e => setPaymentData({...paymentData, date: e.target.value})}/>
                 </div>
                 
                 {status.message && <div className={cn("p-4 rounded-xl text-xs font-bold", status.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{status.message}</div>}

                 <button type="submit" disabled={submitting} className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-zinc-200 flex items-center justify-center gap-2">
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Confirmar Recebimento
                 </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Editar Membro */}
      <AnimatePresence>
        {isEditModalOpen && editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditModalOpen(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 shadow-2xl">
              <h2 className="text-2xl font-black text-white mb-8 uppercase tracking-tight">Editar Membro</h2>
              <form onSubmit={handleUpdateMember} className="space-y-4">
                <input required placeholder="Nome Completo" className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white" value={editingMember.name} onChange={(e) => setEditingMember({...editingMember, name: e.target.value})}/>
                <input required type="email" placeholder="Email" className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white" value={editingMember.email} onChange={(e) => setEditingMember({...editingMember, email: e.target.value})}/>
                <div className="grid grid-cols-2 gap-4">
                   <input placeholder="WhatsApp" className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white" value={editingMember.phone} onChange={(e) => setEditingMember({...editingMember, phone: e.target.value})}/>
                   <select required className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white" value={editingMember.cityId} onChange={(e) => setEditingMember({...editingMember, cityId: e.target.value})}>
                     {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <select required className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white" value={editingMember.status} onChange={(e) => setEditingMember({...editingMember, status: e.target.value})}>
                     <option value="Ativo">Ativo</option>
                     <option value="Inativo">Inativo</option>
                     <option value="Pendente">Pendente</option>
                   </select>
                   <input placeholder="Área" className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white" value={editingMember.industry} onChange={(e) => setEditingMember({...editingMember, industry: e.target.value})}/>
                </div>
                
                {status.message && <div className={cn("p-4 rounded-2xl text-sm font-bold", status.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500")}>{status.message}</div>}
                
                <button type="submit" disabled={submitting} className="w-full bg-amber-500 text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-400">
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
