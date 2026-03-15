"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Users, 
  Trash2, 
  Edit, 
  CheckCircle2, 
  Clock, 
  XCircle,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  BarChart3,
  DollarSign,
  Paperclip,
  FileText,
  Link,
  FileDown,
  RefreshCcw,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface EventStats {
  total: number;
  present: number;
  missing: number;
  occupancy: number;
}

interface Finance {
  id: string;
  type: string;
  amount: number;
  description: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  price: number;
  status: "DRAFT" | "LIVE" | "ARCHIVED";
  financialLocked: boolean;
  reportSentAt: string | null;
  stats: EventStats & {
    revenue: number;
    expenses: number;
    balance: number;
  };
  bannerUrl?: string;
  finances: any[];
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<Event> | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "finance">("general");
  const [error, setError] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string>("all");
  const [accessibleCities, setAccessibleCities] = useState<any[]>([]);
  const [expenseInput, setExpenseInput] = useState({ description: "", amount: "" });
  const [selectedBanner, setSelectedBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);


  async function fetchEvents() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/events?cityId=${selectedCityId}`);
      const data = await res.json();
      setEvents(data);
    } catch (err) {
      console.error(err);
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


  // Update editingEvent when events list changes (to reflect new finances)
  useEffect(() => {
    if (editingEvent?.id) {
      const updated = events.find(e => e.id === editingEvent.id);
      if (updated) setEditingEvent(updated);
    }
  }, [events]);

  useEffect(() => {
    fetchEvents();
  }, [selectedCityId]);


  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;
    
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // Basic frontend cleaning
    const payload: any = {
      ...data,
      capacity: Number(data.capacity),
      price: Number(data.price),
    };

    // Upload banner if selected
    if (selectedBanner) {
      const bannerFormData = new FormData();
      bannerFormData.append("file", selectedBanner);
      try {
        const uploadRes = await fetch("/api/admin/events/upload", {
          method: "POST",
          body: bannerFormData
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          payload.bannerUrl = url;
        }
      } catch (err) {
        console.error("Banner upload failed:", err);
      }
    }

    const method = editingEvent?.id ? "PATCH" : "POST";
    const url = editingEvent?.id ? `/api/admin/events/${editingEvent.id}` : "/api/admin/events";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok) {
        setShowModal(false);
        setEditingEvent(null);
        fetchEvents();
      } else {
        setError(result.error || "Erro ao guardar evento.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro de rede ao conectar ao servidor.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteEvent(id: string) {
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: "DELETE" });
      if (res.ok) {
        setEvents(events.filter(e => e.id !== id));
      } else {
        const data = await res.json();
        setError(data.error || "Erro ao eliminar evento.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro de rede ao eliminar evento.");
    }
  }

  const liveEvents = events.filter(e => e.status === "LIVE" && new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)));
  const drafts = events.filter(e => e.status === "DRAFT");
  const pastEvents = events
    .filter(e => new Date(e.date) < new Date(new Date().setHours(0,0,0,0)) || e.status === "ARCHIVED")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Gestão de Eventos</h1>
          <p className="text-zinc-500 font-medium">Controla o cronograma, vagas e status dos eventos CRIE.</p>
        </div>
        <div className="flex items-center gap-3">
          {accessibleCities.length > 1 && (
            <div className="flex items-center gap-2 bg-[#0f0f0f] border border-zinc-800 rounded-2xl px-4 py-2 min-w-[180px]">
              <MapPin className="w-4 h-4 text-zinc-600" />
              <select 
                value={selectedCityId}
                onChange={(e) => setSelectedCityId(e.target.value)}
                className="bg-transparent text-xs font-bold uppercase tracking-tight text-zinc-400 focus:outline-none w-full py-2 appearance-none cursor-pointer"
              >
                <option value="all">TODAS AS CIDADES</option>
                {accessibleCities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <button 
            onClick={() => { setEditingEvent(null); setShowModal(true); }}
            className="flex items-center gap-2 px-6 py-4 bg-amber-500 text-black font-black rounded-2xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            NOVO EVENTO
          </button>
        </div>
      </div>

      {/* Categories */}
      <section className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-amber-500">Próximos Eventos (LIVE)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveEvents.length === 0 && !loading && (
             <div className="col-span-full py-12 border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center text-zinc-600">
                <Calendar className="w-10 h-10 mb-4 opacity-20" />
                <p>Nenhum evento ativo para inscrição.</p>
             </div>
          )}
          {liveEvents.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onEdit={() => { setEditingEvent(event); setShowModal(true); }}
              onDelete={() => deleteEvent(event.id)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-500">Rascunhos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((event) => (
            <EventCard 
              key={event.id} 
              event={event} 
              onEdit={() => { setEditingEvent(event); setShowModal(true); }}
              onDelete={() => deleteEvent(event.id)}
            />
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-700">Histórico / Passados</h3>
        <div className="bg-[#0f0f0f] border border-zinc-900 rounded-[32px] overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/40 text-[10px] uppercase tracking-widest text-zinc-600 font-black border-b border-zinc-900">
                <th className="px-8 py-5">Evento</th>
                <th className="px-8 py-5">Resultados</th>
                <th className="px-8 py-5">Taxa de Conversão</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {pastEvents.map((event) => {
                const isPendingFinance = !event.financialLocked;
                return (
                  <tr key={event.id} className={cn("hover:bg-zinc-900/20", isPendingFinance && "bg-red-500/[0.03]")}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        {isPendingFinance && (
                           <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" title="Financeiro Pendente" />
                        )}
                        <div>
                          <p className="font-bold">{event.title}</p>
                          <p className="text-xs text-zinc-600">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-4">
                        <div className="text-center">
                          <p className="text-xs font-bold text-green-500">{event.stats.present}</p>
                          <p className="text-[9px] text-zinc-600 uppercase">Presentes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-bold text-zinc-400">{(event.stats.balance || 0).toFixed(2)}€</p>
                          <p className="text-[9px] text-zinc-600 uppercase">Saldo</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="w-32">
                         <div className="flex justify-between items-center mb-1">
                            <p className="text-[10px] text-zinc-500 font-bold">{Math.round((event.stats.present / event.stats.total || 0) * 100)}%</p>
                            {event.financialLocked && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                         </div>
                         <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500/50" 
                              style={{ width: `${(event.stats.present / event.stats.total || 0) * 100}%` }}
                            />
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <button 
                         onClick={() => { setEditingEvent(event); setShowModal(true); setActiveTab("general"); }}
                         className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-600 hover:text-white transition-colors">
                         <Edit className="w-4 h-4" />
                       </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-20 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-3xl bg-[#0f0f0f] border border-zinc-800 p-10 rounded-[40px] shadow-2xl z-[101] max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-start mb-8">
                <h2 className="text-2xl font-bold uppercase tracking-tight">
                  {editingEvent ? (editingEvent.title || "Editar Evento") : "Criar Novo Evento"}
                </h2>
                {editingEvent && (
                  <div className="flex bg-zinc-900 p-1 rounded-xl">
                    <button 
                      onClick={() => setActiveTab("general")}
                      className={cn("px-4 py-2 text-[10px] font-black rounded-lg transition-all", activeTab === "general" ? "bg-amber-500 text-black shadow-lg" : "text-zinc-500")}
                    >GERAL</button>
                    <button 
                      onClick={() => setActiveTab("finance")}
                      className={cn("px-4 py-2 text-[10px] font-black rounded-lg transition-all", activeTab === "finance" ? "bg-amber-500 text-black shadow-lg" : "text-zinc-500")}
                    >FINANCEIRO</button>
                  </div>
                )}
              </div>

              {editingEvent && editingEvent.bannerUrl && (
                <div className="mb-8 w-full h-40 rounded-3xl overflow-hidden border border-zinc-800 relative group">
                   <img src={editingEvent.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Banner Atual</p>
                   </div>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              
              
              {activeTab === "general" ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Título do Evento</label>
                      <input name="title" required defaultValue={editingEvent?.title} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-bold text-zinc-500 uppercase">Cidade</label>
                       <select name="cityId" required defaultValue={(editingEvent as any)?.cityId} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 appearance-none">
                         <option value="">Selecionar Cidade...</option>
                         {accessibleCities.map(c => (
                           <option key={c.id} value={c.id}>{c.name}</option>
                         ))}
                       </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Data e Hora</label>
                      <input name="date" type="datetime-local" required defaultValue={editingEvent?.date ? new Date(new Date(editingEvent.date).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16) : ""} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Local</label>
                      <input name="location" required defaultValue={editingEvent?.location} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Vagas</label>
                      <input name="capacity" type="number" required defaultValue={editingEvent?.capacity} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Preço (€)</label>
                      <input name="price" type="number" step="0.01" required defaultValue={editingEvent?.price} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                      <select name="status" defaultValue={editingEvent?.status || "DRAFT"} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4 appearance-none">
                        <option value="DRAFT">RASCUNHO</option>
                        <option value="LIVE">LIVE (ATIVO)</option>
                        <option value="ARCHIVED">ARQUIVADO</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Descrição</label>
                    <textarea name="description" defaultValue={editingEvent?.description} rows={3} className="w-full bg-black border border-zinc-800 rounded-2xl px-6 py-4" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Banner do Evento (Opcional)</label>
                    <label className="flex items-center gap-4 p-5 bg-black/40 border-2 border-dashed border-zinc-800 rounded-3xl cursor-pointer hover:border-amber-500/50 transition-all group">
                       <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                          <ImageIcon className="w-6 h-6 text-zinc-600 group-hover:text-black" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-zinc-300">
                             {selectedBanner ? selectedBanner.name : "Clique para carregar o banner"}
                          </p>
                          <p className="text-[10px] text-zinc-600 uppercase font-black">Recomendado: 1200x630px</p>
                       </div>
                       <input 
                         type="file" 
                         className="hidden" 
                         accept="image/*"
                         onChange={(e) => {
                            const file = e.target.files?.[0] || null;
                            setSelectedBanner(file);
                            if (file) setBannerPreview(URL.createObjectURL(file));
                         }}
                       />
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                      type="button" 
                      onClick={() => { setShowModal(false); setError(null); }} 
                      disabled={submitting}
                      className="flex-1 py-4 bg-zinc-900 font-bold rounded-2xl disabled:opacity-50"
                    >
                      Fechar
                    </button>
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="flex-1 py-4 bg-amber-500 text-black font-black rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {submitting && <Clock className="w-4 h-4 animate-spin" />}
                      {submitting ? "A GUARDAR..." : "Guardar Alterações"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <FinanceModule 
                    event={editingEvent as Event} 
                    onUpdate={fetchEvents} 
                    setError={setError}
                  />
                  <button 
                    type="button" 
                    onClick={() => { setShowModal(false); setError(null); }} 
                    className="w-full py-4 bg-zinc-900 font-bold rounded-2xl"
                  >
                    Fechar
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FinanceModule({ event, onUpdate, setError }: { event: Event, onUpdate: () => void, setError: (m: string | null) => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [locked, setLocked] = useState(event.financialLocked);
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function addExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    setUploading(true);
    try {
      let receiptUrl = editingTransaction?.receiptUrl || null;

      // 1. Upload file if selected
      if (selectedFile) {
        const uploadData = new FormData();
        uploadData.append("file", selectedFile);
        const uploadRes = await fetch("/api/admin/finances/upload", {
          method: "POST",
          body: uploadData
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          receiptUrl = url;
        }
      }

      const payload = { ...data, receiptUrl };

      if (editingTransaction) {
        const res = await fetch("/api/admin/finances", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, id: editingTransaction.id }),
        });
        if (res.ok) {
          onUpdate();
          setEditingTransaction(null);
          setSelectedFile(null);
          (e.target as HTMLFormElement).reset();
        }
      } else {
        const res = await fetch("/api/admin/finances", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, eventId: event.id }),
        });
        if (res.ok) {
          onUpdate();
          setSelectedFile(null);
          (e.target as HTMLFormElement).reset();
        } else {
          const err = await res.json();
          setError(err.error);
        }
      }
    } catch (err) {
      setError("Erro ao processar lançamento");
    } finally {
      setUploading(false);
    }
  }

  async function deleteExpense(id: string) {
    if (locked) return;
    try {
      await fetch(`/api/admin/finances?id=${id}`, { method: "DELETE" });
      onUpdate();
    } catch (err) {
      setError("Erro ao eliminar despesa");
    }
  }

  async function sendReport() {
    if (!confirm("Confirmas o fecho financeiro deste evento? Isto enviará um email aos administradores e trancará os valores.")) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/report`, { method: "POST" });
      if (res.ok) {
        setLocked(true);
        onUpdate();
        alert("Relatório enviado com sucesso!");
      }
    } catch (err) {
      setError("Erro ao enviar relatório");
    } finally {
      setSubmitting(false);
    }
  }

  async function unlockFinance() {
    if (!confirm("Tens a certeza que queres reabrir o financeiro? Será necessário enviar um novo relatório para fechar novamente.")) return;
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ financialLocked: false }),
      });
      if (res.ok) {
        setLocked(false);
        onUpdate();
      }
    } catch (err) {
      setError("Erro ao desbloquear financeiro");
    }
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-zinc-950 border border-green-500/20 rounded-3xl">
           <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Total Receitas</p>
           <p className="text-xl font-black text-green-500">{(event.stats?.revenue || 0).toFixed(2)}€</p>
        </div>
        <div className="p-4 bg-zinc-950 border border-red-500/20 rounded-3xl">
           <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Total Despesas</p>
           <p className="text-xl font-black text-red-500">{(event.stats?.expenses || 0).toFixed(2)}€</p>
        </div>
        <div className="p-4 bg-zinc-950 border border-amber-500/30 rounded-3xl">
           <p className="text-[9px] font-black text-zinc-600 uppercase mb-1">Saldo Final</p>
           <p className="text-xl font-black text-white">{(event.stats?.balance || 0).toFixed(2)}€</p>
        </div>
      </div>

      {/* Expense Form */}
      {!locked ? (
        <form onSubmit={addExpense} className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-[32px] space-y-4">
           <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
            {editingTransaction ? "Editar Lançamento" : "Adicionar Lançamento"}
           </p>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input 
                name="description" 
                required 
                placeholder="Ex: Coffee Break" 
                defaultValue={editingTransaction?.description}
                key={editingTransaction?.id + "-desc"}
                className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-amber-500/50 outline-none" 
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  name="amount" 
                  type="number" 
                  step="0.01" 
                  min="0"
                  required 
                  placeholder="Valor (€)" 
                  defaultValue={editingTransaction?.amount}
                  key={editingTransaction?.id + "-amt"}
                  className="bg-black border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-amber-500/50 outline-none" 
                  onKeyPress={(e) => { if(e.key === "-") e.preventDefault(); }}
                />
                <select 
                  name="type" 
                  defaultValue={editingTransaction?.type || "Despesa"}
                  key={editingTransaction?.id + "-type"}
                  className={cn(
                    "bg-black border border-zinc-800 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none transition-colors",
                    editingTransaction ? "border-amber-500/50 text-amber-500" : "text-zinc-400"
                  )}
                >
                  <option value="Despesa">DESPESA</option>
                  <option value="Receita">RECEITA</option>
                </select>
              </div>
           </div>

           {!editingTransaction && (
             <div className="flex items-center gap-2">
                <label className="flex-1 flex items-center gap-3 p-3 bg-black border border-zinc-800 rounded-xl cursor-pointer hover:border-zinc-700 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center group-hover:bg-zinc-800 transition-colors">
                    <Paperclip className="w-4 h-4 text-zinc-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase truncate">
                      {selectedFile ? selectedFile.name : "Anexar Recibo (Opcional)"}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*,application/pdf"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                </label>
             </div>
           )}

           <div className="flex gap-2">
             <button 
              type="submit" 
              disabled={uploading}
              className="flex-1 py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl transition-all hover:bg-zinc-200 disabled:opacity-50"
             >
               {uploading ? (
                 <RefreshCcw className="w-4 h-4 animate-spin mx-auto" />
               ) : (
                 editingTransaction ? "Atualizar Lançamento" : "Confirmar Lançamento"
               )}
             </button>
             {editingTransaction && (
               <button 
                type="button" 
                onClick={() => { setEditingTransaction(null); setSelectedFile(null); }}
                className="px-6 py-3 bg-zinc-800 text-[10px] font-black uppercase rounded-xl"
               >
                Cancelar
               </button>
             )}
           </div>
        </form>
      ) : (
        <div className="p-6 bg-green-500/5 border border-green-500/20 rounded-[32px] flex items-center gap-4">
           <CheckCircle2 className="w-6 h-6 text-green-500" />
           <div className="flex-1">
             <p className="text-sm font-bold text-green-400">Financeiro Fechado</p>
             <p className="text-[10px] text-zinc-500 uppercase">Relatório enviado em {event.reportSentAt ? new Date(event.reportSentAt).toLocaleString() : 'N/A'}</p>
           </div>
           <button onClick={unlockFinance} type="button" className="px-4 py-2 bg-zinc-900 text-[10px] font-bold uppercase rounded-lg hover:bg-zinc-800">Reabrir</button>
        </div>
      )}

      {/* Expense List */}
      <div className="space-y-4">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Extrato de Movimentações</p>
        <div className="divide-y divide-zinc-900 border-t border-zinc-900">
           {/* Inflow from registrations */}
           <div className="py-4 flex justify-between items-center opacity-70">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                 </div>
                 <div>
                    <p className="text-sm font-bold">Venda de Inscrições</p>
                    <p className="text-[10px] text-zinc-600">Automático via formulário</p>
                 </div>
              </div>
              <p className="text-sm font-black text-green-500">+{(event.stats?.revenue || 0).toFixed(2)}€</p>
           </div>

           {/* Manual Transactions */}
           {event.finances?.map((f: any) => (
             <div key={f.id} className={cn("py-4 flex justify-between items-center group transition-colors", editingTransaction?.id === f.id && "bg-amber-500/5")}>
                <div className="flex items-center gap-3">
                   <div className={cn(
                     "w-8 h-8 rounded-lg flex items-center justify-center",
                     f.type === "Receita" ? "bg-green-500/10" : "bg-red-500/10"
                   )}>
                      <DollarSign className={cn("w-4 h-4", f.type === "Receita" ? "text-green-500" : "text-red-500")} />
                   </div>
                   <div>
                      <p className="text-sm font-bold">{f.description}</p>
                      <p className="text-[10px] text-zinc-600 font-medium uppercase">{f.type} • {new Date(f.createdAt).toLocaleDateString()}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   {f.receiptUrl && (
                     <a 
                      href={f.receiptUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 hover:text-amber-500 transition-all shadow-sm"
                      onClick={(e) => e.stopPropagation()}
                     >
                       <FileDown className="w-4 h-4" />
                     </a>
                   )}
                   <p className={cn(
                     "text-sm font-black text-right min-w-[80px]",
                     f.type === "Receita" ? "text-green-500" : "text-red-400"
                   )}>
                      {f.type === "Receita" ? "+" : "-"}{f.amount.toFixed(2)}€
                   </p>
                   {!locked && (
                     <div className="flex gap-1">
                        <button 
                          onClick={() => setEditingTransaction(f)} 
                          type="button" 
                          className="p-2 opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                        >
                           <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); deleteExpense(f.id); }} 
                          type="button" 
                          className="p-2 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                        >
                           <Trash2 className="w-4 h-4" />
                        </button>
                     </div>
                   )}
                </div>
             </div>
           ))}
           {(!event.finances || event.finances.length === 0) && (
             <p className="py-8 text-center text-xs text-zinc-700 italic">Nenhuma despesa manual registada.</p>
           )}
        </div>
      </div>

      {!locked && (
        <button 
          onClick={sendReport}
          disabled={submitting}
          type="button" 
          className="w-full py-5 bg-amber-500 text-black font-black uppercase tracking-widest rounded-3xl shadow-lg shadow-amber-500/10 hover:scale-[1.01] transition-all flex items-center justify-center gap-2"
        >
          {submitting ? <Clock className="w-5 h-5 animate-spin" /> : <BarChart3 className="w-5 h-5" />}
          Finalizar & Enviar Relatório
        </button>
      )}
    </div>
  );
}

function EventCard({ event, onEdit, onDelete }: { event: Event, onEdit: () => void, onDelete: () => void }) {
  const occupancy = event.stats?.occupancy || 0;
  const isFull = occupancy >= 100;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const eventHeaderTitle = event.title || "Evento";
  
  return (
    <motion.div 
      layout
      className="bg-[#0f0f0f] border border-zinc-800/80 rounded-[32px] p-8 space-y-6 group hover:border-amber-500/30 transition-all shadow-sm relative overflow-hidden"
    >
      <AnimatePresence>
        {confirmDelete && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute inset-0 z-20 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center space-y-4"
          >
            <AlertCircle className="w-10 h-10 text-red-500 mb-2" />
            <p className="text-sm font-bold uppercase tracking-tight">Cuidado!</p>
            <p className="text-xs text-zinc-400">Tens a certeza que queres eliminar o evento <span className="text-white">"{event.title}"</span>?</p>
            <div className="flex gap-2 w-full pt-2">
               <button 
                 onClick={(e) => { e.stopPropagation(); setConfirmDelete(false); }}
                 className="flex-1 py-3 bg-zinc-900 rounded-xl text-xs font-bold"
               >
                 Cancelar
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); onDelete(); setConfirmDelete(false); }}
                 className="flex-1 py-3 bg-red-600 rounded-xl text-xs font-bold"
               >
                 Eliminar
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-start">
        <div className={cn(
          "px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase",
          event.status === "LIVE" ? "bg-amber-500 text-black" : "bg-zinc-800 text-zinc-500"
        )}>
          {event.status}
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="p-2 bg-zinc-900 rounded-lg text-zinc-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <h4 className="text-xl font-bold mb-2 line-clamp-1">{event.title}</h4>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
           <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(event.date).toLocaleDateString()}</div>
           <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {event.location}</div>
        </div>
      </div>

      <div className="p-5 bg-zinc-950/50 rounded-2xl border border-zinc-900 space-y-4">
         <div className="flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-zinc-600 uppercase mb-1">Inscritos</p>
              <div className="flex items-baseline gap-1">
                 <p className="text-2xl font-black text-white">{event.stats.total}</p>
                 <p className="text-xs text-zinc-600">/ {event.capacity}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs font-black text-amber-500">{Math.round(occupancy)}%</p>
            </div>
         </div>
         <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className={cn("h-full transition-all duration-500", isFull ? "bg-red-500" : "bg-amber-500")} 
              style={{ width: `${Math.min(occupancy, 100)}%` }}
            />
         </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        className="w-full py-4 text-xs font-bold text-zinc-400 border border-zinc-800 rounded-2xl hover:bg-zinc-900 transition-colors uppercase tracking-widest"
      >
        Gerir Detalhes
      </button>
    </motion.div>
  );
}
