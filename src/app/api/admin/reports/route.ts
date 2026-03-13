import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  const role = session?.user?.role;
  const userCityIds = session?.user?.cityIds || [];

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    // Fetch ALL events (we need all to calculate returning members accurately)
    let eventsQuery = supabaseAdmin
      .from("Event")
      .select(`
        id,
        title,
        date,
        price,
        capacity,
        cityId,
        attendees:Attendee(id, email, phone, presenceStatus, paymentStatus, industry)
      `)
      .order("date", { ascending: true });

    // Isolação por cidade para roles não-globais
    if (["LOCAL_LEADER"].includes(role as string) && userCityIds.length > 0) {
      eventsQuery = eventsQuery.in("cityId", userCityIds);
    }

    const { data: allEvents, error: eventsError } = await eventsQuery;

    if (eventsError) throw eventsError;

    // Filter events based on range for GLOBAL stats, but use all for returning logic
    const filteredEvents = allEvents.filter((e: any) => {
      if (startDate && new Date(e.date) < new Date(startDate)) return false;
      if (endDate && new Date(e.date) > new Date(endDate)) return false;
      return true;
    });

    // Tracking for returning members
    const seenEmails = new Set<string>();
    let totalReturningCount = 0;
    let totalPresentCount = 0;
    let totalMissingCount = 0;
    let totalRevenue = 0;
    let totalNewMembers = 0;
    const industries: Record<string, number> = {};

    const eventPerformance = allEvents.map((event: any, index: number) => {
      const attendees = event.attendees || [];
      const total = attendees.length;
      
      // Returning members in THIS event
      let eventReturning = 0;
      attendees.forEach((a: any) => {
        if (seenEmails.has(a.email)) {
          eventReturning++;
        } else {
          // If it's the first time we see them, mark as seen for future events
          seenEmails.add(a.email);
        }
      });

      const present = attendees.filter((a: any) => a.presenceStatus === "Presente").length;
      const missing = attendees.filter((a: any) => a.presenceStatus === "Faltou").length;
      const paid = attendees.filter((a: any) => a.paymentStatus === "Pago").length;
      const revenue = paid * event.price;

      // Only add to global stats if in filtered range
      const isInRange = filteredEvents.some(fe => fe.id === event.id);
      if (isInRange) {
        totalRevenue += revenue;
        totalPresentCount += present;
        totalMissingCount += missing;
        
        attendees.forEach((a: any) => {
          if (a.industry) {
            const ind = a.industry.trim();
            industries[ind] = (industries[ind] || 0) + 1;
          }
        });
      }

      return {
        id: event.id,
        title: event.title,
        date: event.date,
        isInRange,
        stats: {
          total,
          present,
          returning: eventReturning,
          newMembers: total - eventReturning,
          revenue
        }
      };
    });

    // Global Stats based on filtered range
    const rangeAttendees = filteredEvents.reduce((acc, e) => acc + (e.attendees?.length || 0), 0);
    const rangeReturning = eventPerformance
      .filter(p => p.isInRange)
      .reduce((acc, p) => acc + p.stats.returning, 0);

    // Top Industries (sorted)
    const sortedIndustries = Object.entries(industries)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return NextResponse.json({
      global: {
        totalRevenue,
        totalAttendeesInPeriod: rangeAttendees,
        returningRate: rangeAttendees > 0 ? (rangeReturning / rangeAttendees) * 100 : 0,
        avgAttendanceRate: (totalPresentCount + totalMissingCount) > 0 
          ? (totalPresentCount / (totalPresentCount + totalMissingCount)) * 100 : 0,
        totalEvents: filteredEvents.length
      },
      topIndustries: sortedIndustries,
      eventPerformance: eventPerformance.filter(p => p.isInRange).reverse() // Latest first for chart
    });

  } catch (error) {
    console.error("Reports API Error:", error);
    return NextResponse.json({ error: "Erro ao gerar relatórios." }, { status: 500 });
  }
}
