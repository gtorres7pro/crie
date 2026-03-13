"use client";

import { useEffect, useState } from "react";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  Calendar,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  UserPlus,
  Filter,
  RefreshCw
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlobalStats {
  totalRevenue: number;
  totalAttendeesInPeriod: number;
  returningRate: number;
  avgAttendanceRate: number;
  totalEvents: number;
}

interface Industry {
  name: string;
  count: number;
}

interface EventPerformance {
  id: string;
  title: string;
  date: string;
  stats: {
    total: number;
    present: number;
    newMembers: number;
    returning: number;
    revenue: number;
  };
}

export default function AdminReportsPage() {
  const [data, setData] = useState<{
    global: GlobalStats;
    topIndustries: Industry[];
    eventPerformance: EventPerformance[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange.start) params.append("start", dateRange.start);
      if (dateRange.end) params.append("end", dateRange.end);
      
      const res = await fetch(`/api/admin/reports?${params.toString()}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (!data && loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-10 pb-20">
      {/* Header & Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Relatórios & Insights</h1>
          <p className="text-zinc-500 font-medium">Análise de crescimento e retenção da comunidade.</p>
        </div>

        <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-[24px] border border-zinc-800">
           <div className="flex items-center gap-2 px-4">
              <span className="text-[10px] font-black text-zinc-600 uppercase">De</span>
              <input 
                type="date" 
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="bg-transparent text-xs font-bold focus:outline-none"
              />
           </div>
           <div className="w-px h-4 bg-zinc-800" />
           <div className="flex items-center gap-2 px-4">
              <span className="text-[10px] font-black text-zinc-600 uppercase">Até</span>
              <input 
                type="date" 
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="bg-transparent text-xs font-bold focus:outline-none"
              />
           </div>
           <button 
             onClick={fetchReports}
             disabled={loading}
             className="p-3 bg-amber-500 text-black rounded-2xl hover:scale-105 transition-all disabled:opacity-50"
           >
             <Filter className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Global Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Receita no Período" 
          value={`${data.global.totalRevenue.toFixed(2)}€`} 
          icon={DollarSign}
          color="amber"
          loading={loading}
        />
        <StatCard 
          label="Membros Retidos" 
          value={`${Math.round(data.global.returningRate)}%`} 
          icon={RefreshCw}
          trend="Taxa de Volta" 
          color="blue"
          loading={loading}
        />
        <StatCard 
          label="Taxa de Presença" 
          value={`${Math.round(data.global.avgAttendanceRate)}%`} 
          icon={Target}
          color="green"
          loading={loading}
        />
        <StatCard 
          label="Total de Eventos" 
          value={data.global.totalEvents.toString()} 
          icon={Calendar}
          color="purple"
          loading={loading}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Event Performance Chart */}
        <section className="lg:col-span-2 space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Retenção por Evento</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Recorrentes</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-zinc-800" />
                    <span className="text-[9px] font-bold text-zinc-500 uppercase">Novos</span>
                 </div>
              </div>
           </div>
           
           <div className="bg-[#0f0f0f] border border-zinc-900 rounded-[32px] p-8 space-y-8">
              {data.eventPerformance.map((event) => {
                const returningPct = event.stats.total > 0 ? (event.stats.returning / event.stats.total) * 100 : 0;
                return (
                  <div key={event.id} className="space-y-3">
                    <div className="flex justify-between items-end text-xs">
                        <div>
                          <span className="font-bold text-zinc-300">{event.title}</span>
                          <span className="text-zinc-600 ml-2">{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-amber-500">{event.stats.returning} recorrentes</span>
                          <span className="text-zinc-600 mx-2">•</span>
                          <span className="font-black text-zinc-400">{event.stats.newMembers} novos</span>
                        </div>
                    </div>
                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden flex">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${returningPct}%` }}
                          className="h-full bg-amber-500" 
                        />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${100 - returningPct}%` }}
                          className="h-full bg-zinc-800" 
                        />
                    </div>
                  </div>
                );
              })}
              {data.eventPerformance.length === 0 && (
                <div className="py-20 text-center text-zinc-600 font-medium italic">
                   Nenhum evento encontrado neste intervalo de datas.
                </div>
              )}
           </div>
        </section>

        {/* Top Industries */}
        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Perfil Profissional</h3>
              <PieChart className="w-4 h-4 text-zinc-700" />
           </div>

           <div className="bg-[#0f0f0f] border border-zinc-900 rounded-[32px] p-8 space-y-6">
              {data.topIndustries.map((ind, idx) => (
                <div key={ind.name} className="flex items-center gap-4">
                   <div className="w-8 h-8 rounded-lg bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-500">
                      0{idx + 1}
                   </div>
                   <div className="flex-1">
                      <p className="text-sm font-bold uppercase tracking-tight capitalize">{ind.name}</p>
                      <div className="h-1 w-full bg-zinc-900 rounded-full mt-1 overflow-hidden">
                         <div 
                           className="h-full bg-zinc-700" 
                           style={{ width: `${Math.min(100, (ind.count / data.global.totalAttendeesInPeriod) * 100)}%` }} 
                         />
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-xs font-black text-white">{ind.count}</p>
                   </div>
                </div>
              ))}

              {data.topIndustries.length === 0 && (
                <div className="py-10 text-center text-zinc-600 italic text-sm">
                   Aguardando dados...
                </div>
              )}
           </div>
        </section>
      </div>

    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, color, loading }: any) {
  const colors: any = {
    amber: "from-amber-500/20 to-amber-500/5 text-amber-500 border-amber-500/20",
    blue: "from-blue-500/20 to-blue-500/5 text-blue-500 border-blue-500/20",
    green: "from-green-500/20 to-green-500/5 text-green-500 border-green-500/20",
    purple: "from-purple-500/20 to-purple-500/5 text-purple-500 border-purple-500/20"
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "bg-[#0f0f0f] border border-zinc-900 rounded-[32px] p-8 relative overflow-hidden group transition-all",
        "hover:border-zinc-700",
        loading && "opacity-50"
      )}
    >
      <div className={cn("absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-50 blur-3xl rounded-full translate-x-10 -translate-y-10", colors[color])} />
      
      <div className="relative flex flex-col h-full justify-between gap-6">
        <div className="flex justify-between items-start">
          <div className="p-3 bg-zinc-900 rounded-2xl group-hover:scale-110 transition-transform">
            <Icon className="w-5 h-5" />
          </div>
          {trend && (
            <div className="flex items-center gap-1 text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-full">
              {trend}
            </div>
          )}
        </div>

        <div>
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
          <p className="text-3xl font-black">{loading ? "..." : value}</p>
        </div>
      </div>
    </motion.div>
  );
}
