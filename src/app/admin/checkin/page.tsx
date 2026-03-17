"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  UserCheck, 
  ShieldCheck, 
  ExternalLink,
  Filter,
  ArrowRight,
  ChevronDown,
  FileText,
  UserPlus,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Attendee {
  id: string;
  name: string;
  email: string;
  phone: string;
  paymentStatus: string;
  presenceStatus: string;
  paymentProofUrl?: string;
  industry: string;
}

export default function CheckinPanel() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center"><div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" /></div>}>
      <CheckinPanelContent />
    </Suspense>
  )
}

function CheckinPanelContent() {
  const searchParams = useSearchParams();
  const explicitEventId = searchParams.get("eventId");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventId, setEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", phone: "", industry: "" });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");

  async function fetchData() {
    try {
      const url = explicitEventId ? `/api/admin/checkin?eventId=${explicitEventId}` : "/api/admin/checkin";
      const res = await fetch(url);
      const data = await res.json();
      if (data.attendees) {
        setAttendees(data.attendees);
        setEventTitle(data.eventTitle);
        if (data.eventId) setEventId(data.eventId);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleUpdate(id: string, updates: Partial<Attendee>) {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...updates }),
      });
      if (res.ok) {
        const { attendee } = await res.json();
        setAttendees(prev => prev.map(a => a.id === id ? attendee : a));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleAddAttendee(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, eventId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "Erro ao adicionar participante");
        return;
      }
      if (data.success && data.attendee) {
        setAttendees(prev => [...prev, data.attendee]);
        setIsAddModalOpen(false);
        setAddForm({ name: "", email: "", phone: "", industry: "" });
      }
    } catch (err) {
      console.error(err);
      setAddError("Erro interno");
    } finally {
      setAdding(false);
    }
  }

  const filteredAttendees = attendees
    .filter(a => 
      a.name?.toLowerCase().includes(search.toLowerCase()) || 
      a.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const pendingAttendees = filteredAttendees.filter(a => a.presenceStatus !== "Presente");
  const presentAttendees = filteredAttendees.filter(a => a.presenceStatus === "Presente");

  const renderAttendeeCard = (attendee: Attendee) => (
    <motion.div
      layout
      key={attendee.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-[#0f0f0f] border rounded-[32px] p-6 md:p-8 flex flex-col md:flex-row items-center gap-8 transition-all relative overflow-hidden",
        attendee.presenceStatus === "Presente" ? "border-zinc-800/30 opacity-60 grayscale-[0.5]" : "border-zinc-800 hover:border-amber-400/30 shadow-xl"
      )}
    >
      {/* Status Indicator */}
      <div className={cn(
        "absolute top-0 left-0 bottom-0 w-1",
        attendee.presenceStatus === "Presente" ? "bg-zinc-800" : "bg-gradient-to-b from-amber-400 to-amber-600"
      )} />

      <div className="flex-1 w-full flex items-center gap-6">
        <div className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 border transition-all",
          attendee.presenceStatus === "Presente" ? "bg-zinc-900 border-zinc-800 text-zinc-600" : "bg-amber-400/10 border-amber-400/20 text-amber-400 shadow-lg shadow-amber-400/5"
        )}>
          {attendee.presenceStatus === "Presente" ? <CheckCircle2 className="w-8 h-8" /> : <Users className="w-8 h-8" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black uppercase tracking-tight truncate">{attendee.name}</h3>
            {attendee.paymentProofUrl && (
              <a 
                href={attendee.paymentProofUrl} 
                target="_blank" 
                className="p-1.5 bg-amber-400/10 text-amber-400 rounded-lg border border-amber-400/20 hover:bg-amber-400/20"
                title="Ver Comprovante"
              >
                <FileText className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 mt-1 text-zinc-500 font-bold text-[10px] tracking-widest uppercase">
            <span>{attendee.industry}</span>
            <span className="w-1 h-1 bg-zinc-800 rounded-full" />
            <span>{attendee.email}</span>
          </div>
        </div>
      </div>

      {/* Controls Area */}
      <div className="flex flex-wrap items-center justify-end gap-4 w-full md:w-auto">
        
        {/* Payment Status Dropdown / Cycle */}
        <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800">
          {(["Pendente", "Pago", "Gratuito"] as const).map((status) => (
            <button
              key={status}
              onClick={() => handleUpdate(attendee.id, { paymentStatus: status })}
              className={cn(
                "px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                attendee.paymentStatus === status 
                  ? status === "Pago" ? "bg-green-500/10 text-green-500 border border-green-500/20" :
                    status === "Gratuito" ? "bg-blue-500/10 text-blue-500 border border-blue-500/20" :
                    "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Check-in Button */}
        <button
          disabled={updatingId === attendee.id}
          onClick={() => handleUpdate(attendee.id, { presenceStatus: attendee.presenceStatus === "Presente" ? "Pendente" : "Presente" })}
          className={cn(
            "group px-8 py-3.5 rounded-[20px] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center justify-center gap-3 min-w-[160px]",
            attendee.presenceStatus === "Presente"
              ? "bg-zinc-900 text-green-500 border border-zinc-800 hover:border-red-500/30 hover:text-red-500"
              : "bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-xl shadow-amber-500/20 hover:scale-[1.05] active:scale-[0.95]"
          )}
        >
          {updatingId === attendee.id ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : attendee.presenceStatus === "Presente" ? (
            <><CheckCircle2 className="w-4 h-4 group-hover:hidden" /><span className="group-hover:hidden">PRESENTE</span><span className="hidden group-hover:block">DESFAZER</span></>
          ) : (
            <>CONFIRMAR <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-12 selection:bg-amber-400/30">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-400/10 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <h2 className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-[10px]">Painel de Apoiador</h2>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase">
              Check-in: <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">{eventTitle}</span>
            </h1>
          </div>
          <div className="bg-zinc-900/50 px-6 py-4 rounded-3xl border border-zinc-800 backdrop-blur-sm flex items-center gap-4">
             <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Inscritos</p>
                <p className="text-2xl font-black text-white">{attendees.length}</p>
             </div>
             <div className="w-px h-8 bg-zinc-800" />
             <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Presentes</p>
                <p className="text-2xl font-black text-amber-400">{attendees.filter(a => a.presenceStatus === "Presente").length}</p>
             </div>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-amber-400 transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/40 border border-zinc-800 rounded-[32px] pl-16 pr-8 py-6 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400/50 transition-all font-medium text-lg placeholder:text-zinc-600"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-amber-400 hover:bg-amber-500 text-black px-8 py-4 rounded-[32px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-amber-500/10"
          >
            <UserPlus className="w-5 h-5" />
            Adicionar na Hora
          </button>
        </div>

        {/* List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {pendingAttendees.map(renderAttendeeCard)}
          </AnimatePresence>

          {presentAttendees.length > 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="pt-12 pb-4 border-b border-zinc-900 mb-4"
            >
              <h2 className="text-xl font-black uppercase tracking-widest text-zinc-500 flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-500" /> 
                Participantes Presentes ({presentAttendees.length})
              </h2>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {presentAttendees.map(renderAttendeeCard)}
          </AnimatePresence>

          {filteredAttendees.length === 0 && (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-zinc-900 border border-zinc-800 rounded-[32px] flex items-center justify-center mx-auto">
                 <Search className="w-8 h-8 text-zinc-700" />
              </div>
              <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">Nenhum inscrito encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Attendee Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#0f0f0f] border border-zinc-800 rounded-[32px] p-8 w-full max-w-md relative"
            >
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tight">Adicionar na Hora</h2>
                <p className="text-zinc-500 text-sm mt-2">Irá adicionar esta pessoa diretamente como 'Presente' para o evento atual, ignorando limites de capacidade.</p>
              </div>

              {addError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm font-bold">
                  {addError}
                </div>
              )}

              <form onSubmit={handleAddAttendee} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={addForm.name}
                    onChange={e => setAddForm({ ...addForm, name: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-zinc-700 transition-all"
                    placeholder="João Silva"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Email</label>
                  <input
                    type="email"
                    required
                    value={addForm.email}
                    onChange={e => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-zinc-700 transition-all"
                    placeholder="joao@email.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Telefone</label>
                    <input
                      type="text"
                      required
                      value={addForm.phone}
                      onChange={e => setAddForm({ ...addForm, phone: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white placeholder:text-zinc-700 transition-all"
                      placeholder="+351 900..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-4">Área/Indústria</label>
                    <select
                      required
                      value={addForm.industry}
                      onChange={e => setAddForm({ ...addForm, industry: e.target.value })}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 text-white transition-all appearance-none"
                    >
                      <option value="" disabled>Selecione uma área</option>
                      <option value="Tecnologia / TI">Tecnologia / TI</option>
                      <option value="Imobiliário">Imobiliário</option>
                      <option value="Vendas / Comercial">Vendas / Comercial</option>
                      <option value="Marketing / Design">Marketing / Design</option>
                      <option value="Saúde / Bem-estar">Saúde / Bem-estar</option>
                      <option value="Educação / Humanas">Educação / Humanas</option>
                      <option value="Gastronomia / Alimentação">Gastronomia / Alimentação</option>
                      <option value="Comércio / Varejo">Comércio / Varejo</option>
                      <option value="Construção / Imobiliário">Construção / Imobiliário</option>
                      <option value="Finanças / Consultoria">Finanças / Consultoria</option>
                      <option value="Turismo / Viagens">Turismo / Viagens</option>
                      <option value="Agropecuária">Agropecuária</option>
                      <option value="Serviços Gerais">Serviços Gerais</option>
                      <option value="Religião / Terceiro Setor">Religião / Terceiro Setor</option>
                      <option value="Jurídica / Advocacia">Jurídica / Advocacia</option>
                      <option value="Transporte / Logística">Transporte / Logística</option>
                      <option value="Estética / Beleza">Estética / Beleza</option>
                      <option value="Gestão / Consultoria">Gestão / Consultoria</option>
                      <option value="Eventos / Entretenimento">Eventos / Entretenimento</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={adding || !eventId}
                  className="w-full bg-amber-400 hover:bg-amber-500 text-black font-black uppercase tracking-widest py-4 rounded-2xl mt-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {adding ? (
                    <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  ) : (
                    "Adicionar e Fazer Check-in"
                  )}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
