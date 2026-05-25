import { supabase } from "@/integrations/supabase/client";

/**
 * If admin + integration enabled, sends the exported file to configured WhatsApp.
 * Uploads to Storage first (to avoid edge function memory limits), then passes URL.
 * Silent no-op for non-admins or when not configured.
 */
export async function sendExportToWhatsAppIfEnabled(
  blob: Blob,
  filename: string,
  mimetype: string,
  caption?: string
): Promise<{ sent: boolean; error?: string }> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return { sent: false };

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return { sent: false };

    const { data: settings } = await supabase
      .from("admin_settings").select("*").limit(1).maybeSingle();
    if (!settings || !settings.auto_send_on_export) return { sent: false };
    if (!settings.evolution_url || !settings.evolution_api_key || !settings.evolution_instance || !settings.whatsapp_number) {
      return { sent: false };
    }

    // Upload to Storage to avoid sending large base64 through edge function
    const path = `${userData.user.id}/${Date.now()}-${filename}`;
    const { error: upErr } = await supabase.storage
      .from("whatsapp-exports")
      .upload(path, blob, { contentType: mimetype, upsert: true });
    if (upErr) return { sent: false, error: "Upload: " + upErr.message };

    const { data: pub } = supabase.storage.from("whatsapp-exports").getPublicUrl(path);
    const url = pub.publicUrl;

    const { data, error } = await supabase.functions.invoke("send-whatsapp-export", {
      body: {
        caption,
        files: [{ filename, mimetype, url }],
      },
    });
    if (error) return { sent: false, error: error.message };
    if (!data?.success) return { sent: false, error: JSON.stringify(data?.results?.[0]?.error || data) };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: (e as Error).message };
  }
}
