import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Verify caller is admin
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return json({ error: "No auth header" }, 401);

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  // Check admin role
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!roleData) return json({ error: "Forbidden: admin only" }, 403);

  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter(Boolean);
  const action = pathParts[pathParts.length - 1] || "";

  try {
    // GET /admin-users/list
    if (action === "list" && req.method === "GET") {
      const page = Number(url.searchParams.get("page") || 1);
      const perPage = 50;

      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
        page,
        perPage,
      });
      if (error) throw error;

      const userIds = users.map((u) => u.id);

      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("user_id, display_name, handle, avatar_url, niche")
        .in("user_id", userIds);

      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const enriched = users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        profile: profiles?.find((p) => p.user_id === u.id) || null,
        roles: roles?.filter((r) => r.user_id === u.id).map((r) => r.role) || [],
      }));

      return json({ users: enriched, total: users.length });
    }

    // POST /admin-users/set-role
    if (action === "set-role" && req.method === "POST") {
      const { user_id, role, action: roleAction } = await req.json();
      if (!user_id || !role) return json({ error: "user_id and role required" }, 400);

      if (roleAction === "remove") {
        const { error } = await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq("user_id", user_id)
          .eq("role", role);
        if (error) throw error;
        return json({ success: true, message: `Role ${role} removed` });
      }

      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id, role }, { onConflict: "user_id,role" });
      if (error) throw error;
      return json({ success: true, message: `Role ${role} assigned` });
    }

    // POST /admin-users/delete
    if (action === "delete" && req.method === "POST") {
      const { user_id } = await req.json();
      if (!user_id) return json({ error: "user_id required" }, 400);
      if (user_id === user.id) return json({ error: "Cannot delete yourself" }, 400);

      const { error } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return json({ success: true });
    }

    // GET /admin-users/stats
    if (action === "stats" && req.method === "GET") {
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const { count: projectCount } = await supabaseAdmin
        .from("projects")
        .select("id", { count: "exact", head: true });

      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const recentUsers = users?.filter((u) => new Date(u.created_at) > weekAgo).length || 0;

      return json({
        total_users: users?.length || 0,
        total_projects: projectCount || 0,
        new_users_7d: recentUsers,
      });
    }

    return json({ error: "Not found" }, 404);
  } catch (e) {
    console.error("[admin-users]", e);
    return json({ error: e instanceof Error ? e.message : "Internal error" }, 500);
  }
});
