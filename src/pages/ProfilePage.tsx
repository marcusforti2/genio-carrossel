import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Sparkles, Wand2, Camera, User, AlertCircle, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
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
  avatar_url: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rawText, setRawText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    avatar_url: "",
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
          avatar_url: data.avatar_url || "",
        });
      }
      setLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 2MB)");
      return;
    }

    setUploading(true);
    try {
      // Use fixed filename to avoid conflicts with different extensions
      const filePath = `${user.id}/avatar.png`;

      // Try to remove old file first (ignore errors if doesn't exist)
      await supabase.storage.from("avatars").remove([filePath]);

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        console.error("Upload error details:", uploadError);
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setProfile((prev) => ({ ...prev, avatar_url: avatarUrl }));

      // Save immediately
      await supabase
        .from("profiles")
        .update({ avatar_url: avatarUrl })
        .eq("user_id", user.id);

      toast.success("Foto atualizada!");
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

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

      setProfile((prev) => ({
        ...prev,
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

  const requiredFields: { key: keyof ProfileData; label: string }[] = [
    { key: "display_name", label: "Nome" },
    { key: "handle", label: "Handle" },
    { key: "avatar_url", label: "Foto" },
    { key: "niche", label: "Nicho" },
    { key: "target_audience", label: "Público-alvo" },
    { key: "tone_of_voice", label: "Tom de voz" },
    { key: "value_proposition", label: "Proposta de valor" },
  ];

  const filledCount = requiredFields.filter((f) => profile[f.key]?.trim()).length;
  const totalCount = requiredFields.length;
  const completionPercent = Math.round((filledCount / totalCount) * 100);
  const missingFields = requiredFields.filter((f) => !profile[f.key]?.trim());

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="h-14 border-b border-border flex items-center justify-between px-5">
        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-1.5 text-xs">
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
        {/* Completion Banner */}
        {completionPercent < 100 ? (
          <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
              <p className="text-sm font-semibold text-destructive">
                Perfil {completionPercent}% completo
              </p>
            </div>
            <Progress value={completionPercent} className="h-2" />
            <div className="flex flex-wrap gap-1.5">
              {missingFields.map((f) => (
                <span key={f.key} className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  {f.label}
                </span>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Preencha todos os campos para que a IA gere carrosséis mais personalizados.
            </p>
          </section>
        ) : (
          <section className="rounded-xl border border-green-500/30 bg-green-500/5 p-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-sm font-semibold text-green-600 dark:text-green-400">
              Perfil completo! A IA vai usar todas as informações para gerar carrosséis incríveis.
            </p>
          </section>
        )}

        {/* Avatar Section */}
        <section className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-border bg-secondary flex items-center justify-center">
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin text-foreground" />
              ) : (
                <Camera className="w-5 h-5 text-foreground" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <div>
            <p className="text-sm font-bold font-display">{profile.display_name || "Seu nome"}</p>
            <p className="text-xs text-muted-foreground">{profile.handle || "@seuhandle"}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] text-primary hover:underline mt-1"
            >
              Alterar foto
            </button>
          </div>
        </section>

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
              placeholder={"Cole aqui qualquer texto sobre seu negócio...\n\nEx: Eu sou Marcus Forti, mentor de aceleração empresarial. Meu público são empreendedores que estão cansados de trabalhar sem resultado..."}
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
            <Field label="Nome de exibição" value={profile.display_name} onChange={(v) => updateField("display_name", v)} placeholder="Leo Baltazar" required />
            <Field label="@ Handle" value={profile.handle} onChange={(v) => updateField("handle", v)} placeholder="@leobrf_" required />
            <Field label="Texto de branding" value={profile.branding_text} onChange={(v) => updateField("branding_text", v)} placeholder="Marketing Insider" />
            <Field label="Sub-branding" value={profile.branding_subtext} onChange={(v) => updateField("branding_subtext", v)} placeholder="Conteúdo com IA" />
          </div>
        </section>

        {/* Business */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold font-display border-b border-border pb-2">Perfil de Negócio</h2>
          <p className="text-xs text-muted-foreground">A IA usa essas informações para gerar carrosséis personalizados.</p>
          <div className="space-y-4">
            <Field label="Nicho" value={profile.niche} onChange={(v) => updateField("niche", v)} placeholder="Marketing digital, coaching, etc." required />
            <FieldArea label="Público-alvo" value={profile.target_audience} onChange={(v) => updateField("target_audience", v)} placeholder="Quem é seu público? O que eles sentem, pensam e querem?" required />
            <FieldArea label="Inimigo em comum" value={profile.common_enemy} onChange={(v) => updateField("common_enemy", v)} placeholder="O que vocês dois (você e seu público) combatem?" />
            <FieldArea label="Crenças e valores" value={profile.beliefs} onChange={(v) => updateField("beliefs", v)} placeholder="Quais são suas crenças fortes sobre seu mercado?" />
            <FieldArea label="Tom de voz" value={profile.tone_of_voice} onChange={(v) => updateField("tone_of_voice", v)} placeholder="Ex: Provocativo, direto, sem rodeios, com ironia inteligente..." required />
            <FieldArea label="Proposta de valor" value={profile.value_proposition} onChange={(v) => updateField("value_proposition", v)} placeholder="O que você entrega de único? Qual a transformação?" required />
          </div>
        </section>
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) => (
  <div className="space-y-1.5">
    <Label className={`text-xs ${!value?.trim() && required ? 'text-destructive' : 'text-muted-foreground'}`}>
      {label} {!value?.trim() && required && <span className="text-destructive">•</span>}
    </Label>
    <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`bg-secondary border-border/50 ${!value?.trim() && required ? 'border-destructive/40' : ''}`} />
  </div>
);

const FieldArea = ({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) => (
  <div className="space-y-1.5">
    <Label className={`text-xs ${!value?.trim() && required ? 'text-destructive' : 'text-muted-foreground'}`}>
      {label} {!value?.trim() && required && <span className="text-destructive">•</span>}
    </Label>
    <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`bg-secondary border-border/50 resize-none ${!value?.trim() && required ? 'border-destructive/40' : ''}`} />
  </div>
);

export default ProfilePage;
