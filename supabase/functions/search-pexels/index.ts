import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function translateToVisualQuery(text: string, apiKey: string): Promise<string> {
  try {
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
            content: `You are a Pexels image search query optimizer. Given any text (often in Portuguese), return ONLY a 2-5 word English search query describing a CONCRETE VISUAL SCENE for a stock photo.

Rules:
- Output ONLY the search query, nothing else
- Must be in English
- Describe a real visual scene (people, objects, places)
- NEVER use abstract words alone (success, growth, power)
- Good: "tired office worker laptop", "confident speaker stage", "team brainstorm whiteboard"
- Bad: "success", "growth mindset", "leadership"`,
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) {
      console.error("AI translation error:", response.status);
      return text;
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();
    console.log(`Translated "${text}" -> "${result}"`);
    return result || text;
  } catch (e) {
    console.error("AI translation failed:", e);
    return text;
  }
}

async function searchPexels(apiKey: string, query: string, perPage: number): Promise<any[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`;
  const response = await fetch(url, {
    headers: { Authorization: apiKey },
  });
  if (!response.ok) {
    console.error("Pexels API error:", response.status);
    return [];
  }
  const data = await response.json();
  return (data.photos || []).map((p: any) => ({
    id: p.id,
    url: p.src.large,
    thumbnail: p.src.medium,
    photographer: p.photographer,
    alt: p.alt || query,
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, perPage = 5, topic, bgMode, niche, imageQuery } = await req.json();
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    if (!PEXELS_API_KEY) throw new Error("PEXELS_API_KEY is not configured");

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If AI already provided a specific imageQuery (from generate-carousel), use it directly
    if (imageQuery && typeof imageQuery === "string") {
      console.log("Using AI-provided imageQuery:", imageQuery);
      const photos = await searchPexels(PEXELS_API_KEY, imageQuery, perPage);
      if (photos.length > 0) {
        return new Response(JSON.stringify({ photos }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Use AI to translate the query (likely Portuguese) to an optimized English visual query
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let searchQuery = query;

    if (LOVABLE_API_KEY) {
      const context = topic ? `${query} (context: ${topic})` : query;
      searchQuery = await translateToVisualQuery(context, LOVABLE_API_KEY);
    }

    console.log("Searching Pexels with:", searchQuery);
    const photos = await searchPexels(PEXELS_API_KEY, searchQuery, perPage);

    if (photos.length >= 1) {
      return new Response(JSON.stringify({ photos }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback
    const fallbackPhotos = await searchPexels(PEXELS_API_KEY, "professional workspace", perPage);
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
