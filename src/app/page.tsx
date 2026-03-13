"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Phone, 
  DollarSign, 
  Info, 
  CheckCircle2, 
  AlertTriangle,
  Instagram,
  Facebook,
  Linkedin,
  Paperclip,
  FileText,
  Link,
  FileDown,
  RefreshCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  price: number;
  occupancy: number;
  isFull: boolean;
}

export default function RegistrationPage() {
  const [event, setEvent] = useState<ActiveEvent | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  async function fetchActiveEvent() {
    try {
      const res = await fetch("/api/events/active");
      const data = await res.json();
      setEvent(data.event);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEvent(false);
    }
  }

  useEffect(() => {
    fetchActiveEvent();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    if (selectedFile) {
      formData.append("paymentProof", selectedFile);
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Ocorreu um erro. Tente novamente.");
        return;
      }

      setSuccess(true);
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setFormLoading(false);
    }
  }

  const getCapacityFlag = () => {
    if (!event) return null;
    if (event.isFull) return { text: "VAGAS ESGOTADAS", color: "bg-red-500", icon: AlertTriangle };
    if (event.occupancy >= 75) return { text: `ÚLTIMAS VAGAS - ${Math.round(event.occupancy)}% PREENCHIDAS`, color: "bg-orange-500", icon: Users };
    if (event.occupancy >= 50) return { text: `${Math.round(event.occupancy)}% DAS VAGAS PREENCHIDAS`, color: "bg-amber-500", icon: Users };
    return null;
  };

  const flag = getCapacityFlag();

  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // --- NO EVENT STATE ---
  if (!event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 selection:bg-amber-400/30">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-400/10 blur-[120px] rounded-full" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl w-full text-center space-y-12"
        >
          <div className="relative w-24 h-24 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-amber-500/20">
             <span className="text-black font-black text-4xl">C*</span>
          </div>

          <div className="space-y-6">
            <h2 className="text-5xl lg:text-7xl font-black tracking-tighter uppercase leading-none">
              Em breve teremos <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">novas datas.</span>
            </h2>
            <p className="text-xl text-zinc-500 max-w-lg mx-auto leading-relaxed">
              As inscrições para este ciclo estão encerradas. Fica atento às nossas redes sociais para o próximo anúncio.
            </p>
          </div>

          <div className="flex justify-center gap-6">
            <a href="#" className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-amber-500/50 transition-all hover:scale-105"><Instagram className="w-6 h-6 text-zinc-400" /></a>
            <a href="#" className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-amber-500/50 transition-all hover:scale-105"><Facebook className="w-6 h-6 text-zinc-400" /></a>
            <a href="#" className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-amber-500/50 transition-all hover:scale-105"><Linkedin className="w-6 h-6 text-zinc-400" /></a>
          </div>
        </motion.div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-[#111] border border-zinc-800 p-12 rounded-[40px] text-center shadow-2xl"
        >
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-amber-400/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-amber-400" />
            </div>
          </div>
          <h2 className="text-3xl font-black mb-4 uppercase tracking-tight">Inscrição Recebida!</h2>
          <p className="text-zinc-400 mb-8 font-medium">
            Estamos muito felizes com o seu interesse. Verifique as instruções de confirmação via MB Way.
          </p>
          <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 text-left mb-8">
            <p className="text-[10px] font-black text-amber-500 mb-2 uppercase tracking-[0.2em]">Confirmar Pagamento</p>
            <p className="text-white font-bold text-lg">Investimento: {event.price}€</p>
            <p className="text-zinc-100 font-semibold mt-1">MB Way: +351 918 704 170</p>
            <p className="text-zinc-500 text-[10px] mt-1 uppercase font-bold">Gabriel Torres (Líder CRIE Braga)</p>
          </div>
          <button 
            onClick={() => setSuccess(false)}
            className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-zinc-200 transition-all uppercase tracking-widest text-sm"
          >
            Voltar ao Início
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white selection:bg-amber-400/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-400/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-400/5 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 lg:py-24 grid lg:grid-cols-2 gap-16 items-start">
        
        {/* Left Side: Info */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-12"
        >
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <div className="relative w-16 h-16 bg-gradient-to-tr from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <span className="text-black font-black text-3xl">C*</span>
               </div>
               <div>
                 <h2 className="text-zinc-400 font-medium tracking-[0.2em] uppercase text-xs">Lagoinha Global</h2>
                 <h1 className="text-2xl font-black tracking-tight uppercase">CRIE BRAGA</h1>
               </div>
            </div>
            
            <h2 className="text-5xl lg:text-7xl font-black leading-none tracking-tighter uppercase">
              Celebrar e avançar nos <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200">negócios.</span>
            </h2>
            
            <p className="text-xl text-zinc-400 max-w-lg leading-relaxed font-medium">
              {event.description || "Um encontro para empresários que buscam crescimento e networking cristão."}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8 bg-zinc-900/40 p-10 rounded-[40px] border border-zinc-800/50 backdrop-blur-sm shadow-xl">
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/50">
                <Calendar className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Data & Hora</p>
                <p className="text-zinc-100 font-bold text-lg leading-tight">
                  {new Date(event.date).toLocaleDateString()}
                  <br/>
                  <span className="text-sm font-medium text-zinc-400">às {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}h</span>
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/50">
                <MapPin className="w-7 h-7 text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] mb-1">Localização</p>
                <p className="text-zinc-100 font-bold text-lg leading-tight">{event.location}</p>
                <p className="text-zinc-500 text-xs mt-1 font-medium">Nogueira - Braga</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-500">Convidados Especiais</h3>
            <div className="flex flex-wrap gap-3">
              {["Manoal Alvino", "Bernard Alves", "Gabriel Torres"].map((name) => (
                <div key={name} className="px-6 py-4 rounded-3xl bg-zinc-900/50 border border-zinc-800/80 text-sm font-bold hover:border-amber-400/30 transition-all hover:scale-105 cursor-default">
                  {name}
                </div>
              ))}
            </div>
          </div>

          <div className="p-10 rounded-[40px] bg-amber-400/[0.02] border border-amber-400/10 space-y-4">
             <div className="flex items-center gap-3">
               <Info className="w-5 h-5 text-amber-400" />
               <h3 className="font-black text-xl text-amber-200 uppercase tracking-tight">O que é o CRIE?</h3>
             </div>
             <p className="text-zinc-400 leading-relaxed font-medium">
               O CRIE é um ministério da Igreja Lagoinha, dedicado a empresários que buscam relacionamento e crescimento pessoal, profissional e espiritual entre outros empresários.
             </p>
          </div>
        </motion.div>

        {/* Right Side: Form */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f0f] border border-zinc-800/80 rounded-[48px] p-8 lg:p-14 shadow-2xl relative overflow-hidden"
        >
          {/* Flag (Capacity Badge) */}
          {flag && (
            <div className={cn(
              "absolute top-0 left-0 right-0 py-3 text-center text-[10px] font-black tracking-[0.3em] uppercase flex items-center justify-center gap-2",
              flag.color,
              "text-white"
            )}>
              <flag.icon className="w-3 h-3" />
              {flag.text}
            </div>
          )}

          <div className="absolute top-12 right-14 text-right">
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Investimento</p>
            <p className="text-4xl font-black text-amber-400">{event.price}€</p>
          </div>

          <div className="pt-8">
            <h3 className="text-3xl font-black mb-1 uppercase tracking-tight">Inscrição</h3>
            <p className="text-zinc-500 font-medium mb-10 uppercase text-[10px] tracking-widest">{event.title}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/50 rounded-2xl text-red-500 text-sm font-bold flex items-center gap-3"
                >
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Nome Completo</label>
              <input 
                required
                name="name"
                disabled={event.isFull || formLoading}
                type="text" 
                placeholder="Seu nome aqui"
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl px-8 py-5 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400/50 transition-all font-medium disabled:opacity-30"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">WhatsApp</label>
                <input 
                  required
                  name="phone"
                  disabled={event.isFull || formLoading}
                  type="tel" 
                  placeholder="+351"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl px-8 py-5 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400/50 transition-all font-medium disabled:opacity-30"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Email</label>
                <input 
                  required
                  name="email"
                  disabled={event.isFull || formLoading}
                  type="email" 
                  placeholder="seu@email.com"
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl px-8 py-5 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400/50 transition-all font-medium disabled:opacity-30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Área / Indústria</label>
              <select 
                required
                name="industry"
                disabled={event.isFull || formLoading}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-3xl px-8 py-5 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400/50 transition-all font-medium disabled:opacity-30 appearance-none"
              >
                <option value="" disabled selected>Selecione sua área</option>
                <option value="Tecnologia">Tecnologia</option>
                <option value="Imobiliário">Imobiliário</option>
                <option value="Vendas / Comercial">Vendas / Comercial</option>
                <option value="Marketing / Design">Marketing / Design</option>
                <option value="Saúde / Bem-estar">Saúde / Bem-estar</option>
                <option value="Educação">Educação</option>
                <option value="Gastronomia">Gastronomia</option>
                <option value="Retalho / Comércio">Retalho / Comércio</option>
                <option value="Construção">Construção</option>
                <option value="Finanças / Consultoria">Finanças / Consultoria</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-1">Comprovativo MB WAY (Opcional)</label>
              <label className="flex items-center gap-4 p-5 bg-zinc-900/50 border border-zinc-800 rounded-3xl cursor-pointer hover:border-amber-400/30 transition-all group">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center group-hover:bg-amber-400/10 transition-colors">
                  <Paperclip className="w-6 h-6 text-zinc-500 group-hover:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-zinc-300 truncate">
                    {selectedFile ? selectedFile.name : "Clique para anexar o comprovativo"}
                  </p>
                  <p className="text-[10px] text-zinc-500 uppercase font-black tracking-tight">Imagem ou PDF</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="pt-4">
              <div className="bg-zinc-900/40 rounded-[32px] p-8 border border-zinc-800/50 mb-10 border-dashed">
                <div className="flex gap-5 items-start">
                  <DollarSign className="w-6 h-6 text-amber-500 mt-1" />
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-2">Instruções de Confirmação</p>
                    <p className="text-white font-bold text-lg mb-1"> Gabriel Torres: +351 918 704 170</p>
                    <p className="text-zinc-500 text-xs font-medium italic leading-relaxed">
                      O valor de {event.price}€ deve ser enviado por MB Way para garantir a vaga. Enviaremos um e-mail com os detalhes.
                    </p>
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={event.isFull || formLoading}
                className={cn(
                  "w-full py-6 rounded-[32px] bg-gradient-to-r from-amber-400 to-amber-600 text-black font-black text-lg shadow-2xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:grayscale disabled:opacity-30 disabled:hover:scale-100",
                  formLoading && "animate-pulse"
                )}
              >
                {formLoading ? "A REGISTAR..." : event.isFull ? "VAGAS ESGOTADAS" : "GARANTIR MINHA VAGA"}
              </button>
            </div>
          </form>

          <p className="text-center text-zinc-700 text-[10px] mt-10 uppercase tracking-[0.3em] font-black">
            © 2026 CRIE BRAGA • LAGOINHA GLOBAL
          </p>
        </motion.div>

      </div>
    </div>
  );
}
