import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateQueryVariants(
  text: string,
  apiKey: string,
  context: { topic?: string; niche?: string; slideTitle?: string; slideBody?: string }
): Promise<string[]> {
  try {
    const ctxLines = [
      context.niche ? `Niche: ${context.niche}` : null,
      context.topic ? `Carousel topic: ${context.topic}` : null,
      context.slideTitle ? `Slide title: ${context.slideTitle}` : null,
      context.slideBody ? `Slide body: ${context.slideBody}` : null,
      `Slide text: ${text}`,
    ].filter(Boolean).join("\n");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "system",
            content: `You are a Pexels stock-photo search expert. From the text + context, output 3 DIFFERENT English search queries that would each return strong, on-topic, EDITORIAL-style photos for a vertical Instagram carousel slide.

Rules:
- Output ONLY a JSON array of 3 strings, nothing else. Example: ["query one","query two","query three"]
- Each query: 2 to 5 words, English only, lowercase
- Each query must describe a CONCRETE VISUAL SCENE: subject + setting/action/object/mood
- Prefer photography vocabulary: "close up", "portrait", "overhead", "candid", "minimal", "moody", "cinematic", "natural light"
- Vary the 3 queries (different subject, angle, or metaphor) so we maximize chances of a great match
- NEVER use abstract words alone ("success", "growth", "mindset"). Anchor them to a real scene.
- NEVER include brand names or text-on-image words ("quote", "typography")
- Stay culturally neutral unless the context specifies otherwise`,
          },
          { role: "user", content: ctxLines },
        ],
      }),
    });

    if (!response.ok) return [text];
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";
    const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const cleaned = parsed.filter((s) => typeof s === "string" && s.trim().length > 0).slice(0, 3);
      console.log(`Variants for "${text}":`, cleaned);
      return cleaned.length ? cleaned : [text];
    }
    return [text];
  } catch (e) {
    console.error("variant generation failed:", e);
    return [text];
  }
}

async function searchPexels(
  apiKey: string,
  query: string,
  perPage: number,
  orientation: "portrait" | "landscape" | "square" = "portrait"
): Promise<any[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}&size=large`;
  const response = await fetch(url, { headers: { Authorization: apiKey } });
  if (!response.ok) {
    console.error("Pexels API error:", response.status);
    return [];
  }
  const data = await response.json();
  return (data.photos || []).map((p: any) => ({
    id: p.id,
    url: p.src.large2x || p.src.large,
    thumbnail: p.src.medium,
    photographer: p.photographer,
    alt: p.alt || query,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, perPage = 5, topic, niche, slideTitle, slideBody, imageQuery, orientation } = await req.json();
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    if (!PEXELS_API_KEY) throw new Error("PEXELS_API_KEY is not configured");

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalOrientation = (orientation === "landscape" || orientation === "square" || orientation === "portrait")
      ? orientation
      : "portrait"; // carrosséis de Instagram são verticais por padrão

    // 1) If AI already provided a precise imageQuery (from generate-carousel), try it FIRST
    if (imageQuery && typeof imageQuery === "string") {
      console.log("Trying AI-provided imageQuery first:", imageQuery);
      const photos = await searchPexels(PEXELS_API_KEY, imageQuery, perPage, finalOrientation);
      if (photos.length >= Math.min(3, perPage)) {
        return new Response(JSON.stringify({ photos }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2) Generate 3 query variants with rich context and try each, accumulating unique photos
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let variants: string[] = [query];
    if (LOVABLE_API_KEY) {
      variants = await generateQueryVariants(query, LOVABLE_API_KEY, { topic, niche, slideTitle, slideBody });
    }
    if (imageQuery && !variants.includes(imageQuery)) variants.unshift(imageQuery);

    const seen = new Set<number>();
    const collected: any[] = [];
    for (const v of variants) {
      if (collected.length >= perPage) break;
      const batch = await searchPexels(PEXELS_API_KEY, v, perPage, finalOrientation);
      for (const p of batch) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          collected.push(p);
          if (collected.length >= perPage) break;
        }
      }
    }

    if (collected.length > 0) {
      return new Response(JSON.stringify({ photos: collected }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Last-resort fallback
    const fallbackPhotos = await searchPexels(PEXELS_API_KEY, "professional workspace", perPage, finalOrientation);
    return new Response(JSON.stringify({ photos: fallbackPhotos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-pexels error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
