import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Sparkles, Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface ProfileData {
  display_name: string;
  handle: string;
  branding_text: string;
  branding_subtext: string;
  niche: string;
  target_audience: string;
  common_enemy: string;
  beliefs: string;
  tone_of_voice: string;
  value_proposition: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [rawText, setRawText] = useState("");
  const [profile, setProfile] = useState<ProfileData>({
    display_name: "",
    handle: "",
    branding_text: "",
    branding_subtext: "",
    niche: "",
    target_audience: "",
    common_enemy: "",
    beliefs: "",
    tone_of_voice: "",
    value_proposition: "",
  });

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data && !error) {
        setProfile({
          display_name: data.display_name || "",
          handle: data.handle || "",
          branding_text: data.branding_text || "",
          branding_subtext: data.branding_subtext || "",
          niche: data.niche || "",
          target_audience: data.target_audience || "",
          common_enemy: data.common_enemy || "",
          beliefs: data.beliefs || "",
          tone_of_voice: data.tone_of_voice || "",
          value_proposition: data.value_proposition || "",
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update(profile)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil salvo!");
    }
    setSaving(false);
  };

  const handleParseWithAI = async () => {
    if (!rawText.trim() || rawText.trim().length < 10) {
      toast.error("Cole mais texto sobre seu negócio (mínimo 10 caracteres)");
      return;
    }
    setParsing(true);

    try {
      const { data, error } = await supabase.functions.invoke("parse-profile", {
        body: { rawText: rawText.trim() },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      // Merge AI results into profile
      setProfile((prev) => ({
        display_name: data.display_name || prev.display_name,
        handle: data.handle || prev.handle,
        branding_text: data.branding_text || prev.branding_text,
        branding_subtext: data.branding_subtext || prev.branding_subtext,
        niche: data.niche || prev.niche,
        target_audience: data.target_audience || prev.target_audience,
        common_enemy: data.common_enemy || prev.common_enemy,
        beliefs: data.beliefs || prev.beliefs,
        tone_of_voice: data.tone_of_voice || prev.tone_of_voice,
        value_proposition: data.value_proposition || prev.value_proposition,
      }));

      toast.success("Perfil preenchido pela IA! Revise e salve.");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao processar texto. Tente novamente.");
    } finally {
      setParsing(false);
    }
  };

  const updateField = (field: keyof ProfileData, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-5">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-1.5 text-xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar
        </Button>
        <h1 className="text-sm font-bold font-display">Meu Perfil</h1>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5 text-xs">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Salvar
        </Button>
      </header>

      <div className="max-w-2xl mx-auto p-6 space-y-8">
        {/* AI Auto-fill Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-display">Preenchimento Inteligente</h2>
          </div>
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Cole aqui tudo sobre seu negócio — quem você é, o que faz, seu público, suas crenças, tom de voz, qualquer texto. 
              A IA vai ler, interpretar e preencher todos os campos automaticamente.
            </p>
            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={"Cole aqui qualquer texto sobre seu negócio...\n\nEx: Eu sou Marcus Forti, mentor de aceleração empresarial. Meu público são empreendedores que estão cansados de trabalhar sem resultado. Eu combato o amadorismo no mundo dos negócios. Meu tom é direto, sem rodeios, provocativo. Acredito que negócio bom é negócio que dá lucro e liberdade..."}
              rows={6}
              className="bg-secondary border-border/50 resize-none text-sm"
            />
            <Button
              onClick={handleParseWithAI}
              disabled={parsing || rawText.trim().length < 10}
              className="w-full gap-2"
            >
              {parsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analisando seu texto...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Preencher perfil com IA
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Visual Identity */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display border-b border-border pb-2">Identidade Visual</h2>
          <p className="text-xs text-muted-foreground">Essas informações aparecem nos seus carrosséis.</p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nome de exibição" value={profile.display_name} onChange={(v) => updateField("display_name", v)} placeholder="Leo Baltazar" />
            <Field label="@ Handle" value={profile.handle} onChange={(v) => updateField("handle", v)} placeholder="@leobrf_" />
            <Field label="Texto de branding" value={profile.branding_text} onChange={(v) => updateField("branding_text", v)} placeholder="Marketing Insider" />
            <Field label="Sub-branding" value={profile.branding_subtext} onChange={(v) => updateField("branding_subtext", v)} placeholder="Conteúdo com IA" />
          </div>
        </section>

        {/* Business */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display border-b border-border pb-2">Perfil de Negócio</h2>
          <p className="text-xs text-muted-foreground">A IA usa essas informações para gerar carrosséis personalizados.</p>
          <div className="space-y-4">
            <Field label="Nicho" value={profile.niche} onChange={(v) => updateField("niche", v)} placeholder="Marketing digital, coaching, etc." />
            <FieldArea label="Público-alvo" value={profile.target_audience} onChange={(v) => updateField("target_audience", v)} placeholder="Quem é seu público? O que eles sentem, pensam e querem?" />
            <FieldArea label="Inimigo em comum" value={profile.common_enemy} onChange={(v) => updateField("common_enemy", v)} placeholder="O que vocês dois (você e seu público) combatem? Ex: cultura tóxica de produtividade..." />
            <FieldArea label="Crenças e valores" value={profile.beliefs} onChange={(v) => updateField("beliefs", v)} placeholder="Quais são suas crenças fortes sobre seu mercado?" />
            <FieldArea label="Tom de voz" value={profile.tone_of_voice} onChange={(v) => updateField("tone_of_voice", v)} placeholder="Ex: Provocativo, direto, sem rodeios, com ironia inteligente..." />
            <FieldArea label="Proposta de valor" value={profile.value_proposition} onChange={(v) => updateField("value_proposition", v)} placeholder="O que você entrega de único? Qual a transformação?" />
          </div>
        </section>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-secondary border-border/50" />
  </div>
);

const FieldArea = ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="space-y-1.5">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className="bg-secondary border-border/50 resize-none" />
  </div>
);

export default ProfilePage;
