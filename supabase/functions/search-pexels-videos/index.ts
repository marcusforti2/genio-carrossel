import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateVideoQueryVariants(
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
            content: `You are a Pexels stock-VIDEO search expert. From the text + context, output 3 DIFFERENT English search queries that would each return strong, on-topic, CINEMATIC b-roll clips for a vertical Instagram carousel slide.

Rules:
- Output ONLY a JSON array of 3 strings, nothing else. Example: ["query one","query two","query three"]
- Each query: 2 to 5 words, English only, lowercase
- Each query MUST describe a CONCRETE VISUAL SCENE WITH MOTION: subject + action + setting
- Prefer video vocabulary: "slow motion", "aerial", "timelapse", "close up", "handheld", "cinematic", "b-roll", "overhead"
- Vary the 3 queries (different angle, action, or metaphor) to maximize match chance
- NEVER use abstract words alone ("success", "growth", "mindset"). Anchor them to a real scene with motion.
- NEVER include brand names, text-on-video terms, or static-photo words
- Stay culturally neutral unless context specifies otherwise`,
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
      console.log(`Video variants for "${text}":`, cleaned);
      return cleaned.length ? cleaned : [text];
    }
    return [text];
  } catch (e) {
    console.error("video variant generation failed:", e);
    return [text];
  }
}

async function searchPexelsVideos(
  apiKey: string,
  query: string,
  perPage: number,
  orientation: "portrait" | "landscape" | "square" = "portrait"
): Promise<any[]> {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}&size=small`;
  const response = await fetch(url, { headers: { Authorization: apiKey } });
  if (!response.ok) {
    console.error("Pexels Video API error:", response.status);
    return [];
  }
  const data = await response.json();
  return (data.videos || []).map((v: any) => {
    const files = v.video_files || [];
    const sdFile = files.find((f: any) => f.quality === "sd" && f.width >= 360) ||
                   files.find((f: any) => f.quality === "hd" && f.width <= 1280) ||
                   files[0];
    return {
      id: v.id,
      url: sdFile?.link || "",
      thumbnail: v.image || "",
      width: sdFile?.width || v.width,
      height: sdFile?.height || v.height,
      duration: v.duration,
      user: v.user?.name || "Unknown",
    };
  }).filter((v: any) => v.url);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, perPage = 5, topic, niche, slideTitle, slideBody, videoQuery, orientation } = await req.json();
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    if (!PEXELS_API_KEY) throw new Error("PEXELS_API_KEY is not configured");

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const finalOrientation = (orientation === "landscape" || orientation === "square" || orientation === "portrait")
      ? orientation
      : "portrait";

    // 1) Try AI-provided precise videoQuery first
    if (videoQuery && typeof videoQuery === "string") {
      console.log("Trying AI-provided videoQuery first:", videoQuery);
      const vids = await searchPexelsVideos(PEXELS_API_KEY, videoQuery, perPage, finalOrientation);
      if (vids.length >= Math.min(3, perPage)) {
        return new Response(JSON.stringify({ videos: vids }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 2) Generate 3 variants with context and accumulate
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let variants: string[] = [query];
    if (LOVABLE_API_KEY) {
      variants = await generateVideoQueryVariants(query, LOVABLE_API_KEY, { topic, niche, slideTitle, slideBody });
    }
    if (videoQuery && !variants.includes(videoQuery)) variants.unshift(videoQuery);

    const seen = new Set<number>();
    const collected: any[] = [];
    for (const v of variants) {
      if (collected.length >= perPage) break;
      const batch = await searchPexelsVideos(PEXELS_API_KEY, v, perPage, finalOrientation);
      for (const item of batch) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          collected.push(item);
          if (collected.length >= perPage) break;
        }
      }
    }

    if (collected.length > 0) {
      return new Response(JSON.stringify({ videos: collected }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Last-resort fallback
    const fallback = await searchPexelsVideos(PEXELS_API_KEY, "professional workspace b-roll", perPage, finalOrientation);
    return new Response(JSON.stringify({ videos: fallback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-pexels-videos error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
