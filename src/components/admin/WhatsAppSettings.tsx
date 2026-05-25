import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, MessageCircle, Send, Check } from "lucide-react";

export const WhatsAppSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [testing, setTesting] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [evolutionUrl, setEvolutionUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [instance, setInstance] = useState("");
  const [number, setNumber] = useState("");
  const [autoSend, setAutoSend] = useState(true);
  const loadedRef = useRef(false);
  const idRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("admin_settings").select("*").limit(1).maybeSingle();
      if (!error && data) {
        setId(data.id);
        idRef.current = data.id;
        setEvolutionUrl(data.evolution_url || "");
        setApiKey(data.evolution_api_key || "");
        setInstance(data.evolution_instance || "");
        setNumber(data.whatsapp_number || "");
        setAutoSend(data.auto_send_on_export ?? true);
      }
      setLoading(false);
      // Allow autosave only after the initial load is done
      setTimeout(() => { loadedRef.current = true; }, 100);
    })();
  }, []);

  const save = async (silent = false) => {
    setSaving(true);
    try {
      const payload = {
        evolution_url: evolutionUrl.trim(),
        evolution_api_key: apiKey.trim(),
        evolution_instance: instance.trim(),
        whatsapp_number: number.trim(),
        auto_send_on_export: autoSend,
      };
      const currentId = idRef.current;
      if (currentId) {
        const { error } = await supabase.from("admin_settings").update(payload).eq("id", currentId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("admin_settings").insert(payload).select("id").single();
        if (error) throw error;
        setId(data.id);
        idRef.current = data.id;
      }
      setSavedAt(Date.now());
      if (!silent) toast.success("Configurações salvas");
    } catch (e) {
      toast.error("Erro ao salvar: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Auto-save (debounced) whenever any field changes after the initial load
  useEffect(() => {
    if (!loadedRef.current) return;
    const t = setTimeout(() => { save(true); }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evolutionUrl, apiKey, instance, number, autoSend]);


  const test = async () => {
    setTesting(true);
    try {
      // Small 1x1 png test
      const testPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
      const { data, error } = await supabase.functions.invoke("send-whatsapp-export", {
        body: {
          caption: "✅ Teste de integração WhatsApp do Gênio Carrossel",
          files: [{ filename: "teste.png", mimetype: "image/png", base64: testPng }],
        },
      });
      if (error) throw error;
      if (!data?.success) {
        toast.error("Falhou: " + JSON.stringify(data?.results?.[0]?.error || data));
      } else {
        toast.success("Enviado! Confira seu WhatsApp.");
      }
    } catch (e) {
      toast.error("Erro no teste: " + (e as Error).message);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card><CardContent className="py-8 flex justify-center"><Loader2 className="animate-spin" /></CardContent></Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <MessageCircle className="w-4 h-4 text-primary" />
          Integração WhatsApp (Evolution API)
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Configure para receber automaticamente os carrosséis exportados no seu WhatsApp.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">URL da Evolution API</Label>
            <Input
              value={evolutionUrl}
              onChange={e => setEvolutionUrl(e.target.value)}
              placeholder="https://evolution-api-xxx.srv.hstgr.cloud"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Nome da Instância</Label>
            <Input value={instance} onChange={e => setInstance(e.target.value)} placeholder="ex: minha-instancia" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">API Key</Label>
            <Input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Número de WhatsApp (com DDI+DDD)</Label>
            <Input value={number} onChange={e => setNumber(e.target.value)} placeholder="5515998346245" />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
          <div>
            <p className="text-sm font-medium">Enviar automaticamente ao exportar</p>
            <p className="text-xs text-muted-foreground">Após exportar (.zip ou .pdf), envia direto pro seu WhatsApp.</p>
          </div>
          <Switch checked={autoSend} onCheckedChange={setAutoSend} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => save(false)} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Salvar agora
          </Button>
          <Button onClick={test} disabled={testing || !id} variant="outline" className="gap-2">
            {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Enviar mensagem de teste
          </Button>
          <span className="text-xs text-muted-foreground ml-auto">
            {saving ? "Salvando..." : savedAt ? "✓ Salvo automaticamente" : "Auto-save ativo"}
          </span>
        </div>

      </CardContent>
    </Card>
  );
};
