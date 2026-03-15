"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Shield, 
  Mail, 
  ArrowLeft, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", message: data.message });
      } else {
        throw new Error(data.error || "Erro ao processar solicitação");
      }
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/auth/signin" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-all text-sm font-medium mb-8">
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </Link>
          
          <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center font-black text-black text-2xl shadow-lg shadow-amber-500/10 mx-auto mb-6">
            C*
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Recuperar Senha</h1>
          <p className="text-zinc-500 font-medium">Enviaremos um link de recuperação para seu email</p>
        </div>

        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Seu Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-zinc-600" />
                </div>
                <input
                  required
                  type="email"
                  className="w-full bg-[#111111] border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            {status.message && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "p-4 rounded-2xl flex items-center gap-3 font-bold text-sm",
                  status.type === "success" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                )}
              >
                {status.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                {status.message}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-black py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-lg shadow-amber-500/20 disabled:opacity-50"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              Enviar Link de Recuperação
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
