import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Sparkles, ArrowRight, ArrowLeft, Camera, Loader2, User,
  CheckCircle2, Wand2, Rocket, Target,
} from "lucide-react";

const TOTAL_STEPS = 2;

const OnboardingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [rawText, setRawText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({
    display_name: "",
    handle: "",
    avatar_url: "",
    branding_text: "",
    branding_subtext: "",
    niche: "",
    target_audience: "",
    common_enemy: "",
    beliefs: "",
    tone_of_voice: "",
    value_proposition: "",
  });

  const updateField = (field: string, value: string) => {
    setProfile((p) => ({ ...p, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem válida"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Imagem muito grande (máx 2MB)"); return; }

    setUploading(true);
    try {
      const filePath = `${user.id}/avatar.png`;
      await supabase.storage.from("avatars").remove([filePath]);
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setProfile((p) => ({ ...p, avatar_url: avatarUrl }));
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      toast.success("Foto enviada!");
    } catch {
      toast.error("Erro ao enviar foto");
    } finally {
      setUploading(false);
    }
  };

  const handleParseWithAI = async () => {
    if (!rawText.trim() || rawText.trim().length < 10) {
      toast.error("Cole mais texto sobre seu negócio (mínimo 10 caracteres)");
      return;
    }
    setParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke("parse-profile", { body: { rawText: rawText.trim() } });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

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
      toast.success("Perfil preenchido pela IA! Confira e ajuste no próximo passo.");
      setStep(1);
    } catch {
      toast.error("Erro ao processar texto");
    } finally {
      setParsing(false);
    }
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return !!profile.avatar_url && !!profile.handle.trim() && rawText.trim().length >= 10;
      case 1: return !!profile.display_name.trim() && !!profile.handle.trim() && !!profile.niche.trim() && !!profile.target_audience.trim() && !!profile.tone_of_voice.trim() && !!profile.value_proposition.trim();
      default: return true;
    }
  };

  const handleNext = () => {
    if (step === 0) {
      handleParseWithAI();
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .upsert({ ...profile, user_id: user.id }, { onConflict: "user_id" });

    if (error) {
      toast.error("Erro ao salvar perfil. Tente novamente.");
      setSaving(false);
      return;
    }

    toast.success("Perfil completo! Vamos criar carrosséis 🚀");
    navigate("/dashboard", { replace: true });
  };

  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100;

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="w-full px-6 pt-6">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
              Passo {step + 1} de {TOTAL_STEPS}
            </span>
            <span className="text-[10px] text-muted-foreground">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {step === 0 && (
                <StepPhotoAndText
                  profile={profile}
                  fileInputRef={fileInputRef}
                  uploading={uploading}
                  onAvatarUpload={handleAvatarUpload}
                  rawText={rawText}
                  setRawText={setRawText}
                  parsing={parsing}
                  updateField={updateField}
                />
              )}
              {step === 1 && (
                <StepReview
                  profile={profile}
                  updateField={updateField}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full px-6 pb-8">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="gap-1.5 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          {step === 0 ? (
            <Button
              onClick={handleNext}
              disabled={!canAdvance() || parsing}
              className="gap-2 px-6"
            >
              {parsing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Analisando com IA...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Analisar e preencher</>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={!canAdvance() || saving}
              className="gap-2 px-6"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
              ) : (
                <><Rocket className="w-4 h-4" /> Começar a criar</>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Step 1: Photo + Text ─── */

const StepPhotoAndText = ({
  profile, fileInputRef, uploading, onAvatarUpload, rawText, setRawText, parsing, updateField,
}: {
  profile: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploading: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  rawText: string;
  setRawText: (v: string) => void;
  parsing: boolean;
  updateField: (f: string, v: string) => void;
}) => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto"
      >
        <Sparkles className="w-7 h-7 text-primary" />
      </motion.div>
      <h1 className="text-2xl font-black tracking-tight">
        Vamos configurar seu perfil
      </h1>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
        Sua foto, seu @ e um texto sobre você — a IA cuida do resto.
      </p>
    </div>

    {/* Avatar + Handle row */}
    <div className="flex items-center gap-4">
      <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-primary/40 bg-card flex items-center justify-center transition-all group-hover:border-primary">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Camera className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[9px] text-muted-foreground group-hover:text-primary">Enviar foto</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
        {profile.avatar_url && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onAvatarUpload} className="hidden" />
      </div>

      <div className="flex-1 space-y-2">
        {!profile.avatar_url && (
          <p className="text-[10px] text-destructive">* Foto obrigatória</p>
        )}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Seu @ *</Label>
          <Input
            value={profile.handle}
            onChange={(e) => updateField("handle", e.target.value)}
            placeholder="@seuhandle"
            className="bg-secondary border-border/50 text-sm"
          />
        </div>
      </div>
    </div>

    {/* Text for AI */}
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-primary">Conte sobre você e seu negócio</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Cole qualquer texto: bio do Instagram, descrição do negócio, sobre mim do site… A IA vai extrair nome, nicho, público, tom de voz e tudo mais automaticamente.
      </p>
      <Textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Ex: Sou o Marcus Forti, mentor de marketing digital. Ajudo empreendedores a escalar seus negócios usando estratégias de conteúdo e IA. Meu público são donos de negócios digitais que faturam entre 10k e 100k/mês..."
        rows={5}
        className="bg-secondary border-border/50 resize-none text-sm"
        disabled={parsing}
      />
      <p className="text-[10px] text-muted-foreground">Mínimo 10 caracteres</p>
    </div>
  </div>
);

/* ─── Step 2: Review & Edit ─── */

const StepReview = ({
  profile, updateField,
}: {
  profile: any;
  updateField: (f: string, v: string) => void;
}) => (
  <div className="space-y-5">
    <div className="text-center space-y-2">
      <Target className="w-8 h-8 text-primary mx-auto" />
      <h2 className="text-2xl font-black tracking-tight">
        Confira e ajuste
      </h2>
      <p className="text-sm text-muted-foreground">
        A IA preencheu tudo — revise e ajuste o que quiser antes de começar.
      </p>
    </div>

    {/* Preview card */}
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        {profile.avatar_url ? (
          <img src={profile.avatar_url} className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="flex-1">
          <Input
            value={profile.display_name}
            onChange={(e) => updateField("display_name", e.target.value)}
            placeholder="Seu nome *"
            className="bg-transparent border-none p-0 h-auto text-sm font-bold focus-visible:ring-0"
          />
          <Input
            value={profile.handle}
            onChange={(e) => updateField("handle", e.target.value)}
            placeholder="@handle *"
            className="bg-transparent border-none p-0 h-auto text-[11px] text-muted-foreground focus-visible:ring-0"
          />
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Marca</Label>
        <Input value={profile.branding_text} onChange={(e) => updateField("branding_text", e.target.value)} placeholder="Nome da marca" className="bg-secondary border-border/50 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Sub-marca</Label>
        <Input value={profile.branding_subtext} onChange={(e) => updateField("branding_subtext", e.target.value)} placeholder="Tagline" className="bg-secondary border-border/50 text-sm" />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Nicho *</Label>
        <Input value={profile.niche} onChange={(e) => updateField("niche", e.target.value)} placeholder="Seu nicho" className="bg-secondary border-border/50 text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Tom de voz *</Label>
        <Input value={profile.tone_of_voice} onChange={(e) => updateField("tone_of_voice", e.target.value)} placeholder="Direto, provocativo..." className="bg-secondary border-border/50 text-sm" />
      </div>
    </div>

    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Público-alvo *</Label>
      <Textarea value={profile.target_audience} onChange={(e) => updateField("target_audience", e.target.value)} placeholder="Quem é seu público?" rows={2} className="bg-secondary border-border/50 resize-none text-sm" />
    </div>

    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Proposta de valor *</Label>
      <Textarea value={profile.value_proposition} onChange={(e) => updateField("value_proposition", e.target.value)} placeholder="O que você entrega de único?" rows={2} className="bg-secondary border-border/50 resize-none text-sm" />
    </div>

    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Inimigo em comum</Label>
        <Textarea value={profile.common_enemy} onChange={(e) => updateField("common_enemy", e.target.value)} placeholder="O que combatem juntos?" rows={2} className="bg-secondary border-border/50 resize-none text-sm" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Crenças e valores</Label>
        <Textarea value={profile.beliefs} onChange={(e) => updateField("beliefs", e.target.value)} placeholder="Suas convicções" rows={2} className="bg-secondary border-border/50 resize-none text-sm" />
      </div>
    </div>
  </div>
);

export default OnboardingPage;
