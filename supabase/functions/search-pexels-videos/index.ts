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
            content: `You are a Pexels video search query optimizer. Given any text (often in Portuguese), return ONLY a 2-5 word English search query describing a CONCRETE VISUAL SCENE for a stock video.
Rules:
- Output ONLY the search query, nothing else
- Must be in English
- Describe a real visual scene (people, objects, places)
- NEVER use abstract words alone (success, growth, power)
- Good: "typing laptop office", "city traffic night", "team meeting discussion"
- Bad: "success", "growth mindset", "leadership"`,
          },
          { role: "user", content: text },
        ],
      }),
    });

    if (!response.ok) return text;
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || text;
  } catch {
    return text;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { query, perPage = 5, topic, videoQuery } = await req.json();
    const PEXELS_API_KEY = Deno.env.get("PEXELS_API_KEY");
    if (!PEXELS_API_KEY) throw new Error("PEXELS_API_KEY is not configured");

    if (!query || typeof query !== "string") {
      return new Response(JSON.stringify({ error: "Query is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let searchQuery = videoQuery || query;

    // Translate if no direct videoQuery provided
    if (!videoQuery) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const context = topic ? `${query} (context: ${topic})` : query;
        searchQuery = await translateToVisualQuery(context, LOVABLE_API_KEY);
      }
    }

    console.log("Searching Pexels Videos with:", searchQuery);

    const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(searchQuery)}&per_page=${perPage}&orientation=portrait&size=small`;
    const response = await fetch(url, {
      headers: { Authorization: PEXELS_API_KEY },
    });

    if (!response.ok) {
      console.error("Pexels Video API error:", response.status);
      return new Response(JSON.stringify({ videos: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const videos = (data.videos || []).map((v: any) => {
      // Get the best quality file that's reasonable size (SD or HD)
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

    return new Response(JSON.stringify({ videos }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("search-pexels-videos error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
