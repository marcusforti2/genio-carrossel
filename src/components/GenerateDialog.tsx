import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2, LayoutTemplate, Type, ALargeSmall, Sun, Moon, Palette, Upload, X, ImageIcon } from "lucide-react";
import RealisticSlidePreview from "@/components/RealisticSlidePreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  SlideData, DesignStyle, CarouselTheme,
  DESIGN_TEMPLATES, FONT_FAMILIES, TITLE_SIZES, ACCENT_PRESETS,
  DesignTemplate, FontFamily, TitleSize,
} from "@/types/carousel";
import { toast } from "sonner";

interface GenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (slides: SlideData[], caption: string, designStyle: DesignStyle, theme?: CarouselTheme) => void;
  currentDesignStyle?: DesignStyle;
  currentTheme?: CarouselTheme;
}

const MAX_IMG_SIZE = 5 * 1024 * 1024; // 5MB

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const fetchPexelsImage = async (query: string, topic: string, imageQuery?: string): Promise<string | undefined> => {
  try {
    const { data, error } = await supabase.functions.invoke("search-pexels", {
      body: { query, perPage: 3, topic, imageQuery },
    });
    if (error || data?.error || !data?.photos?.length) return undefined;
    const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
    return photo.url;
  } catch {
    return undefined;
  }
};

const GenerateDialog = ({ open, onOpenChange, onGenerated, currentDesignStyle, currentTheme }: GenerateDialogProps) => {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("tribunal");
  const [slideCount, setSlideCount] = useState([6]);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  // Design style state
  const [template, setTemplate] = useState<DesignTemplate>(currentDesignStyle?.template || "editorial");
  const [fontFamily, setFontFamily] = useState<FontFamily>(currentDesignStyle?.fontFamily || "serif");
  const [titleSize, setTitleSize] = useState<TitleSize>(currentDesignStyle?.titleSize || "grande");

  // Theme state
  const [bgMode, setBgMode] = useState<"dark" | "light">(currentTheme?.bgMode || "dark");
  const [accentColor, setAccentColor] = useState(currentTheme?.accentColor || "1 83% 55%");
  const [accentName, setAccentName] = useState(currentTheme?.accentName || "Vermelho");

  // Uploaded images
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data for realistic preview
  const [profileData, setProfileData] = useState<{ name: string; handle: string; avatar: string }>({ name: "", handle: "", avatar: "" });
  const [sampleImage, setSampleImage] = useState<string | undefined>();

  useEffect(() => {
    if (!user || !open) return;
    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, handle, avatar_url")
        .eq("user_id", user.id)
        .single();
      if (profile) {
        setProfileData({
          name: profile.display_name || "",
          handle: profile.handle || "",
          avatar: profile.avatar_url || "",
        });
      }
      // Fetch a sample image
      try {
        const { data } = await supabase.functions.invoke("search-pexels", {
          body: { query: "business professional", perPage: 5 },
        });
        if (data?.photos?.length) {
          const photo = data.photos[Math.floor(Math.random() * data.photos.length)];
          setSampleImage(photo.url);
        }
      } catch {}
    })();
  }, [user, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_IMG_SIZE) {
        toast.error(`${file.name} excede 5MB`);
        continue;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} não é uma imagem`);
        continue;
      }
      try {
        const base64 = await fileToBase64(file);
        newImages.push(base64);
      } catch {
        toast.error(`Erro ao ler ${file.name}`);
      }
    }

    setUploadedImages((prev) => [...prev, ...newImages]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Digite um tema para o carrossel");
      return;
    }
    if (!user) return;

    setLoading(true);
    setLoadingStatus("Gerando conteúdo com IA...");

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data, error } = await supabase.functions.invoke("generate-carousel", {
        body: {
          profile: profile || {},
          topic: topic.trim(),
          slideCount: slideCount[0],
          style,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      const slides: SlideData[] = data.slides.map((s: any) => ({
        id: crypto.randomUUID(),
        type: s.type === "cover" ? "cover" : s.type === "cta" ? "cta" : "content",
        title: s.title || "",
        body: s.body || "",
        hasImage: s.type !== "cta",
        _imageQuery: s.type !== "cta" ? (s.imageQuery || undefined) : undefined,
      }));

      // Assign uploaded images first, then fetch remaining from Pexels
      setLoadingStatus("Aplicando imagens...");

      let uploadIdx = 0;
      const imagePromises = slides.map((slide: any) => {
        if (slide.type === "cta") return Promise.resolve(undefined);
        // Use uploaded image if available
        if (uploadIdx < uploadedImages.length) {
          const img = uploadedImages[uploadIdx];
          uploadIdx++;
          return Promise.resolve(img);
        }
        // Otherwise fetch from Pexels
        return fetchPexelsImage(slide.title, topic.trim(), slide._imageQuery);
      });

      setLoadingStatus("Buscando imagens restantes...");
      const images = await Promise.all(imagePromises);

      const slidesWithImages: SlideData[] = slides.map((slide: any, i: number) => {
        const { _imageQuery, ...clean } = slide;
        return { ...clean, imageUrl: images[i] || undefined };
      });

      const designStyle: DesignStyle = { template, fontFamily, titleSize };
      const theme: CarouselTheme = { bgMode, accentColor, accentName };
      onGenerated(slidesWithImages, data.caption || "", designStyle, theme);
      toast.success("Carrossel gerado com imagens!");
      onOpenChange(false);
      setTopic("");
      setUploadedImages([]);
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao gerar carrossel. Tente novamente.");
    } finally {
      setLoading(false);
      setLoadingStatus("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-4xl max-w-[95vw] max-h-[90vh] overflow-y-auto p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Left: Live preview */}
          <div className="hidden sm:flex sm:w-[300px] shrink-0 bg-secondary/30 border-r border-border p-4 flex-col items-center justify-center gap-3">
            <div className="w-full">
              <RealisticSlidePreview
                template={template} fontFamily={fontFamily} titleSize={titleSize}
                bgMode={bgMode} accentColor={accentColor}
                profileName={profileData.name} profileHandle={profileData.handle}
                avatarUrl={profileData.avatar} sampleImageUrl={uploadedImages[0] || sampleImage}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Preview em tempo real do estilo selecionado
            </p>
          </div>

          {/* Right: Form */}
          <div className="flex-1 p-5 sm:p-6 space-y-5">
            <DialogHeader className="p-0">
              <DialogTitle className="font-display flex items-center gap-2 text-sm sm:text-base">
                <Sparkles className="w-5 h-5 text-primary" />
                Criar novo carrossel
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-1">
                Configure o conteúdo e design, a IA faz o resto.
              </p>
            </DialogHeader>

            {/* Mobile preview */}
            <div className="sm:hidden flex justify-center">
              <div className="w-48">
                <RealisticSlidePreview
                  template={template} fontFamily={fontFamily} titleSize={titleSize}
                  bgMode={bgMode} accentColor={accentColor}
                  profileName={profileData.name} profileHandle={profileData.handle}
                  avatarUrl={profileData.avatar} sampleImageUrl={uploadedImages[0] || sampleImage}
                />
              </div>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tema / Ideia</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Como o LinkedIn cria profissionais culpados..."
                className="bg-secondary border-border/50"
              />
            </div>

            {/* Narrative style + Slide count row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Estilo de narrativa</Label>
                <Select value={style} onValueChange={setStyle}>
                  <SelectTrigger className="bg-secondary border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tribunal">⚖️ Tribunal</SelectItem>
                    <SelectItem value="opinião">🔥 Opinião</SelectItem>
                    <SelectItem value="informativo">📊 Informativo</SelectItem>
                    <SelectItem value="sacada">💡 Sacada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Slides</Label>
                  <span className="text-xs font-bold text-primary">{slideCount[0]}</span>
                </div>
                <Slider value={slideCount} onValueChange={setSlideCount} min={3} max={11} step={1} className="py-2" />
              </div>
            </div>

            {/* Theme section: Mode + Accent */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-primary" />
                Aparência
              </p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                {/* Dark / Light mode */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">Modo</Label>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setBgMode("dark")}
                      className={`flex-1 py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 ${
                        bgMode === "dark"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-muted-foreground/30"
                      }`}
                    >
                      <Moon className="w-3.5 h-3.5" style={{ color: bgMode === "dark" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                      <span className={`text-[10px] font-semibold ${bgMode === "dark" ? "text-primary" : "text-muted-foreground"}`}>Escuro</span>
                    </button>
                    <button
                      onClick={() => setBgMode("light")}
                      className={`flex-1 py-2.5 rounded-lg border-2 transition-all flex items-center justify-center gap-1.5 ${
                        bgMode === "light"
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-muted-foreground/30"
                      }`}
                    >
                      <Sun className="w-3.5 h-3.5" style={{ color: bgMode === "light" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                      <span className={`text-[10px] font-semibold ${bgMode === "light" ? "text-primary" : "text-muted-foreground"}`}>Claro</span>
                    </button>
                  </div>
                </div>

                {/* Accent color */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground">Cor destaque</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {ACCENT_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => { setAccentColor(preset.color); setAccentName(preset.name); }}
                        title={preset.name}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          accentColor === preset.color ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                        }`}
                        style={{ background: `hsl(${preset.color})` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Design section */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                Design do Carrossel
              </p>

              {/* Template */}
              <div className="space-y-2 mb-4">
                <Label className="text-[11px] text-muted-foreground">Template</Label>
                <div className="grid grid-cols-3 gap-2">
                  {DESIGN_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTemplate(t.id)}
                      className={`p-2.5 rounded-lg border-2 transition-all text-left ${
                        template === t.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-secondary hover:border-muted-foreground/30"
                      }`}
                    >
                      <p className={`text-[11px] font-bold ${template === t.id ? "text-primary" : "text-foreground"}`}>
                        {t.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground mt-0.5 line-clamp-2">{t.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font + Size row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Font Family */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Type className="w-3 h-3" /> Fonte
                  </Label>
                  <div className="flex gap-1.5">
                    {FONT_FAMILIES.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFontFamily(f.id)}
                        className={`flex-1 py-2 rounded-lg border-2 transition-all text-center ${
                          fontFamily === f.id
                            ? "border-primary bg-primary/10"
                            : "border-border bg-secondary hover:border-muted-foreground/30"
                        }`}
                      >
                        <p
                          className="text-sm font-bold"
                          style={{
                            fontFamily: f.id === "serif" ? "'Playfair Display', serif" : "'Inter', sans-serif",
                            color: fontFamily === f.id ? "hsl(var(--primary))" : "hsl(var(--foreground))",
                          }}
                        >
                          Aa
                        </p>
                        <p className="text-[9px] text-muted-foreground">{f.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title Size */}
                <div className="space-y-2">
                  <Label className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <ALargeSmall className="w-3 h-3" /> Tamanho do título
                  </Label>
                  <div className="flex flex-col gap-1">
                    {TITLE_SIZES.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setTitleSize(s.id)}
                        className={`py-1.5 px-2 rounded-md border transition-all text-[10px] font-semibold text-left ${
                          titleSize === s.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/30"
                        }`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Image upload section */}
            <div className="border-t border-border pt-4">
              <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                Imagens (opcional)
              </p>
              <p className="text-[10px] text-muted-foreground mb-3">
                Suba suas próprias imagens. Serão usadas nos slides em ordem. Slides restantes usarão fotos do Pexels.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />

              {/* Uploaded thumbnails */}
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {uploadedImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={img}
                        alt={`Upload ${i + 1}`}
                        className="w-16 h-16 object-cover rounded-lg border border-border"
                      />
                      <span className="absolute top-0.5 left-0.5 bg-primary text-primary-foreground text-[8px] font-bold px-1 rounded">
                        {i + 1}
                      </span>
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs border-dashed"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-3.5 h-3.5" />
                {uploadedImages.length > 0
                  ? `Adicionar mais (${uploadedImages.length} selecionada${uploadedImages.length > 1 ? "s" : ""})`
                  : "Subir imagens do computador"}
              </Button>
            </div>

            {/* Generate button */}
            <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full gap-2 h-11">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {loadingStatus || "Gerando..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Gerar Carrossel
                </>
              )}
            </Button>

            <p className="text-[10px] text-muted-foreground/60 text-center">
              A IA gera o conteúdo e busca fotos reais automaticamente.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateDialog;
