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

async function authenticateRequest(req: Request): Promise<{ userId: string; supabase: any } | null> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // Try API key first
  const apiKey = req.headers.get("x-api-key");
  if (apiKey) {
    const keyHash = await hashKey(apiKey);
    const { data: userId } = await supabase.rpc("get_user_by_api_key", { p_key_hash: keyHash });
    if (userId) {
      // Touch last_used_at in background
      supabase.rpc("touch_api_key", { p_key_hash: keyHash }).then(() => {});
      return { userId, supabase };
    }
    return null;
  }

  // Try Bearer token (Supabase JWT)
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data, error } = await userClient.auth.getUser(token);
    if (!error && data?.user) {
      return { userId: data.user.id, supabase };
    }
  }

  return null;
}

async function dispatchWebhooks(supabase: any, userId: string, event: string, payload: any) {
  try {
    const { data: webhooks } = await supabase
      .from("webhooks")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .contains("events", [event]);

    if (!webhooks?.length) return;

    for (const wh of webhooks) {
      try {
        const body = JSON.stringify({ event, data: payload, timestamp: new Date().toISOString() });

        // Create HMAC signature
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey("raw", encoder.encode(wh.secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
        const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
        const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

        const resp = await fetch(wh.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
            "X-Webhook-Event": event,
          },
          body,
        });

        const respBody = await resp.text();
        await supabase.from("webhook_logs").insert({
          webhook_id: wh.id,
          event,
          payload,
          response_status: resp.status,
          response_body: respBody.slice(0, 1000),
        });
      } catch (e) {
        await supabase.from("webhook_logs").insert({
          webhook_id: wh.id,
          event,
          payload,
          response_status: 0,
          response_body: e instanceof Error ? e.message : "Unknown error",
        });
      }
    }
  } catch (e) {
    console.error("Webhook dispatch error:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    // Path: /api/v1/{resource}/{id?}
    // After edge function routing, we get: /{resource}/{id?} or /v1/{resource}/{id?}
    let resource: string | undefined;
    let resourceId: string | undefined;

    if (pathParts[0] === "api") pathParts.shift();
    if (pathParts[0] === "v1") pathParts.shift();
    resource = pathParts[0];
    resourceId = pathParts[1];

    // Public endpoint: API docs
    if (!resource || resource === "docs") {
      return new Response(JSON.stringify({
        name: "Genio Carrossel API",
        version: "1.0.0",
        endpoints: {
          "GET /api/v1/projects": "List all projects",
          "GET /api/v1/projects/:id": "Get a single project",
          "POST /api/v1/projects": "Create a project",
          "PUT /api/v1/projects/:id": "Update a project",
          "DELETE /api/v1/projects/:id": "Delete a project",
          "GET /api/v1/profile": "Get your profile",
          "PUT /api/v1/profile": "Update your profile",
          "GET /api/v1/webhooks": "List your webhooks",
          "POST /api/v1/webhooks": "Create a webhook",
          "DELETE /api/v1/webhooks/:id": "Delete a webhook",
        },
        authentication: "Pass your API key via x-api-key header",
        events: [
          "project.created",
          "project.updated",
          "project.deleted",
        ],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Auth required for everything else
    const auth = await authenticateRequest(req);
    if (!auth) {
      return new Response(JSON.stringify({ error: "Unauthorized. Provide a valid x-api-key header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, supabase } = auth;
    const method = req.method;

    // ===================== PROJECTS =====================
    if (resource === "projects") {
      if (method === "GET" && !resourceId) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });
        if (error) throw error;
        return json(data);
      }

      if (method === "GET" && resourceId) {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", resourceId)
          .eq("user_id", userId)
          .single();
        if (error) return json({ error: "Project not found" }, 404);
        return json(data);
      }

      if (method === "POST") {
        const body = await req.json();
        const { data, error } = await supabase
          .from("projects")
          .insert({ user_id: userId, title: body.title || "Sem título", data: body.data || {} })
          .select()
          .single();
        if (error) throw error;
        dispatchWebhooks(supabase, userId, "project.created", data);
        return json(data, 201);
      }

      if (method === "PUT" && resourceId) {
        const body = await req.json();
        const update: any = {};
        if (body.title !== undefined) update.title = body.title;
        if (body.data !== undefined) update.data = body.data;
        const { data, error } = await supabase
          .from("projects")
          .update(update)
          .eq("id", resourceId)
          .eq("user_id", userId)
          .select()
          .single();
        if (error) return json({ error: "Project not found" }, 404);
        dispatchWebhooks(supabase, userId, "project.updated", data);
        return json(data);
      }

      if (method === "DELETE" && resourceId) {
        const { data, error } = await supabase
          .from("projects")
          .delete()
          .eq("id", resourceId)
          .eq("user_id", userId)
          .select()
          .single();
        if (error) return json({ error: "Project not found" }, 404);
        dispatchWebhooks(supabase, userId, "project.deleted", { id: resourceId });
        return json({ deleted: true });
      }
    }

    // ===================== PROFILE =====================
    if (resource === "profile") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .single();
        if (error) return json({ error: "Profile not found" }, 404);
        return json(data);
      }

      if (method === "PUT") {
        const body = await req.json();
        const allowed = ["display_name", "handle", "avatar_url", "branding_text", "branding_subtext", "niche", "target_audience", "tone_of_voice", "common_enemy", "beliefs", "value_proposition"];
        const update: any = {};
        for (const key of allowed) {
          if (body[key] !== undefined) update[key] = body[key];
        }
        const { data, error } = await supabase
          .from("profiles")
          .update(update)
          .eq("user_id", userId)
          .select()
          .single();
        if (error) throw error;
        return json(data);
      }
    }

    // ===================== WEBHOOKS =====================
    if (resource === "webhooks") {
      if (method === "GET") {
        const { data, error } = await supabase
          .from("webhooks")
          .select("id, url, events, is_active, created_at")
          .eq("user_id", userId);
        if (error) throw error;
        return json(data);
      }

      if (method === "POST") {
        const body = await req.json();
        if (!body.url) return json({ error: "url is required" }, 400);
        const secret = crypto.randomUUID();
        const { data, error } = await supabase
          .from("webhooks")
          .insert({
            user_id: userId,
            url: body.url,
            events: body.events || ["project.created", "project.updated", "project.deleted"],
            secret,
          })
          .select()
          .single();
        if (error) throw error;
        return json({ ...data, secret }, 201);
      }

      if (method === "DELETE" && resourceId) {
        const { error } = await supabase
          .from("webhooks")
          .delete()
          .eq("id", resourceId)
          .eq("user_id", userId);
        if (error) return json({ error: "Webhook not found" }, 404);
        return json({ deleted: true });
      }
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error("API error:", e);
    return json({ error: e instanceof Error ? e.message : "Internal server error" }, 500);
  }
});

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
