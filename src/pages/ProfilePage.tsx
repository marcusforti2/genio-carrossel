import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2, Sparkles, Wand2, Camera, User, AlertCircle, CheckCircle2, Upload, FileText, X, Copy, Check, ChevronDown } from "lucide-react";
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
  positioning_thesis: string;
  manifesto: string;
  hooks: string;
  avatar_url: string;
  knowledge_base: string;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [rawText, setRawText] = useState("");
  const [extractingFile, setExtractingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [kbExtracting, setKbExtracting] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const AI_PROMPT_TEMPLATE = `Você é um especialista em branding pessoal e posicionamento digital. Vou te contar sobre mim, meu negócio e meu trabalho, e preciso que você organize TUDO em um texto único, completo e bem estruturado, que eu vou colar em uma ferramenta de IA que cria carrosséis para o Instagram.

O texto final precisa cobrir, em parágrafos corridos (sem títulos, sem bullet points), os seguintes pontos:

1. Quem eu sou (nome completo, o que faço profissionalmente, minha história curta).
2. Minha marca / empresa (nome, tagline, do que se trata).
3. Meu nicho de atuação (em 1-2 frases bem específicas).
4. Meu público-alvo detalhado (quem são, o que sentem, o que querem, o que os frustra).
5. O "inimigo em comum" entre mim e meu público (o que combatemos juntos, contra o que lutamos no mercado).
6. Minhas crenças e convicções fortes sobre o meu mercado (o que eu defendo, o que eu critico).
7. Meu tom de voz para conteúdo (ex: direto, provocativo, com ironia, técnico, acolhedor...).
8. Minha proposta de valor única (o que eu entrego de diferente, qual transformação eu gero).

Antes de escrever, me faça TODAS as perguntas que precisar para entender bem cada um desses pontos. Depois, gere o texto final, em português, em tom profissional mas humano, pronto para eu copiar e colar.

Comece agora me perguntando sobre o item 1.`;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_PROMPT_TEMPLATE);
      setPromptCopied(true);
      toast.success("Prompt copiado! Cole no ChatGPT ou Claude.");
      setTimeout(() => setPromptCopied(false), 2500);
    } catch {
      toast.error("Não foi possível copiar. Selecione manualmente.");
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const kbFileInputRef = useRef<HTMLInputElement>(null);
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
    positioning_thesis: "",
    manifesto: "",
    hooks: "",
    avatar_url: "",
    knowledge_base: "",
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
          positioning_thesis: (data as any).positioning_thesis || "",
          manifesto: (data as any).manifesto || "",
          hooks: (data as any).hooks || "",
          avatar_url: data.avatar_url || "",
          knowledge_base: (data as any).knowledge_base || "",
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
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
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
      .upsert({ ...profile, user_id: user.id }, { onConflict: "user_id" });

    if (error) {
      console.error("Profile save error:", error);
      toast.error("Erro ao salvar perfil");
    } else {
      toast.success("Perfil salvo!");
    }
    setSaving(false);
  };

  const extractFileText = async (file: File): Promise<string> => {
    const name = file.name.toLowerCase();
    const isMd = name.endsWith(".md") || name.endsWith(".txt") || file.type.startsWith("text/");
    const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
    const isDocx = name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isMd && !isPdf && !isDocx) {
      throw new Error("Formato não suportado. Use .md, .txt, .pdf ou .docx");
    }

    if (isMd) {
      return (await file.text()).trim();
    }
    if (isDocx) {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim();
    }
    // PDF
    const pdfjs: any = await import("pdfjs-dist");
    // @ts-ignore - worker URL
    const workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const parts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      parts.push(content.items.map((it: any) => it.str).join(" "));
    }
    return parts.join("\n\n").trim();
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 10MB)"); return; }

    setExtractingFile(true);
    try {
      const text = await extractFileText(file);
      if (!text || text.length < 10) { toast.error("Não foi possível extrair texto do arquivo"); return; }
      setRawText((prev) => (prev.trim() ? `${prev.trim()}\n\n--- ${file.name} ---\n${text}` : text));
      setUploadedFileName(file.name);
      toast.success(`Texto extraído de "${file.name}". Clique em "Preencher perfil com IA".`);
    } catch (err: any) {
      console.error("Doc extract error:", err);
      toast.error(err?.message || "Erro ao ler arquivo. Tente outro.");
    } finally {
      setExtractingFile(false);
      if (docFileInputRef.current) docFileInputRef.current.value = "";
    }
  };

  const handleKbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setKbExtracting(true);
    try {
      const chunks: string[] = [];
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`"${file.name}" muito grande (máx 10MB)`);
          continue;
        }
        try {
          const text = await extractFileText(file);
          if (text && text.length >= 10) {
            chunks.push(`--- ${file.name} ---\n${text}`);
          }
        } catch (err: any) {
          toast.error(`Erro em "${file.name}": ${err?.message || "formato não suportado"}`);
        }
      }
      if (chunks.length === 0) {
        toast.error("Nenhum arquivo pôde ser processado");
        return;
      }
      const block = chunks.join("\n\n");
      setProfile((prev) => ({
        ...prev,
        knowledge_base: prev.knowledge_base.trim() ? `${prev.knowledge_base.trim()}\n\n${block}` : block,
      }));
      toast.success(`${chunks.length} arquivo(s) adicionado(s) à base. Clique em Salvar.`);
    } finally {
      setKbExtracting(false);
      if (kbFileInputRef.current) kbFileInputRef.current.value = "";
    }
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

      const updated = {
        ...profile,
        display_name: data.display_name || profile.display_name,
        handle: data.handle || profile.handle,
        branding_text: data.branding_text || profile.branding_text,
        branding_subtext: data.branding_subtext || profile.branding_subtext,
        niche: data.niche || profile.niche,
        target_audience: data.target_audience || profile.target_audience,
        common_enemy: data.common_enemy || profile.common_enemy,
        beliefs: data.beliefs || profile.beliefs,
        tone_of_voice: data.tone_of_voice || profile.tone_of_voice,
        value_proposition: data.value_proposition || profile.value_proposition,
        positioning_thesis: data.positioning_thesis || profile.positioning_thesis,
        manifesto: data.manifesto || profile.manifesto,
        hooks: data.hooks || profile.hooks,
      };
      setProfile(updated);

      // Auto-save after AI fill
      const { error: saveError } = await supabase
        .from("profiles")
        .upsert({ ...updated, user_id: user!.id }, { onConflict: "user_id" });

      if (saveError) {
        console.error("Auto-save error:", saveError);
        toast.success("Perfil preenchido pela IA! Revise e clique em Salvar.");
      } else {
        toast.success("Perfil preenchido e salvo automaticamente! ✨");
        setRawText("");
      }
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

            {/* Guia: usar ChatGPT/Claude para montar o texto */}
            <div className="rounded-lg border border-primary/30 bg-background/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowGuide((v) => !v)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-primary/5 transition-colors"
              >
                <span className="flex items-center gap-2 text-xs font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Não sabe o que escrever? Deixa o ChatGPT/Claude montar pra você
                </span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showGuide ? "rotate-180" : ""}`} />
              </button>

              {showGuide && (
                <div className="px-3 pb-3 space-y-3 border-t border-primary/20">
                  <ol className="text-[11px] text-muted-foreground space-y-1.5 mt-3 list-decimal list-inside">
                    <li>Copie o prompt abaixo no botão.</li>
                    <li>Abra o <strong className="text-foreground">ChatGPT</strong> ou <strong className="text-foreground">Claude</strong> e cole numa conversa nova.</li>
                    <li>Responda as perguntas que a IA te fizer (vai ser uma conversa guiada).</li>
                    <li>No fim, ela vai gerar um texto completo. Copie esse texto.</li>
                    <li>Volte aqui, cole no campo abaixo e clique em <strong className="text-foreground">Preencher perfil com IA</strong>.</li>
                  </ol>

                  <div className="relative">
                    <pre className="text-[10px] leading-relaxed bg-secondary/60 border border-border/50 rounded-md p-3 pr-10 max-h-48 overflow-auto whitespace-pre-wrap font-mono text-muted-foreground">
{AI_PROMPT_TEMPLATE}
                    </pre>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={handleCopyPrompt}
                      className="absolute top-2 right-2 h-7 gap-1 text-[10px]"
                    >
                      {promptCopied ? (
                        <>
                          <Check className="w-3 h-3" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          Copiar prompt
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>



            {/* Upload doc button */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => docFileInputRef.current?.click()}
                disabled={extractingFile || parsing}
                className="gap-1.5 text-xs"
              >
                {extractingFile ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Enviar arquivo (.pdf, .docx, .md, .txt)
              </Button>
              {uploadedFileName && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                  <FileText className="w-3 h-3" />
                  {uploadedFileName}
                  <button
                    type="button"
                    onClick={() => { setUploadedFileName(null); setRawText(""); }}
                    className="hover:text-destructive ml-0.5"
                    aria-label="Remover"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <input
                ref={docFileInputRef}
                type="file"
                accept=".pdf,.docx,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
                onChange={handleDocUpload}
                className="hidden"
              />
            </div>

            <Textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={"Cole aqui qualquer texto sobre seu negócio — ou envie um arquivo acima.\n\nEx: Eu sou Marcus Forti, mentor de aceleração empresarial. Meu público são empreendedores que estão cansados de trabalhar sem resultado..."}
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
            <FieldArea label="Tese de posicionamento" value={profile.positioning_thesis} onChange={(v) => updateField("positioning_thesis", v)} placeholder="A ideia central, contraintuitiva, que define como você vê o mercado" />
            <FieldArea label="Manifesto" value={profile.manifesto} onChange={(v) => updateField("manifesto", v)} placeholder="No que você acredita, contra o que se posiciona, o que defende" />
            <FieldArea label="Ganchos prontos" value={profile.hooks} onChange={(v) => updateField("hooks", v)} placeholder="Um gancho por linha — para abrir carrosséis" />
          </div>
        </section>

        {/* Knowledge Base */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <FileText className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold font-display">Base de Conhecimento</h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">Opcional</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Cole textos, scripts, transcrições, ou envie arquivos (.md, .pdf, .docx, .txt) com conteúdo que a IA pode <strong>cruzar e usar</strong> ao gerar seus carrosséis.
            Quanto mais contexto, mais personalizado o resultado.
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => kbFileInputRef.current?.click()}
              disabled={kbExtracting}
              className="gap-1.5 text-xs"
            >
              {kbExtracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Adicionar arquivos (.md, .pdf, .docx)
            </Button>
            {profile.knowledge_base && (
              <span className="text-[10px] text-muted-foreground">
                {profile.knowledge_base.length.toLocaleString()} caracteres na base
              </span>
            )}
            <input
              ref={kbFileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.md,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
              onChange={handleKbUpload}
              className="hidden"
            />
          </div>

          <Textarea
            value={profile.knowledge_base}
            onChange={(e) => updateField("knowledge_base", e.target.value)}
            placeholder="Cole aqui qualquer texto, transcrição, artigo, script, ou envie arquivos acima. A IA usará isso como contexto ao gerar carrosséis..."
            rows={10}
            className="bg-secondary border-border/50 resize-y text-sm font-mono"
          />
          <p className="text-[11px] text-muted-foreground">
            💡 Dica: adicione transcrições de aulas, posts antigos que funcionaram, frases que você usa muito, livros que te inspiram.
          </p>
        </section>

        {/* Trocar senha */}
        <ChangePasswordSection />
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
