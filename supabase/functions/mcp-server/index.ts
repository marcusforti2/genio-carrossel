import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function getAuthenticatedUser(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const keyHash = await hashKey(apiKey);
    const { data: userId } = await supabase.rpc("get_user_by_api_key", { p_key_hash: keyHash });
    if (userId) return { userId, supabase };
  }
  return null;
}

// ── Carousel schema docs (exposed to Claude Code) ──

const CAROUSEL_DATA_SCHEMA = {
  type: "object",
  description: `Full CarouselData object. The app renders each slide as an Instagram carousel card (1080x1350).
Design templates: editorial, moderno, bold, minimal.
Font families: serif, sans.
Title sizes: normal, grande, impacto.
Body sizes: pequeno, medio, grande.
BG modes: dark, light.
Accent presets (HSL): "1 83% 55%" (red), "25 95% 53%" (orange), "45 93% 47%" (yellow), "142 71% 45%" (green), "217 91% 60%" (blue), "263 70% 50%" (purple), "330 81% 60%" (pink), "0 0% 90%" (white).
Slide types: cover (first), content (middle), cta (last/optional).`,
  properties: {
    profileName: { type: "string", description: "Author name shown on slides" },
    profileHandle: { type: "string", description: "@handle shown on slides" },
    brandingText: { type: "string", description: "Brand name in footer" },
    brandingSubtext: { type: "string", description: "Tagline in footer" },
    avatarUrl: { type: "string", description: "Avatar image URL (optional)" },
    theme: {
      type: "object",
      properties: {
        bgMode: { type: "string", enum: ["dark", "light"] },
        accentColor: { type: "string", description: "HSL values e.g. '217 91% 60%'" },
        accentName: { type: "string" },
        bgColor: { type: "string", description: "Optional custom bg HSL" },
      },
      required: ["bgMode", "accentColor", "accentName"],
    },
    footer: {
      type: "object",
      properties: {
        showBranding: { type: "boolean" },
        showHandle: { type: "boolean" },
        showCta: { type: "boolean" },
        ctaText: { type: "string" },
      },
    },
    designStyle: {
      type: "object",
      properties: {
        template: { type: "string", enum: ["editorial", "moderno", "bold", "minimal"] },
        fontFamily: { type: "string", enum: ["serif", "sans"] },
        titleSize: { type: "string", enum: ["normal", "grande", "impacto"] },
        bodySize: { type: "string", enum: ["pequeno", "medio", "grande"] },
      },
      required: ["template", "fontFamily", "titleSize", "bodySize"],
    },
    slides: {
      type: "array",
      description: "Array of slides. First should be type 'cover', middle ones 'content', optionally last one 'cta'.",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["cover", "content", "cta"] },
          title: { type: "string", description: "Slide headline (keep punchy, max ~15 words)" },
          body: { type: "string", description: "Slide body text (content slides, ~40-80 words)" },
          hasImage: { type: "boolean", description: "Whether slide has a background/side image" },
          imageUrl: { type: "string", description: "Optional image URL" },
        },
        required: ["type", "title", "body", "hasImage"],
      },
    },
  },
  required: ["profileName", "profileHandle", "theme", "designStyle", "slides"],
};

// ── MCP Tool definitions ──

const TOOLS = [
  {
    name: "list_projects",
    description: "List all carousel projects for the authenticated user",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_project",
    description: "Get a specific project by ID",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "string", description: "Project UUID" } },
      required: ["project_id"],
    },
  },
  {
    name: "create_project",
    description: "Create a new carousel project with raw data. Prefer generate_carousel for creating content-ready carousels.",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string", description: "Project title" },
        data: { type: "object", description: "Carousel data (slides, theme, etc.)" },
      },
      required: ["title"],
    },
  },
  {
    name: "generate_carousel",
    description: `Generate a complete Instagram carousel project ready to view/export. 
Fetches the user's profile (name, handle, branding, niche, audience, tone) and builds a full CarouselData with the app's standard structure.
You provide the topic and slide content; the tool fills in profile info, IDs, and saves it as a project.
IMPORTANT: Write titles that are punchy hooks (max ~15 words). Body text should be ~40-80 words per content slide. 
Use 4-6 slides total (1 cover + 2-4 content + optional CTA).`,
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Overall carousel topic/hook (used as project title)" },
        slides: {
          type: "array",
          description: "Slide definitions. First = cover, middle = content, last can be cta.",
          items: {
            type: "object",
            properties: {
              type: { type: "string", enum: ["cover", "content", "cta"], description: "cover for first slide, content for middle, cta for final call-to-action" },
              title: { type: "string", description: "Headline text" },
              body: { type: "string", description: "Body text (empty string for cover)" },
              hasImage: { type: "boolean", description: "true to show image area on slide" },
            },
            required: ["type", "title", "body"],
          },
        },
        template: { type: "string", enum: ["editorial", "moderno", "bold", "minimal"], description: "Design template (default: bold)" },
        fontFamily: { type: "string", enum: ["serif", "sans"], description: "Font (default: sans)" },
        titleSize: { type: "string", enum: ["normal", "grande", "impacto"], description: "Title size (default: grande)" },
        bodySize: { type: "string", enum: ["pequeno", "medio", "grande"], description: "Body size (default: grande)" },
        bgMode: { type: "string", enum: ["dark", "light"], description: "Background mode (default: dark)" },
        accentColor: { type: "string", description: "Accent HSL e.g. '217 91% 60%' (default: red)" },
        accentName: { type: "string", description: "Accent name (default: Vermelho)" },
      },
      required: ["topic", "slides"],
    },
  },
  {
    name: "get_carousel_schema",
    description: "Returns the full CarouselData JSON schema so you know exactly how to structure carousel data for create_project or update_project.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "update_project",
    description: "Update an existing project",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project UUID" },
        title: { type: "string", description: "New title" },
        data: CAROUSEL_DATA_SCHEMA,
      },
      required: ["project_id"],
    },
  },
  {
    name: "delete_project",
    description: "Delete a project",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "string", description: "Project UUID" } },
      required: ["project_id"],
    },
  },
  {
    name: "get_profile",
    description: "Get the user profile (brand info, niche, audience, tone, etc.). Use this to personalize carousel content.",
    inputSchema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "update_profile",
    description: "Update user profile fields",
    inputSchema: {
      type: "object",
      properties: {
        display_name: { type: "string" },
        handle: { type: "string" },
        niche: { type: "string" },
        target_audience: { type: "string" },
        tone_of_voice: { type: "string" },
        value_proposition: { type: "string" },
        common_enemy: { type: "string" },
        beliefs: { type: "string" },
        branding_text: { type: "string" },
        branding_subtext: { type: "string" },
      },
      required: [],
    },
  },
];

async function handleToolCall(toolName: string, args: any, userId: string, supabase: any) {
  switch (toolName) {
    case "list_projects": {
      const { data, error } = await supabase
        .from("projects").select("id, title, created_at, updated_at")
        .eq("user_id", userId).order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    }
    case "get_project": {
      const { data, error } = await supabase
        .from("projects").select("*")
        .eq("id", args.project_id).eq("user_id", userId).single();
      if (error) throw new Error("Project not found");
      return data;
    }
    case "create_project": {
      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: userId, title: args.title, data: args.data || {} })
        .select().single();
      if (error) throw error;
      return data;
    }
    case "generate_carousel": {
      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles").select("*").eq("user_id", userId).single();

      const profileName = profile?.display_name || "";
      const profileHandle = profile?.handle || "";
      const brandingText = profile?.branding_text || "";
      const brandingSubtext = profile?.branding_subtext || "";
      const avatarUrl = profile?.avatar_url || "";

      const carouselId = crypto.randomUUID();
      const slides = (args.slides || []).map((s: any) => ({
        id: crypto.randomUUID(),
        type: s.type || "content",
        title: s.title || "",
        body: s.body || "",
        hasImage: s.hasImage ?? (s.type === "cover" ? true : s.type === "content"),
      }));

      const carouselData = {
        id: carouselId,
        profileName,
        profileHandle,
        brandingText,
        brandingSubtext,
        avatarUrl,
        theme: {
          bgMode: args.bgMode || "dark",
          accentColor: args.accentColor || "1 83% 55%",
          accentName: args.accentName || "Vermelho",
        },
        footer: {
          showBranding: true,
          showHandle: true,
          showCta: true,
          ctaText: "Arrasta para o lado >",
        },
        designStyle: {
          template: args.template || "bold",
          fontFamily: args.fontFamily || "sans",
          titleSize: args.titleSize || "grande",
          bodySize: args.bodySize || "grande",
        },
        slides,
      };

      const { data, error } = await supabase
        .from("projects")
        .insert({ user_id: userId, title: args.topic, data: carouselData })
        .select().single();
      if (error) throw error;

      return {
        message: "Carousel created successfully! Open the app to preview and export.",
        project: data,
        slides_count: slides.length,
        template: carouselData.designStyle.template,
        profile_applied: !!profile,
      };
    }
    case "get_carousel_schema": {
      return {
        schema: CAROUSEL_DATA_SCHEMA,
        tips: [
          "First slide should be type 'cover' with a punchy hook title",
          "Content slides: compelling title + ~40-80 word body",
          "Optional last slide type 'cta' for call-to-action",
          "4-6 slides is ideal for engagement",
          "Use get_profile first to personalize with the user's brand info",
          "accentColor uses HSL format without hsl() wrapper, e.g. '217 91% 60%'",
        ],
        example: {
          topic: "5 erros que matam seu LinkedIn",
          slides: [
            { type: "cover", title: "5 erros que estão matando seu LinkedIn.", body: "", hasImage: true },
            { type: "content", title: "Erro #1: Perfil sem foto profissional.", body: "Perfis sem foto recebem 14x menos visualizações...", hasImage: false },
            { type: "content", title: "Erro #2: Headline genérica.", body: "\"Profissional dedicado\" não diz nada...", hasImage: false },
            { type: "cta", title: "Quer corrigir esses erros?", body: "Salva esse post e compartilha com quem precisa ouvir isso.", hasImage: false },
          ],
        },
      };
    }
    case "update_project": {
      const update: any = {};
      if (args.title) update.title = args.title;
      if (args.data) update.data = args.data;
      const { data, error } = await supabase
        .from("projects").update(update)
        .eq("id", args.project_id).eq("user_id", userId).select().single();
      if (error) throw new Error("Project not found");
      return data;
    }
    case "delete_project": {
      const { error } = await supabase
        .from("projects").delete()
        .eq("id", args.project_id).eq("user_id", userId);
      if (error) throw error;
      return { deleted: true, id: args.project_id };
    }
    case "get_profile": {
      const { data, error } = await supabase
        .from("profiles").select("*").eq("user_id", userId).single();
      if (error) throw new Error("Profile not found");
      return data;
    }
    case "update_profile": {
      const allowed = ["display_name", "handle", "niche", "target_audience", "tone_of_voice", "value_proposition", "common_enemy", "beliefs", "branding_text", "branding_subtext"];
      const update: any = {};
      for (const k of allowed) if (args[k] !== undefined) update[k] = args[k];
      const { data, error } = await supabase
        .from("profiles").update(update).eq("user_id", userId).select().single();
      if (error) throw error;
      return data;
    }
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { jsonrpc, id, method, params } = body;

    if (jsonrpc !== "2.0") {
      return jsonRpc(id, null, { code: -32600, message: "Invalid JSON-RPC version" });
    }

    if (method === "initialize") {
      return jsonRpc(id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "genio-carrossel-mcp", version: "1.0.0" },
      });
    }

    if (method === "notifications/initialized") {
      return jsonRpc(id, {});
    }

    if (method === "tools/list") {
      return jsonRpc(id, { tools: TOOLS });
    }

    if (method === "tools/call") {
      const auth = await getAuthenticatedUser(req);
      if (!auth) {
        return jsonRpc(id, null, { code: -32001, message: "Unauthorized. Provide x-api-key header." });
      }

      const toolName = params?.name;
      const toolArgs = params?.arguments || {};

      try {
        const result = await handleToolCall(toolName, toolArgs, auth.userId, auth.supabase);
        return jsonRpc(id, {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        });
      } catch (e) {
        return jsonRpc(id, {
          content: [{ type: "text", text: `Error: ${e instanceof Error ? e.message : "Unknown error"}` }],
          isError: true,
        });
      }
    }

    return jsonRpc(id, null, { code: -32601, message: `Method not found: ${method}` });
  } catch (e) {
    console.error("MCP error:", e);
    return jsonRpc(null, null, { code: -32700, message: "Parse error" });
  }
});

function jsonRpc(id: any, result: any, error?: any) {
  const body: any = { jsonrpc: "2.0", id };
  if (error) body.error = error;
  else body.result = result;
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
