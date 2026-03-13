"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { 
  Users, 
  Calendar, 
  BarChart3, 
  LogOut, 
  ShieldCheck,
  CheckSquare,
  LayoutDashboard,
  MapPin,
  Users2
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;

  const menuItems = [
    { name: "Inscritos", href: "/admin", icon: Users, show: ["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string) },
    { name: "Eventos", href: "/admin/events", icon: Calendar, show: ["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string) },
    { name: "Check-in", href: "/admin/checkin", icon: CheckSquare, show: true },
    { name: "Usuários", href: "/admin/users", icon: Users2, show: ["MASTER_ADMIN", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string) },
    { name: "Cidades", href: "/admin/cities", icon: MapPin, show: ["MASTER_ADMIN", "GLOBAL_LEADER"].includes(role as string) },
    { name: "Relatórios", href: "/admin/reports", icon: BarChart3, show: ["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string) },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 w-72 bg-[#0a0a0a] border-r border-zinc-800 hidden lg:flex flex-col z-50">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-black text-black">
            C*
          </div>
          <div>
            <h2 className="font-bold text-lg tracking-tight">CRIE Admin</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Painel de Gestão</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 group",
                  isActive 
                    ? "bg-amber-500 text-black font-bold shadow-lg shadow-amber-500/10" 
                    : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-black" : "text-zinc-500 group-hover:text-amber-400")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto p-8 space-y-4">
        <div className="px-4 py-4 bg-zinc-900/50 rounded-2xl border border-zinc-800/50">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
             </div>
             <div className="min-w-0">
               <p className="text-xs font-bold text-zinc-300 truncate">{session?.user?.name || "Apoiador"}</p>
               <p className="text-[10px] text-zinc-500 uppercase font-black truncate">{session?.user?.role?.replace(/_/g, ' ') || "Usuário"}</p>
             </div>
          </div>
        </div>

        <button 
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex items-center gap-4 px-4 py-3.5 w-full text-zinc-500 hover:text-red-400 hover:bg-red-400/5 rounded-2xl transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
