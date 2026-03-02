import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { profile, topic, slideCount, style } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um especialista em criação de carrosséis para Instagram. Seu trabalho é criar carrosséis provocativos, com opinião forte, que geram engajamento.

PERFIL DO CRIADOR:
- Nome: ${profile.display_name || "Criador"}
- Handle: ${profile.handle || "@usuario"}
- Nicho: ${profile.niche || "não definido"}
- Público-alvo: ${profile.target_audience || "não definido"}
- Inimigo em comum: ${profile.common_enemy || "não definido"}
- Crenças: ${profile.beliefs || "não definido"}
- Tom de voz: ${profile.tone_of_voice || "direto e provocativo"}
- Proposta de valor: ${profile.value_proposition || "não definido"}

ESTILO DE NARRATIVA: ${style || "tribunal"}

Estilos disponíveis:
- "tribunal": Julgar, bater no inimigo comum, ser provocativo
- "opinião": Dar opinião forte, ser polêmico e direto
- "informativo": Educar com dados e exemplos, mas com personalidade
- "sacada": Insights rápidos e poderosos, frases de efeito

REGRAS:
1. O primeiro slide é SEMPRE a capa com um gancho irresistível (uma frase provocativa que faz a pessoa parar de rolar o feed)
2. Cada slide de conteúdo tem um TÍTULO BOLD (máximo 5 palavras, impactante) e um CORPO de texto (3-5 linhas, desenvolvendo o argumento)
3. O último slide pode ser um CTA ou conclusão forte
4. Use o tom de voz do criador
5. Ataque o inimigo em comum quando relevante
6. Fale diretamente com o público-alvo
7. Seja provocativo mas autêntico

RESPONDA APENAS com JSON válido, sem markdown, no formato:
{
  "slides": [
    { "type": "cover", "title": "texto do gancho da capa" },
    { "type": "content", "title": "Título bold.", "body": "Corpo do texto desenvolvendo o argumento..." },
    ...
  ],
  "caption": "Legenda para o post do Instagram com hashtags relevantes"
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Crie um carrossel com ${slideCount || 6} slides sobre o tema: "${topic}". Estilo: ${style || "tribunal"}.` },
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
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao seu workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro ao gerar carrossel" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response (handle potential markdown wrapping)
    let parsed;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-carousel error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
