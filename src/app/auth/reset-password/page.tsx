"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Lock, 
  ArrowLeft, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus({ type: "error", message: "Token de recuperação ausente" });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ type: "error", message: "As senhas não coincidem" });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus({ type: "success", message: "Senha redefinida com sucesso! Redirecionando..." });
        setTimeout(() => {
          router.push("/auth/signin");
        }, 2000);
      } else {
        throw new Error(data.error || "Erro ao redefinir senha");
      }
    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Token Inválido</h2>
        <p className="text-zinc-500 mb-8">O link de recuperação parece ser inválido ou expirou.</p>
        <Link href="/auth/forgot-password" title="Tentar novamente" className="text-amber-500 font-bold hover:underline">Solicitar novo link</Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Nova Senha</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-zinc-600" />
            </div>
            <input
              required
              type="password"
              className="w-full bg-[#111111] border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Confirmar Nova Senha</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Lock className="w-5 h-5 text-zinc-600" />
            </div>
            <input
              required
              type="password"
              className="w-full bg-[#111111] border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
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
        Redefinir Senha
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center font-black text-black text-2xl shadow-lg shadow-amber-500/10 mx-auto mb-6">
            C*
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Nova Senha</h1>
          <p className="text-zinc-500 font-medium">Escolha uma senha segura para sua conta</p>
        </div>

        <div className="bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 shadow-2xl">
          <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
