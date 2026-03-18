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

// MCP Tool definitions
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
    description: "Create a new carousel project",
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
    name: "update_project",
    description: "Update an existing project",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "Project UUID" },
        title: { type: "string", description: "New title" },
        data: { type: "object", description: "Updated carousel data" },
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
    description: "Get the user profile (brand info, niche, audience, etc.)",
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

    // MCP uses JSON-RPC 2.0
    if (jsonrpc !== "2.0") {
      return jsonRpc(id, null, { code: -32600, message: "Invalid JSON-RPC version" });
    }

    // Initialize - no auth needed
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

    // List tools - no auth needed
    if (method === "tools/list") {
      return jsonRpc(id, { tools: TOOLS });
    }

    // Tool calls - auth required
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
