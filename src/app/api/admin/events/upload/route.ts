import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null as any;

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role;

  if (!session || !["MASTER_ADMIN", "GLOBAL_LEADER", "REGIONAL_LEADER", "LOCAL_LEADER"].includes(role as string)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const fileExt = file.name.split(".").pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = `banners/${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from("events")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      // Create bucket if it doesn't exist (Events bucket)
      if (error.message.includes("bucket not found")) {
         await supabaseAdmin.storage.createBucket("events", { public: true });
         // Retry upload
         const { data: retryData, error: retryError } = await supabaseAdmin.storage
           .from("events")
           .upload(filePath, file);
         if (retryError) throw retryError;
      } else {
         throw error;
      }
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("events")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error("Banner upload error:", error);
    return NextResponse.json({ error: "Erro ao fazer upload do banner", details: error.message }, { status: 500 });
  }
}
