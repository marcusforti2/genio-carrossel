import { supabase } from "@/integrations/supabase/client";

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => {
      const result = fr.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    fr.onerror = reject;
    fr.readAsDataURL(blob);
  });

/**
 * If admin + integration enabled, sends the exported file to configured WhatsApp.
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

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (!isAdmin) return { sent: false };

    // Check settings
    const { data: settings } = await supabase
      .from("admin_settings").select("*").limit(1).maybeSingle();
    if (!settings || !settings.auto_send_on_export) return { sent: false };
    if (!settings.evolution_url || !settings.evolution_api_key || !settings.evolution_instance || !settings.whatsapp_number) {
      return { sent: false };
    }

    const base64 = await blobToBase64(blob);
    const { data, error } = await supabase.functions.invoke("send-whatsapp-export", {
      body: {
        caption,
        files: [{ filename, mimetype, base64 }],
      },
    });
    if (error) return { sent: false, error: error.message };
    if (!data?.success) return { sent: false, error: JSON.stringify(data?.results?.[0]?.error || data) };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: (e as Error).message };
  }
}
