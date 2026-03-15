"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Lock, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/admin/profile");
      const data = await res.json();
      if (data.user) {
        setUserData({
          ...userData,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone || ""
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userData.password && userData.password !== userData.confirmPassword) {
      setStatus({ type: "error", message: "As senhas não coincidem" });
      return;
    }

    setSaving(true);
    setStatus({ type: "", message: "" });

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          password: userData.password || undefined
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao atualizar perfil");
      }

      setStatus({ type: "success", message: "Perfil atualizado com sucesso!" });
      setUserData({ ...userData, password: "", confirmPassword: "" });
      
      // Atualizar sessão do NextAuth
      await update({
        ...session,
        user: {
          ...session?.user,
          name: userData.name,
          email: userData.email
        }
      });

    } catch (error: any) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Meu Perfil</h1>
        <p className="text-zinc-500 font-medium">Gerencie suas informações pessoais e segurança</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 text-center">
            <div className="w-24 h-24 bg-gradient-to-tr from-amber-500 to-amber-600 rounded-[32px] flex items-center justify-center font-black text-black text-4xl shadow-lg shadow-amber-500/10 mx-auto mb-6">
              {userData.name.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-white mb-2">{userData.name}</h2>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/20">
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                {session?.user?.role?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <User className="w-5 h-5 text-amber-500" />
                Dados Pessoais
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Nome Completo</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                    value={userData.name}
                    onChange={(e) => setUserData({...userData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Email</label>
                  <input
                    disabled
                    type="email"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-zinc-500 focus:outline-none font-medium cursor-not-allowed"
                    value={userData.email}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Telefone</label>
                  <input
                    type="text"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                    value={userData.phone}
                    onChange={(e) => setUserData({...userData, phone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="bg-[#0a0a0a] border border-zinc-800 rounded-[32px] p-8 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-500" />
                Alterar Senha
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Nova Senha</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                    value={userData.password}
                    onChange={(e) => setUserData({...userData, password: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-2">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-[#111111] border border-zinc-800 rounded-2xl p-4 text-white focus:outline-none focus:border-amber-500 transition-all font-medium"
                    value={userData.confirmPassword}
                    onChange={(e) => setUserData({...userData, confirmPassword: e.target.value})}
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-600 pl-2">Deixe em branco se não desejar alterar sua senha.</p>
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
              disabled={saving}
              className="w-full bg-white hover:bg-zinc-200 text-black py-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
            >
              {saving && <Loader2 className="w-5 h-5 animate-spin" />}
              Salvar Alterações
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
