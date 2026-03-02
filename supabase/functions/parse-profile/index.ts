import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { rawText } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!rawText || rawText.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Texto muito curto. Cole mais informações sobre seu negócio." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em branding pessoal e posicionamento digital. O usuário vai colar um texto livre sobre seu negócio, marca, visão etc. Seu trabalho é extrair e REFORMULAR de forma otimizada, clara e profissional as seguintes informações.

Se alguma informação não estiver presente no texto, CRIE uma sugestão inteligente baseada no contexto.

RESPONDA APENAS com JSON válido, sem markdown, neste formato exato:
{
  "display_name": "Nome profissional da pessoa",
  "handle": "@handle_sugerido",
  "branding_text": "Nome da marca/empresa (curto)",
  "branding_subtext": "Tagline ou sub-marca (curto)",
  "niche": "Nicho de atuação (1-2 frases)",
  "target_audience": "Descrição detalhada do público-alvo (2-4 frases). Quem são, o que sentem, o que querem.",
  "common_enemy": "O inimigo em comum entre o criador e o público (2-3 frases). O que combatem juntos.",
  "beliefs": "Crenças e valores fortes sobre o mercado (3-5 frases). Convicções que guiam o conteúdo.",
  "tone_of_voice": "Tom de voz para conteúdo (1-2 frases). Ex: provocativo, direto, com ironia inteligente.",
  "value_proposition": "Proposta de valor única (2-3 frases). O que entrega de diferente, qual transformação oferece."
}`,
          },
          {
            role: "user",
            content: rawText,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao processar texto" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse:", content);
      return new Response(JSON.stringify({ error: "Erro ao interpretar resposta da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-profile error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
