"use client";

import { useEffect, useState } from "react";
import { 
  Search, 
  MoreHorizontal, 
  CheckCircle2, 
  Clock, 
  Download,
  Filter,
  RefreshCcw,
  Phone,
  Mail,
  Briefcase,
  ExternalLink,
  FileText,
  UserCheck,
  CreditCard,
  MapPin,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  industry: string;
  paymentStatus: string;
  presenceStatus: string;
  paymentProofUrl?: string;
  createdAt: string;
  event?: { title: string };
}

interface EventRef {
  id: string;
  title: string;
}

export default function AdminPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [events, setEvents] = useState<EventRef[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [selectedCityId, setSelectedCityId] = useState<string>("all");
  const [accessibleCities, setAccessibleCities] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  async function handleInvite() {
    setSending(true);
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendeeIds: Array.from(selectedIds) }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Sucesso! Foram enviados ${data.sent} convites para o evento "${data.eventTitle}".`);
        setSelectedIds(new Set());
        setShowInviteModal(false);
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao enviar convites");
      }
    } catch (err) {
      alert("Erro de conexão");
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteAttendee(id: string) {
    if (!confirm("Tem a certeza que deseja cancelar esta inscrição? O participante será removido apenas deste evento.")) {
      return;
    }

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/attendees?id=${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        setAttendees(prev => prev.filter(a => a.id !== id));
      } else {
        const error = await res.json();
        alert(error.error || "Erro ao excluir inscrição");
      }
    } catch (err) {
      alert("Erro de conexão ao tentar excluir");
    } finally {
      setUpdatingId(null);
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredAttendees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAttendees.map(a => a.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const exportToCSV = () => {
    const dataToExport = selectedIds.size > 0 
      ? attendees.filter(a => selectedIds.has(a.id))
      : filteredAttendees;

    const headers = ["Nome", "Email", "Telefone", "Area", "Evento", "Pagamento", "Data Inscricao"];
    const rows = dataToExport.map(a => [
      a.name,
      a.email,
      a.phone,
      a.industry,
      a.event?.title || "N/A",
      a.paymentStatus,
      new Date(a.createdAt).toLocaleDateString()
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `inscritos_${selectedEventId}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  async function fetchAttendees() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/attendees?eventId=${selectedEventId}&cityId=${selectedCityId}`);
      if (!res.ok) throw new Error("Falha ao buscar inscritos");
      const data = await res.json();
      setAttendees(data.attendees || []);
      setEvents(data.events || []);
    } catch (err) {
      console.error("Fetch error:", err);
      setAttendees([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCities() {
    try {
      const res = await fetch("/api/admin/cities");
      if (res.ok) {
        const data = await res.json();
        setAccessibleCities(data);
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
    }
  }

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    fetchAttendees();
  }, [selectedEventId, selectedCityId]);

  async function cycleStatus(id: string, currentStatus: string) {
    const statusCycle = ["Pendente", "Pago", "Gratuito"];
    const currentIndex = statusCycle.indexOf(currentStatus);
    const newStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/attendees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, paymentStatus: newStatus }),
      });
      if (res.ok) {
        setAttendees(prev => (prev || []).map(a => a.id === id ? { ...a, paymentStatus: newStatus } : a));
      }
    } catch (err) {
      console.error("Update error:", err);
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredAttendees = (attendees || []).filter(a => 
    a.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.email?.toLowerCase().includes(search.toLowerCase()) ||
    a.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: attendees?.length || 0,
    pago: (attendees || []).filter(a => a.paymentStatus === "Pago").length,
    gratuito: (attendees || []).filter(a => a.paymentStatus === "Gratuito").length,
    pendente: (attendees || []).filter(a => a.paymentStatus === "Pendente").length,
  };

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Base de Dados</h1>
          <p className="text-zinc-500 font-medium">Gestão global de membros e presenças por evento.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
           onClick={fetchAttendees}
           className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400"
          >
            <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
          </button>
          <AnimatePresence>
            {selectedIds.size > 0 && (
              <motion.button 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-black font-black rounded-xl hover:bg-amber-400 transition-all text-[10px] uppercase"
              >
                <Mail className="w-4 h-4" />
                Convidar ({selectedIds.size})
              </motion.button>
            )}
          </AnimatePresence>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-5 py-3 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition-all text-sm"
          >
            <Download className="w-4 h-4" />
            EXPORTAR CSV
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        {[
          { label: "Total Inscritos", value: stats.total, color: "text-white" },
          { label: "Pagos", value: stats.pago, color: "text-green-500" },
          { label: "Gratuitos", value: stats.gratuito, color: "text-blue-500" },
          { label: "Pendentes", value: stats.pendente, color: "text-amber-500" },
        ].map((s, i) => (
          <div key={i} className="bg-[#0f0f0f] border border-zinc-800/80 p-8 rounded-3xl shadow-sm">
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{s.label}</p>
            <p className={cn("text-4xl font-black", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Main Table Area */}
      <div className="bg-[#0f0f0f] border border-zinc-800/80 rounded-[32px] overflow-hidden shadow-2xl">
        <div className="p-4 sm:p-6 border-b border-zinc-900 flex flex-col lg:flex-row justify-between gap-4 bg-zinc-900/20">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <input 
              type="text"
              placeholder="Pesquisar por nome, email ou área..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-zinc-800 rounded-2xl pl-12 pr-6 py-3.5 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all text-sm"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {accessibleCities.length > 1 && (
              <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-2xl px-4 py-1.5 w-full sm:min-w-[150px]">
                <MapPin className="w-3 h-3 text-zinc-600" />
                <select 
                  value={selectedCityId}
                  onChange={(e) => {
                    setSelectedCityId(e.target.value);
                    setSelectedEventId("all"); // Reset event when changing city
                  }}
                  className="bg-transparent text-xs font-bold uppercase tracking-tight text-zinc-400 focus:outline-none w-full py-2 appearance-none cursor-pointer"
                >
                  <option value="all">TODAS AS CIDADES</option>
                  {accessibleCities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-center gap-2 bg-black border border-zinc-800 rounded-2xl px-4 py-1.5 w-full sm:min-w-[200px]">
              <Filter className="w-3 h-3 text-zinc-600" />
              <select 
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="bg-transparent text-xs font-bold uppercase tracking-tight text-zinc-400 focus:outline-none w-full py-2 appearance-none cursor-pointer"
              >
                <option value="all">TODOS OS EVENTOS</option>
                <optgroup label="Filtrar por Evento">
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.title}</option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/40 text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black border-b border-zinc-900">
                <th className="px-8 py-5 w-10">
                   <input 
                    type="checkbox" 
                    checked={filteredAttendees.length > 0 && selectedIds.size === filteredAttendees.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-800 bg-black text-amber-500 focus:ring-amber-500/20"
                   />
                </th>
                <th className="px-8 py-5">Participante</th>
                <th className="px-8 py-5">Contatos</th>
                {selectedEventId === "all" && <th className="px-8 py-5">Evento</th>}
                <th className="px-8 py-5">Área / Indústria</th>
                <th className="px-8 py-5 text-center">Pagamento</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {loading ? (
                <tr>
                  <td colSpan={selectedEventId === "all" ? 7 : 6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                      <p className="text-zinc-500 text-sm font-medium animate-pulse uppercase tracking-widest">Carregando base de dados...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredAttendees.length === 0 ? (
                <tr>
                  <td colSpan={selectedEventId === "all" ? 7 : 6} className="px-8 py-20 text-center text-zinc-500">
                    Nenhum inscrito encontrado.
                  </td>
                </tr>
              ) : filteredAttendees.map((attendee) => (
                <motion.tr 
                  layout
                  key={attendee.id} 
                  className={cn(
                    "group hover:bg-zinc-900/30 transition-colors",
                    selectedIds.has(attendee.id) && "bg-amber-500/5 hover:bg-amber-500/10"
                  )}
                >
                  <td className="px-8 py-6">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(attendee.id)}
                      onChange={() => toggleSelectOne(attendee.id)}
                      className="w-4 h-4 rounded border-zinc-800 bg-black text-amber-500 focus:ring-amber-500/20"
                    />
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-bold text-white group-hover:text-amber-400 transition-colors">{attendee.name}</p>
                        <p className="text-xs text-zinc-600 mt-1 font-medium">Inscrito em {new Date(attendee.createdAt).toLocaleDateString()}</p>
                      </div>
                      {attendee.paymentProofUrl && (
                        <a 
                          href={attendee.paymentProofUrl}
                          target="_blank"
                          className="p-2 bg-amber-400/10 text-amber-400 rounded-lg hover:bg-amber-400/20 transition-all flex items-center gap-1"
                          title="Ver Comprovativo"
                        >
                          <FileText className="w-3 x-3" />
                          <span className="text-[8px] font-black uppercase">Recibo</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Mail className="w-3 h-3" /> {attendee.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <Phone className="w-3 h-3" /> {attendee.phone}
                      </div>
                    </div>
                  </td>
                  {selectedEventId === "all" && (
                    <td className="px-8 py-6">
                       <p className="text-xs font-bold text-zinc-500 uppercase tracking-tighter truncate max-w-[150px]">
                        {attendee.event?.title}
                       </p>
                    </td>
                  )}
                  <td className="px-8 py-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-bold text-zinc-300">
                      <Briefcase className="w-3 h-3 text-amber-500" />
                      {attendee.industry}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <button 
                      disabled={updatingId === attendee.id}
                      onClick={() => cycleStatus(attendee.id, attendee.paymentStatus)}
                      className={cn(
                        "inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all",
                        attendee.paymentStatus === "Pago" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                        attendee.paymentStatus === "Gratuito" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                        "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      )}
                    >
                      {updatingId === attendee.id ? (
                        <RefreshCcw className="w-3 h-3 animate-spin" />
                      ) : attendee.paymentStatus === "Pago" ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : attendee.paymentStatus === "Gratuito" ? (
                        <UserCheck className="w-3 h-3" />
                      ) : (
                        <CreditCard className="w-3 h-3" />
                      )}
                      {attendee.paymentStatus.toUpperCase()}
                    </button>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                         onClick={() => setActiveMenuId(activeMenuId === attendee.id ? null : attendee.id)}
                         className="p-2 text-zinc-500 hover:text-white transition-all rounded-lg hover:bg-zinc-800"
                       >
                         <MoreHorizontal className="w-5 h-5" />
                       </button>

                       <AnimatePresence>
                         {activeMenuId === attendee.id && (
                           <>
                             <div 
                               className="fixed inset-0 z-[60]" 
                               onClick={() => setActiveMenuId(null)}
                             />
                             <motion.div
                               initial={{ opacity: 0, scale: 0.95, y: 10 }}
                               animate={{ opacity: 1, scale: 1, y: 0 }}
                               exit={{ opacity: 0, scale: 0.95, y: 10 }}
                               className="absolute right-8 top-16 w-48 bg-[#111111] border border-zinc-800 rounded-2xl shadow-2xl z-[70] py-2 overflow-hidden"
                             >
                               <button
                                 onClick={() => {
                                   cycleStatus(attendee.id, attendee.paymentStatus);
                                   setActiveMenuId(null);
                                 }}
                                 className="w-full text-left px-4 py-3 text-xs font-bold text-zinc-300 hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2"
                               >
                                 <RefreshCcw className="w-4 h-4" />
                                 ALTERAR STATUS
                               </button>
                               <button
                                 onClick={() => {
                                   handleDeleteAttendee(attendee.id);
                                   setActiveMenuId(null);
                                 }}
                                 className="w-full text-left px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
                               >
                                 <Trash2 className="w-4 h-4" />
                                 CANCELAR INSCRIÇÃO
                               </button>
                             </motion.div>
                           </>
                         )}
                       </AnimatePresence>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !sending && setShowInviteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[32px] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black uppercase mb-4">Enviar Convites</h3>
              <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                Estás prestes a enviar um convite para o próximo evento LIVE para <span className="text-amber-500 font-bold">{selectedIds.size} pessoas</span> selecionadas. 
                O email incluirá os detalhes do evento e um link de inscrição.
              </p>
              
              <div className="flex gap-3">
                <button 
                  disabled={sending}
                  onClick={handleInvite}
                  className="flex-1 py-4 bg-white text-black font-black uppercase rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50"
                >
                  {sending ? <RefreshCcw className="w-5 h-5 animate-spin mx-auto" /> : "Confirmar e Enviar"}
                </button>
                <button 
                  disabled={sending}
                  onClick={() => setShowInviteModal(false)}
                  className="px-6 py-4 bg-zinc-900 text-zinc-400 font-black uppercase rounded-2xl hover:text-white transition-all"
                >
                  Sair
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
