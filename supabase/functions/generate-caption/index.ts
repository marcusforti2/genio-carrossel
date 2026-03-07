import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profileName, handle, slideSummary } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const prompt = `Você é um copywriter expert em Instagram. Gere uma legenda de post para um carrossel do Instagram.

Perfil: ${profileName || "Não informado"} (${handle || ""})

Conteúdo dos slides:
${slideSummary}

Regras:
- Escreva em português do Brasil
- Tom profissional mas acessível
- Inclua uma abertura forte (hook)
- Inclua 1-2 perguntas para engajamento
- Inclua um CTA (call to action) claro
- Adicione 5-8 hashtags relevantes ao final
- Use emojis com moderação (2-4)
- Máximo 2200 caracteres (limite do Instagram)
- NÃO inclua "Legenda:" ou qualquer prefixo, comece direto com o texto`;

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um copywriter profissional especializado em Instagram." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[generate-caption] API error:", errText);
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    const caption = result.choices?.[0]?.message?.content?.trim() || "";

    console.log(`[generate-caption] Generated caption (${caption.length} chars)`);

    return new Response(JSON.stringify({ caption }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[generate-caption] Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
