import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

export async function GET() {
  try {
    const now = new Date();
    // Start of today in ISO
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    // Find the nearest LIVE event that is today or in the future
    const { data: event, error } = await supabase
      .from("Event")
      .select(`
        *,
        bannerUrl,
        attendees:Attendee(id)
      `)
      .eq("status", "LIVE")
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(1)
      .single();

    if (error || !event) {
      return NextResponse.json({ event: null });
    }

    const totalAttendees = event.attendees?.length || 0;
    const occupancy = (totalAttendees / event.capacity) * 100;

    return NextResponse.json({
      event: {
        ...event,
        attendees: undefined, // remove raw attendees
        occupancy,
        isFull: occupancy >= 100
      }
    });

  } catch (error) {
    console.error("Active Event API Error:", error);
    return NextResponse.json({ error: "Erro ao buscar evento ativo." }, { status: 500 });
  }
}
