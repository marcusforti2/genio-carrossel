import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface FilePayload {
  filename: string;
  mimetype: string;
  url?: string;     // preferred: public URL (avoids edge memory limits)
  base64?: string;  // legacy fallback
  caption?: string;
}

interface Body {
  files: FilePayload[];
  number?: string;
  caption?: string;
}

const normalizeNumber = (n: string) => n.replace(/\D/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: settings, error: sErr } = await admin
      .from("admin_settings").select("*").limit(1).maybeSingle();
    if (sErr) throw sErr;
    if (!settings || !settings.evolution_url || !settings.evolution_api_key || !settings.evolution_instance) {
      return new Response(JSON.stringify({ error: "Evolution API não configurada" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    const number = normalizeNumber(body.number || settings.whatsapp_number || "");
    if (!number) {
      return new Response(JSON.stringify({ error: "Número de WhatsApp não definido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!body.files?.length) {
      return new Response(JSON.stringify({ error: "Nenhum arquivo enviado" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl = settings.evolution_url.replace(/\/+$/, "");
    const instance = settings.evolution_instance;
    const apiKey = settings.evolution_api_key;

    const results: Array<{ filename: string; ok: boolean; status?: number; error?: string }> = [];

    for (const f of body.files) {
      const isImage = f.mimetype.startsWith("image/");
      const mediatype = isImage ? "image" : "document";
      const media = f.url || f.base64;
      if (!media) {
        results.push({ filename: f.filename, ok: false, error: "no url/base64 provided" });
        continue;
      }

      const payload: Record<string, unknown> = {
        number,
        mediatype,
        mimetype: f.mimetype,
        media,
        fileName: f.filename,
      };
      if (body.caption || f.caption) {
        payload.caption = f.caption || body.caption;
      }

      try {
        const r = await fetch(`${baseUrl}/message/sendMedia/${instance}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify(payload),
        });
        const txt = await r.text();
        results.push({ filename: f.filename, ok: r.ok, status: r.status, error: r.ok ? undefined : txt.slice(0, 300) });
      } catch (e) {
        results.push({ filename: f.filename, ok: false, error: (e as Error).message });
      }
    }

    const success = results.every(r => r.ok);
    return new Response(JSON.stringify({ success, results, number }), {
      status: success ? 200 : 207,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[send-whatsapp-export]", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
