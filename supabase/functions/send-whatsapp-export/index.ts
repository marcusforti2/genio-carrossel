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

    const { data: settings, error: sErr } = await admin
      .from("admin_settings").select("*").limit(1).maybeSingle();
    if (sErr) throw sErr;
    if (!settings || !settings.auto_send_on_export) {
      return new Response(JSON.stringify({ skipped: true, reason: "disabled" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!settings.evolution_url || !settings.evolution_api_key || !settings.evolution_instance) {
      return new Response(JSON.stringify({ skipped: true, reason: "not_configured" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;

    // Prefer the calling user's own WhatsApp number (from profile),
    // then explicit body number, then admin fallback.
    const { data: profile } = await admin
      .from("profiles")
      .select("whatsapp_number")
      .eq("user_id", user.id)
      .maybeSingle();
    const userWhats = (profile as any)?.whatsapp_number || "";

    const number = normalizeNumber(userWhats || body.number || settings.whatsapp_number || "");
    if (!number) {
      return new Response(JSON.stringify({ skipped: true, reason: "no_user_number" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

    const sendText = async (text: string) => {
      try {
        const r = await fetch(`${baseUrl}/message/sendText/${instance}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: apiKey },
          body: JSON.stringify({ number, text }),
        });
        if (!r.ok) console.error("[send-whatsapp-export] sendText failed", r.status, (await r.text()).slice(0, 300));
        return r.ok;
      } catch (e) {
        console.error("[send-whatsapp-export] sendText error", (e as Error).message);
        return false;
      }
    };

    // Intro message — present as the user's AI agent "GENIUS"
    const userName = (user.user_metadata?.full_name || user.user_metadata?.name || "").toString().split(" ")[0];
    const greeting = userName ? `Olá, ${userName}! ` : "Olá! ";
    await sendText(
      `${greeting}Aqui é o *GENIUS*, seu agente de IA do Gênio Carrossel ✨\n\nAcabei de finalizar a exportação do seu carrossel. Segue abaixo o arquivo e a legenda pronta pra postar 👇`
    );

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
      // Do NOT attach body.caption here — it's sent as a separate text message below
      // to remain easy to copy/paste on WhatsApp. Only attach a per-file caption if explicitly provided.
      if (f.caption) {
        payload.caption = f.caption;
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

    // Send caption as a follow-up text message (so it's copy-pasteable on WhatsApp)
    let textOk: boolean | undefined;
    if (body.caption && body.caption.trim()) {
      textOk = await sendText(`📝 *Legenda pronta pra postar:*\n\n${body.caption}\n\n— GENIUS 🤖`);
    } else {
      await sendText("Tudo certo por aqui! Qualquer coisa é só chamar. — *GENIUS* 🤖");
    }

    const success = results.every(r => r.ok);
    return new Response(JSON.stringify({ success, results, number, textOk }), {
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
