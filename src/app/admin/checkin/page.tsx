"use client";

import { useEffect, useState } from "react";
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
  FileText
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
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function fetchData() {
    try {
      const res = await fetch("/api/admin/checkin");
      const data = await res.json();
      if (data.attendees) {
        setAttendees(data.attendees);
        setEventTitle(data.eventTitle);
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

  const filteredAttendees = attendees
    .filter(a => 
      a.name?.toLowerCase().includes(search.toLowerCase()) || 
      a.email?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      // Presente vai para o fundo
      if (a.presenceStatus === "Presente" && b.presenceStatus !== "Presente") return 1;
      if (a.presenceStatus !== "Presente" && b.presenceStatus === "Presente") return -1;
      // Depois ordena por nome
      return a.name.localeCompare(b.name);
    });

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

        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-amber-400 transition-colors" />
          <input 
            type="text" 
            placeholder="Procurar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-900/40 border border-zinc-800 rounded-[32px] pl-16 pr-8 py-6 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400/50 transition-all font-medium text-lg placeholder:text-zinc-600"
          />
        </div>

        {/* List */}
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredAttendees.map((attendee) => (
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
                          title="Ver Recibo"
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
                      "group px-8 py-3.5 rounded-[20px] font-black uppercase tracking-[0.2em] text-xs transition-all flex items-center gap-3",
                      attendee.presenceStatus === "Presente"
                        ? "bg-zinc-900 text-zinc-500 border border-zinc-800 hover:bg-zinc-800"
                        : "bg-gradient-to-r from-amber-400 to-amber-600 text-black shadow-xl shadow-amber-500/20 hover:scale-[1.05] active:scale-[0.95]"
                    )}
                  >
                    {updatingId === attendee.id ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : attendee.presenceStatus === "Presente" ? (
                      <>CANCELADO</>
                    ) : (
                      <>CONFIRMAR <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                    )}
                  </button>
                </div>
              </motion.div>
            ))}
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
    </div>
  );
}
