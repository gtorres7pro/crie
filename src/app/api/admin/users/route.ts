import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    let query = supabaseAdmin
      .from('User')
      .select(`
        id, name, email, phone, role,
        cities:City!_UserCities(id, name)
      `)
      .order('name', { ascending: true });

    // Filtros baseados na role
    if (role === "LOCAL_LEADER") {
      const { data: userCities } = await supabaseAdmin
        .from('_UserCities')
        .select('B')
        .eq('A', session.user.id);
      const cityIds = userCities?.map(c => c.B) || [];
      // Note: This filtering logic might need to be refined for nested many-to-many
      // for now, we'll fetch then filter locally for simplicity if the RPC/nested filter is complex
      const { data: allUsers } = await query;
      const filtered = allUsers?.filter(u => u.cities.some((c: any) => cityIds.includes(c.id))) || [];
      return NextResponse.json({ users: filtered });
    }
    else if (role === "REGIONAL_LEADER") {
       const { data: ledCities } = await supabaseAdmin
         .from('City')
         .select('id')
         .eq('regionalLeaderId', session.user.id);
       const cityIds = ledCities?.map(c => c.id) || [];
       const { data: allUsers } = await query;
       const filtered = allUsers?.filter(u => u.cities.some((c: any) => cityIds.includes(c.id))) || [];
       return NextResponse.json({ users: filtered });
    }

    const { data: users, error } = await query;
    if (error) throw error;

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Users API Error:", error.message);
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const currentRole = session?.user?.role;
  const currentUserId = session?.user?.id;
  
  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(currentRole as string)) {
    return NextResponse.json({ error: "Não autorizado para criar usuários" }, { status: 403 });
  }

  try {
    const { name, email, phone, password, role, cityIds } = await req.json();

    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 });
    }

    // Regras de Hierarquia
    if (currentRole === "MASTER_ADMIN") {
      // Allow
    } else if (currentRole === "GLOBAL_LEADER") {
      if (role === "MASTER_ADMIN") return NextResponse.json({ error: "Proibido" }, { status: 403 });
    } else if (currentRole === "REGIONAL_LEADER") {
       if (!["LOCAL_LEADER", "APOIADOR"].includes(role)) {
         return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
       }
       const { data: ledCities } = await supabaseAdmin.from('City').select('id').eq('regionalLeaderId', currentUserId);
       const ledCityIds = ledCities?.map(c => c.id) || [];
       if (cityIds?.some((id: string) => !ledCityIds.includes(id))) {
         return NextResponse.json({ error: "Cidade não liderada por você" }, { status: 403 });
       }
    } else if (currentRole === "LOCAL_LEADER") {
      if (role !== "APOIADOR") return NextResponse.json({ error: "Apenas Apoiadores" }, { status: 403 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .insert({
        name,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        role,
      })
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') return NextResponse.json({ error: "Email já cadastrado" }, { status: 400 });
      throw userError;
    }

    if (cityIds && cityIds.length > 0) {
      const relations = cityIds.map((cid: string) => ({ A: user.id, B: cid }));
      await supabaseAdmin.from('_UserCities').insert(relations);
    }

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } });
  } catch (error: any) {
    console.error("Create User Error:", error.message);
    return NextResponse.json({ error: "Erro ao criar usuário", details: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const currentRole = session?.user?.role as string;
  const currentUserId = session?.user?.id as string;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(currentRole)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    const { id, name, email, phone, role, cityIds } = await req.json();
    if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

    // Hierarchy check
    if (currentRole !== "MASTER_ADMIN") {
       const { data: targetUser } = await supabaseAdmin.from('User').select('role').eq('id', id).single();
       if (!targetUser) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
       const roleHierarchy = ["APOIADOR", "LOCAL_LEADER", "REGIONAL_LEADER", "GLOBAL_LEADER", "MASTER_ADMIN"];
       if (roleHierarchy.indexOf(targetUser.role) >= roleHierarchy.indexOf(currentRole)) {
          return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
       }
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('User')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) throw updateError;

    if (cityIds) {
      await supabaseAdmin.from('_UserCities').delete().eq('A', id);
      const relations = cityIds.map((cid: string) => ({ A: id, B: cid }));
      await supabaseAdmin.from('_UserCities').insert(relations);
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Update User Error:", error.message);
    return NextResponse.json({ error: "Erro ao atualizar usuário", details: error.message }, { status: 500 });
  }
}

