import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Stop words to filter out generic/abstract terms
const STOP_WORDS = new Set([
  "como", "para", "uma", "que", "the", "and", "you", "your", "with", "this",
  "from", "are", "was", "were", "been", "have", "has", "had", "not", "but",
  "what", "all", "can", "her", "his", "they", "its", "will", "more", "into",
  "about", "than", "them", "very", "just", "also", "most", "only", "over",
  "such", "some", "todo", "toda", "cada", "mais", "essa", "esse", "isso",
  "está", "são", "seus", "suas", "nosso", "nossa", "você", "quando", "onde",
  "porque", "ainda", "entre", "depois", "antes", "mesmo", "nunca", "sempre",
  "outro", "outra", "outros", "outras", "muito", "muita", "muitos", "muitas",
]);

// Map abstract concepts to visual scenes
const VISUAL_MAPPINGS: Record<string, string[]> = {
  "linkedin": ["professional workspace laptop", "corporate office desk"],
  "cansaço": ["tired person desk", "burnout office worker"],
  "culpa": ["stressed person thinking", "overwhelmed professional"],
  "sucesso": ["achievement celebration", "business milestone"],
  "crescimento": ["plant growing sunlight", "climbing mountain peak"],
  "liderança": ["team meeting leadership", "confident speaker stage"],
  "vendas": ["sales meeting handshake", "retail store customer"],
  "marketing": ["creative team brainstorm", "digital marketing screen"],
  "produtividade": ["focused workspace minimal", "organized desk morning"],
  "dinheiro": ["financial planning desk", "investment portfolio screen"],
  "saúde": ["healthy lifestyle morning", "wellness meditation"],
  "tecnologia": ["modern tech workspace", "coding developer screen"],
  "empreendedorismo": ["startup founder working", "entrepreneur coffee shop"],
  "educação": ["learning classroom books", "student studying library"],
  "carreira": ["career path crossroads", "professional development"],
  "comparação": ["mirror reflection thinking", "social media phone"],
  "performance": ["stage spotlight speaker", "athlete training gym"],
  "identidade": ["person mirror reflection", "unique individual crowd"],
  "fracasso": ["starting over sunrise", "learning mistake growth"],
  "descanso": ["peaceful nature retreat", "relaxation calm space"],
};

function buildSmartQuery(title: string, topic?: string, niche?: string): string[] {
  // Extract meaningful words from title
  const words = title
    .toLowerCase()
    .replace(/[.,!?;:"""''()@#]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP_WORDS.has(w));

  // Check for visual mapping matches
  const mappedQueries: string[] = [];
  for (const word of words) {
    if (VISUAL_MAPPINGS[word]) {
      mappedQueries.push(...VISUAL_MAPPINGS[word]);
    }
  }

  // Build primary query: 2-4 strongest keywords + visual context
  const keywords = words.slice(0, 3);
  
  // Add niche context if available
  const nicheContext = niche ? niche.split(/\s+/).slice(0, 1).join(" ") : "";

  const queries: string[] = [];
  
  // Primary: mapped visual + keywords
  if (mappedQueries.length > 0) {
    queries.push(mappedQueries[0]);
  }

  // Secondary: keywords combined
  if (keywords.length >= 2) {
    queries.push(keywords.slice(0, 3).join(" ") + (nicheContext ? ` ${nicheContext}` : ""));
  }

  // Fallback: broader terms
  if (keywords.length >= 1) {
    queries.push(keywords[0] + " professional");
  }

  // Topic-based fallback
  if (topic) {
    queries.push(topic.split(/\s+/).slice(0, 3).join(" "));
  }

  return queries.length > 0 ? queries : ["professional workspace"];
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

    // If AI provided a specific imageQuery, use it directly
    if (imageQuery && typeof imageQuery === "string") {
      const photos = await searchPexels(PEXELS_API_KEY, imageQuery, perPage);
      if (photos.length > 0) {
        return new Response(JSON.stringify({ photos }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Fall through to smart query if imageQuery returned nothing
    }

    // Build smart queries with fallback chain
    const queries = buildSmartQuery(query, topic, niche);
    
    for (const q of queries) {
      console.log("Trying Pexels query:", q);
      const photos = await searchPexels(PEXELS_API_KEY, q, perPage);
      if (photos.length >= 2) {
        return new Response(JSON.stringify({ photos }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Last resort fallback
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
