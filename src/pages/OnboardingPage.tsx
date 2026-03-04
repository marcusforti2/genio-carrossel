import { useState, useRef, useEffect } from "react";
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
  CheckCircle2, Wand2, Rocket, Target, Palette, MessageSquare,
} from "lucide-react";

const TOTAL_STEPS = 4;

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
      toast.success("Perfil preenchido pela IA!");
    } catch {
      toast.error("Erro ao processar texto");
    } finally {
      setParsing(false);
    }
  };

  const canAdvance = (): boolean => {
    switch (step) {
      case 0: return true; // welcome
      case 1: return !!profile.avatar_url && !!profile.display_name.trim() && !!profile.handle.trim();
      case 2: return !!profile.niche.trim() && !!profile.target_audience.trim();
      case 3: return !!profile.tone_of_voice.trim() && !!profile.value_proposition.trim();
      default: return true;
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update(profile).eq("user_id", user.id);
    if (error) {
      toast.error("Erro ao salvar perfil");
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
      {/* Progress bar */}
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

      {/* Content */}
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
              {step === 0 && <StepWelcome />}
              {step === 1 && (
                <StepIdentity
                  profile={profile}
                  updateField={updateField}
                  fileInputRef={fileInputRef}
                  uploading={uploading}
                  onAvatarUpload={handleAvatarUpload}
                />
              )}
              {step === 2 && (
                <StepBusiness
                  profile={profile}
                  updateField={updateField}
                  rawText={rawText}
                  setRawText={setRawText}
                  parsing={parsing}
                  onParse={handleParseWithAI}
                />
              )}
              {step === 3 && (
                <StepVoice profile={profile} updateField={updateField} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
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

          {step < TOTAL_STEPS - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canAdvance()}
              className="gap-2 px-6"
            >
              Continuar
              <ArrowRight className="w-4 h-4" />
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

/* ─── Step Components ─── */

const StepWelcome = () => (
  <div className="text-center space-y-6">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
      className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto"
    >
      <Sparkles className="w-9 h-9 text-primary" />
    </motion.div>
    <div className="space-y-3">
      <h1 className="text-3xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
        Bem-vindo ao Carousel Spark
      </h1>
      <p className="text-muted-foreground text-sm leading-relaxed max-w-sm mx-auto">
        Antes de criar seus carrosséis com IA, vamos configurar seu perfil. 
        Isso leva <span className="text-foreground font-semibold">menos de 2 minutos</span> e garante 
        que todo conteúdo gerado tenha a <span className="text-primary font-semibold">sua cara</span>.
      </p>
    </div>
    <div className="grid grid-cols-3 gap-3 pt-2">
      {[
        { icon: Palette, label: "Sua identidade", desc: "Foto, nome e marca" },
        { icon: Target, label: "Seu negócio", desc: "Nicho e público" },
        { icon: MessageSquare, label: "Sua voz", desc: "Tom e proposta" },
      ].map(({ icon: Icon, label, desc }) => (
        <div key={label} className="rounded-xl border border-border bg-card p-3 space-y-2">
          <Icon className="w-5 h-5 text-primary mx-auto" />
          <p className="text-[11px] font-bold text-foreground">{label}</p>
          <p className="text-[10px] text-muted-foreground">{desc}</p>
        </div>
      ))}
    </div>
  </div>
);

const StepIdentity = ({
  profile, updateField, fileInputRef, uploading, onAvatarUpload,
}: {
  profile: any;
  updateField: (f: string, v: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploading: boolean;
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <Palette className="w-8 h-8 text-primary mx-auto" />
      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
        Sua identidade
      </h2>
      <p className="text-sm text-muted-foreground">
        Como você quer aparecer nos seus carrosséis?
      </p>
    </div>

    {/* Avatar */}
    <div className="flex justify-center">
      <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
        <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-dashed border-primary/40 bg-card flex items-center justify-center transition-all group-hover:border-primary">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Camera className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] text-muted-foreground group-hover:text-primary">Enviar foto</span>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          )}
        </div>
        {profile.avatar_url && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*" onChange={onAvatarUpload} className="hidden" />
      </div>
    </div>
    {!profile.avatar_url && (
      <p className="text-[11px] text-destructive text-center">* Foto obrigatória</p>
    )}

    {/* Name & Handle */}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Nome de exibição *</Label>
        <Input
          value={profile.display_name}
          onChange={(e) => updateField("display_name", e.target.value)}
          placeholder="Marcus Forti"
          className="bg-secondary border-border/50"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">@ Handle *</Label>
        <Input
          value={profile.handle}
          onChange={(e) => updateField("handle", e.target.value)}
          placeholder="@marcusforti"
          className="bg-secondary border-border/50"
        />
      </div>
    </div>

    {/* Branding */}
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Texto de branding</Label>
        <Input
          value={profile.branding_text}
          onChange={(e) => updateField("branding_text", e.target.value)}
          placeholder="Marketing Insider"
          className="bg-secondary border-border/50"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Sub-branding</Label>
        <Input
          value={profile.branding_subtext}
          onChange={(e) => updateField("branding_subtext", e.target.value)}
          placeholder="Conteúdo com IA"
          className="bg-secondary border-border/50"
        />
      </div>
    </div>
  </div>
);

const StepBusiness = ({
  profile, updateField, rawText, setRawText, parsing, onParse,
}: {
  profile: any;
  updateField: (f: string, v: string) => void;
  rawText: string;
  setRawText: (v: string) => void;
  parsing: boolean;
  onParse: () => void;
}) => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <Target className="w-8 h-8 text-primary mx-auto" />
      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
        Seu negócio
      </h2>
      <p className="text-sm text-muted-foreground">
        Conte sobre seu nicho e público para a IA te entender
      </p>
    </div>

    {/* AI Auto-fill */}
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Wand2 className="w-4 h-4 text-primary" />
        <span className="text-xs font-bold text-primary">Atalho: Preencha com IA</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Cole qualquer texto sobre seu negócio e a IA preenche tudo automaticamente.
      </p>
      <Textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Cole aqui sobre seu negócio..."
        rows={3}
        className="bg-secondary border-border/50 resize-none text-sm"
      />
      <Button
        onClick={onParse}
        disabled={parsing || rawText.trim().length < 10}
        variant="outline"
        size="sm"
        className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
      >
        {parsing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando...</> : <><Sparkles className="w-3.5 h-3.5" /> Preencher com IA</>}
      </Button>
    </div>

    <div className="relative flex items-center gap-3">
      <div className="flex-1 h-px bg-border" />
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider">ou preencha manualmente</span>
      <div className="flex-1 h-px bg-border" />
    </div>

    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Nicho *</Label>
        <Input
          value={profile.niche}
          onChange={(e) => updateField("niche", e.target.value)}
          placeholder="Marketing digital, coaching, etc."
          className="bg-secondary border-border/50"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Público-alvo *</Label>
        <Textarea
          value={profile.target_audience}
          onChange={(e) => updateField("target_audience", e.target.value)}
          placeholder="Quem é seu público? O que eles sentem e querem?"
          rows={3}
          className="bg-secondary border-border/50 resize-none"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Inimigo em comum</Label>
        <Textarea
          value={profile.common_enemy}
          onChange={(e) => updateField("common_enemy", e.target.value)}
          placeholder="O que vocês combatem juntos?"
          rows={2}
          className="bg-secondary border-border/50 resize-none"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Crenças e valores</Label>
        <Textarea
          value={profile.beliefs}
          onChange={(e) => updateField("beliefs", e.target.value)}
          placeholder="Suas crenças fortes sobre o mercado"
          rows={2}
          className="bg-secondary border-border/50 resize-none"
        />
      </div>
    </div>
  </div>
);

const StepVoice = ({
  profile, updateField,
}: {
  profile: any;
  updateField: (f: string, v: string) => void;
}) => (
  <div className="space-y-6">
    <div className="text-center space-y-2">
      <MessageSquare className="w-8 h-8 text-primary mx-auto" />
      <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
        Sua voz
      </h2>
      <p className="text-sm text-muted-foreground">
        Como a IA deve escrever por você?
      </p>
    </div>

    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Tom de voz *</Label>
        <Textarea
          value={profile.tone_of_voice}
          onChange={(e) => updateField("tone_of_voice", e.target.value)}
          placeholder="Ex: Provocativo, direto, sem rodeios, com ironia inteligente..."
          rows={3}
          className="bg-secondary border-border/50 resize-none"
        />
        <div className="flex flex-wrap gap-1.5 pt-1">
          {["Direto e provocativo", "Técnico e educacional", "Leve e inspirador", "Profissional e sério"].map((t) => (
            <button
              key={t}
              onClick={() => updateField("tone_of_voice", t)}
              className="text-[10px] px-2.5 py-1 rounded-full border border-border bg-card hover:border-primary/50 hover:text-primary transition-colors"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Proposta de valor *</Label>
        <Textarea
          value={profile.value_proposition}
          onChange={(e) => updateField("value_proposition", e.target.value)}
          placeholder="O que você entrega de único? Qual a transformação?"
          rows={4}
          className="bg-secondary border-border/50 resize-none"
        />
      </div>
    </div>

    {/* Preview card */}
    {profile.display_name && (
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Preview do seu perfil</p>
        <div className="flex items-center gap-3">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} className="w-10 h-10 rounded-full object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="text-sm font-bold">{profile.display_name}</p>
            <p className="text-[11px] text-muted-foreground">{profile.handle}</p>
          </div>
        </div>
        {profile.niche && <p className="text-[11px] text-muted-foreground">📌 {profile.niche}</p>}
      </div>
    )}
  </div>
);

export default OnboardingPage;
