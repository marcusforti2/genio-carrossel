import { supabase } from "@/integrations/supabase/client";

/**
 * Sends the exported file to the admin-configured WhatsApp instance.
 * Works for ANY authenticated user — uses the admin's Evolution instance.
 * Upload happens to public Storage bucket; edge function reads admin_settings via service role.
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
    if (data?.skipped) return { sent: false };
    if (!data?.success) return { sent: false, error: JSON.stringify(data?.results?.[0]?.error || data) };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: (e as Error).message };
  }
}
