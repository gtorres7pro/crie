import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userCityIds = session?.user?.cityIds || [];

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER", "APOIADOR"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  try {
    let query = supabaseAdmin
      .from('City')
      .select(`
        *,
        regionalLeader:User!regionalLeaderId(name, email),
        events:Event(count),
        users:_UserCities(count)
      `)
      .order('name', { ascending: true });

    if (role === "MASTER_ADMIN" || role === "GLOBAL_LEADER") {
      // Todos
    } else if (role === "REGIONAL_LEADER") {
      query = query.or(`id.in.(${userCityIds.join(',')}),regionalLeaderId.eq.${session.user.id}`);
    } else {
      query = query.in('id', userCityIds);
    }

    const { data: cities, error } = await query;
    if (error) throw error;

    // Map to match Prisma's counts structure if possible, or just return as is
    const formattedCities = (cities || []).map((c: any) => ({
      ...c,
      _count: {
        events: c.events?.[0]?.count || 0,
        users: c.users?.[0]?.count || 0
      }
    }));

    return NextResponse.json(formattedCities);
  } catch (error: any) {
    console.error("Cities API Error:", error.message);
    return NextResponse.json({ error: "Erro ao buscar cidades" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "MASTER_ADMIN") {
    return NextResponse.json({ error: "Apenas MASTER ADMIN pode criar cidades" }, { status: 403 });
  }

  try {
    const { name, slug, regionName, regionalLeaderId } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: "Nome e Slug são obrigatórios" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('City')
      .insert({
        name,
        slug,
        regionName,
        regionalLeaderId: regionalLeaderId || null
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Postgres code for duplicate key
        return NextResponse.json({ error: "O slug da cidade deve ser único" }, { status: 400 });
      }
      throw error;
    }

    return NextResponse.json({ city: data });
  } catch (error: any) {
    console.error("Create City API Error:", error.message);
    return NextResponse.json({ 
      error: "Erro ao criar cidade",
      details: error.message
    }, { status: 500 });
  }
}
