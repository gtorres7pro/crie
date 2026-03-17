
"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  MessageSquare, 
  Send, 
  Paperclip, 
  X, 
  Loader2, 
  ChevronRight, 
  Bug, 
  Sparkles, 
  Wrench,
  CheckCircle2,
  Clock,
  History
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

interface ChangelogEntry {
  id: string;
  type: "FEATURE" | "BUGFIX" | "IMPROVEMENT";
  title: string;
  description: string;
  version?: string;
  createdAt: string;
}

export default function UpdatesPage() {
  const { data: session } = useSession();
  const [changelog, setChangelog] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Feedback Form State
  const [feedbackType, setFeedbackType] = useState("BUG");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);

  // New Update Modal (Master Admin Only)
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ type: "FEATURE", title: "", description: "", version: "" });

  async function fetchChangelog() {
    try {
      const res = await fetch("/api/admin/changelog");
      if (res.ok) {
        const data = await res.json();
        setChangelog(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchChangelog();
  }, []);

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || uploading) return;
    setSubmitting(true);

    try {
      const uploadedUrls: string[] = [];
      
      // Upload files first
      if (files.length > 0) {
        setUploading(true);
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await fetch("/api/admin/feedback/upload", {
            method: "POST",
            body: formData
          });
          if (uploadRes.ok) {
            const { url } = await uploadRes.json();
            uploadedUrls.push(url);
          }
        }
        setUploading(false);
      }

      const res = await fetch("/api/admin/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: feedbackType,
          subject,
          message,
          attachments: uploadedUrls.join(",")
        })
      });

      if (res.ok) {
        setSuccess(true);
        setSubject("");
        setMessage("");
        setFiles([]);
        setTimeout(() => setSuccess(false), 5000);
      } else {
        alert("Erro ao enviar feedback.");
      }
    } catch (err) {
      alert("Erro de conexão.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateUpdate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/changelog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUpdate)
      });
      if (res.ok) {
        setShowUpdateModal(false);
        setNewUpdate({ type: "FEATURE", title: "", description: "", version: "" });
        fetchChangelog();
      }
    } catch (err) {
      alert("Erro ao salvar atualização.");
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "BUGFIX": return <Bug className="w-4 h-4 text-red-500" />;
      case "FEATURE": return <Sparkles className="w-4 h-4 text-amber-500" />;
      case "IMPROVEMENT": return <Wrench className="w-4 h-4 text-blue-500" />;
      default: return <History className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* Left Axis: Changelog */}
      <div className="lg:col-span-2 space-y-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tight">Atualizações</h1>
            <p className="text-zinc-500 mt-1 font-medium">Veja o que há de novo no Sistema CRIE.</p>
          </div>
          {session?.user?.role === "MASTER_ADMIN" && (
            <button 
              onClick={() => setShowUpdateModal(true)}
              className="p-3 bg-amber-500 text-black rounded-xl hover:bg-amber-400 transition-all font-black text-xs uppercase flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Publicar Update
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
        ) : changelog.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-zinc-800 rounded-3xl text-zinc-600">
             Nenhuma atualização registrada ainda.
          </div>
        ) : (
          <div className="relative pl-8 space-y-12 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-zinc-800">
            {changelog.map((entry, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                transition={{ delay: idx * 0.1 }}
                key={entry.id} 
                className="relative"
              >
                <div className="absolute -left-[35px] top-1 w-6 h-6 bg-black border-4 border-zinc-900 rounded-full flex items-center justify-center z-10">
                   <div className={cn(
                     "w-2 h-2 rounded-full",
                     entry.type === "FEATURE" ? "bg-amber-500" : entry.type === "BUGFIX" ? "bg-red-500" : "bg-blue-500"
                   )} />
                </div>
                
                <div className="bg-[#0f0f0f] border border-zinc-800/80 p-6 rounded-3xl hover:border-zinc-700 transition-all group shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase flex items-center gap-1.5",
                        entry.type === "FEATURE" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                        entry.type === "BUGFIX" ? "bg-red-500/10 text-red-500 border border-red-500/20" : 
                        "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      )}>
                        {getTypeIcon(entry.type)}
                        {entry.type}
                      </span>
                      {entry.version && <span className="text-zinc-600 text-[10px] font-black">V{entry.version}</span>}
                    </div>
                    <time className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                       <Clock className="w-3 h-3" />
                       {new Date(entry.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </time>
                  </div>
                  <h3 className="text-xl font-black text-white group-hover:text-amber-500 transition-all mb-2 uppercase tracking-tight">{entry.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{entry.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Right Column: Feedback Form */}
      <div className="space-y-6">
        <div className="sticky top-10">
          <div className="bg-[#0f0f0f] border border-zinc-800 rounded-[32px] p-8 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[60px] rounded-full -mr-10 -mt-10" />
            
            <div className="relative">
              <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20">
                <MessageSquare className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-2xl font-black uppercase mb-2">Solicitações</h2>
              <p className="text-zinc-500 text-sm font-medium mb-8">Encontrou um erro ou quer sugerir algo? Nossa equipe técnica receberá por e-mail.</p>

              <form onSubmit={handleFeedbackSubmit} className="space-y-5">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Tipo de Mensagem</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Erro / Bug", "Ajuste", "Sugestão", "Outro"].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFeedbackType(t)}
                        className={cn(
                          "py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all",
                          feedbackType === t 
                            ? "bg-amber-500 border-amber-500 text-black shadow-lg shadow-amber-500/10" 
                            : "bg-black/40 border-zinc-800 text-zinc-500 hover:border-zinc-700"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Assunto</label>
                  <input 
                    required
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="Resuma seu pedido..."
                    className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Detalhes</label>
                  <textarea 
                    required
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Explique o que aconteceu ou o que você precisa..."
                    className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500/30 transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 block">Anexos (Opcional)</label>
                  <div className="space-y-2">
                    <label className="w-full h-12 bg-black/40 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center cursor-pointer hover:border-zinc-700 transition-all group">
                      <Paperclip className="w-4 h-4 text-zinc-600 group-hover:text-amber-500 transition-all mr-2" />
                      <span className="text-xs text-zinc-500 group-hover:text-zinc-300">Anexar imagem ou arquivo</span>
                      <input 
                        type="file" 
                        multiple 
                        className="hidden" 
                        onChange={e => {
                          if (e.target.files) setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                        }}
                      />
                    </label>
                    {files.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-lg">
                            <span className="text-[10px] text-zinc-400 truncate max-w-[100px]">{f.name}</span>
                            <button type="button" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  disabled={submitting || uploading}
                  type="submit"
                  className="w-full py-4 bg-white text-black font-black uppercase rounded-xl hover:bg-zinc-200 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  {submitting || uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                      <Send className="w-4 h-4" />
                      Enviar Solicitação
                    </>
                  )}
                </button>
              </form>

              <AnimatePresence>
                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-2xl flex items-center gap-3 text-green-500 text-sm font-bold"
                  >
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    Solicitação enviada! Você receberá uma confirmação no seu e-mail.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: Criar Update (Master Admin) */}
      <AnimatePresence>
        {showUpdateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowUpdateModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[32px] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black uppercase mb-6">Novo Update do Sistema</h3>
              <form onSubmit={handleCreateUpdate} className="space-y-4">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Tipo</label>
                  <select 
                    value={newUpdate.type}
                    onChange={e => setNewUpdate({...newUpdate, type: e.target.value})}
                    className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm"
                  >
                    <option value="FEATURE">Novidade (Feature)</option>
                    <option value="BUGFIX">Correção (Bugfix)</option>
                    <option value="IMPROVEMENT">Melhoria (Improvement)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Título</label>
                  <input required value={newUpdate.title} onChange={e => setNewUpdate({...newUpdate, title: e.target.value})} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm"/>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Descrição</label>
                  <textarea required rows={4} value={newUpdate.description} onChange={e => setNewUpdate({...newUpdate, description: e.target.value})} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm resize-none"/>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1 block">Versão (Opcional)</label>
                  <input value={newUpdate.version} onChange={e => setNewUpdate({...newUpdate, version: e.target.value})} className="w-full bg-black/40 border border-zinc-800 rounded-xl px-4 py-3 text-sm"/>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="submit" className="flex-1 py-3 bg-white text-black font-black uppercase rounded-xl hover:bg-zinc-200 transition-all text-sm">
                    Publicar Agora
                  </button>
                  <button type="button" onClick={() => setShowUpdateModal(false)} className="px-6 py-3 bg-zinc-900 text-zinc-400 font-black uppercase rounded-xl hover:text-white transition-all text-sm">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
