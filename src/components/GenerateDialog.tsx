import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2, LayoutTemplate, Type, ALargeSmall, Sun, Moon, Palette, Upload, X, ImageIcon, Video } from "lucide-react";
import RealisticSlidePreview from "@/components/RealisticSlidePreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  SlideData, DesignStyle, CarouselTheme,
  DESIGN_TEMPLATES, FONT_FAMILIES, TITLE_SIZES, BODY_SIZES, ACCENT_PRESETS,
  DesignTemplate, FontFamily, TitleSize, BodySize,
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
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [style, setStyle] = useState("tribunal");
  const [slideCount, setSlideCount] = useState([6]);
  const [loading, setLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");

  // Design style state (hardcoded)
  const template: DesignTemplate = "bold";
  const fontFamily: FontFamily = "sans";
  const titleSize: TitleSize = "grande";
  const bodySize: BodySize = "grande";

  // Theme state
  const [bgMode, setBgMode] = useState<"dark" | "light">(currentTheme?.bgMode || "dark");
  const [accentColor, setAccentColor] = useState(currentTheme?.accentColor || "1 83% 55%");
  const [accentName, setAccentName] = useState(currentTheme?.accentName || "Vermelho");

  // Uploaded images
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile data for realistic preview
  const [profileData, setProfileData] = useState<{ name: string; handle: string; avatar: string; niche?: string }>({
    name: "",
    handle: "",
    avatar: "",
    niche: "",
  });
  const [sampleImages, setSampleImages] = useState<string[]>([]);

  useEffect(() => {
    if (!user || !open) return;

    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, handle, avatar_url, niche")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setProfileData({
          name: profile.display_name || "",
          handle: profile.handle || "",
          avatar: profile.avatar_url || "",
          niche: profile.niche || "",
        });
      }

      try {
        const query = (profile?.niche || "business professional workspace").slice(0, 80);
        const { data } = await supabase.functions.invoke("search-pexels", {
          body: { query, perPage: 6 },
        });

        const urls = (data?.photos || []).map((p: any) => p.url).filter(Boolean);
        setSampleImages(urls.slice(0, 3));
      } catch {
        setSampleImages([]);
      }
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
      setLoadingStatus(mediaType === "video" ? "Buscando vídeos..." : "Aplicando imagens...");

      if (mediaType === "video") {
        // Fetch videos from Pexels for each slide
        const videoPromises = slides.map(async (slide: any) => {
          if (slide.type === "cta") return undefined;
          try {
            const { data: vData, error: vError } = await supabase.functions.invoke("search-pexels-videos", {
              body: { query: slide._imageQuery || slide.title, perPage: 3, topic: topic.trim() },
            });
            if (vError || !vData?.videos?.length) return undefined;
            const video = vData.videos[Math.floor(Math.random() * vData.videos.length)];
            return video;
          } catch {
            return undefined;
          }
        });

        const videos = await Promise.all(videoPromises);
        const slidesWithMedia: SlideData[] = slides.map((slide: any, i: number) => {
          const { _imageQuery, ...clean } = slide;
          const video = videos[i];
          if (video) {
            return { ...clean, videoUrl: video.url, videoThumbnail: video.thumbnail, imageUrl: video.thumbnail };
          }
          return clean;
        });

        const designStyle: DesignStyle = { template, fontFamily, titleSize, bodySize };
        const theme: CarouselTheme = { bgMode, accentColor, accentName };
        onGenerated(slidesWithMedia, data.caption || "", designStyle, theme);
        toast.success("Carrossel gerado com vídeos!");
      } else {
        let uploadIdx = 0;
        const imagePromises = slides.map((slide: any) => {
          if (slide.type === "cta") return Promise.resolve(undefined);
          if (uploadIdx < uploadedImages.length) {
            const img = uploadedImages[uploadIdx];
            uploadIdx++;
            return Promise.resolve(img);
          }
          return fetchPexelsImage(slide.title, topic.trim(), slide._imageQuery);
        });

        setLoadingStatus("Buscando imagens restantes...");
        const images = await Promise.all(imagePromises);

        const slidesWithImages: SlideData[] = slides.map((slide: any, i: number) => {
          const { _imageQuery, ...clean } = slide;
          return { ...clean, imageUrl: images[i] || undefined };
        });

        const designStyle: DesignStyle = { template, fontFamily, titleSize, bodySize };
        const theme: CarouselTheme = { bgMode, accentColor, accentName };
        onGenerated(slidesWithImages, data.caption || "", designStyle, theme);
        toast.success("Carrossel gerado com imagens!");
      }
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
      <DialogContent className="bg-card border-border sm:max-w-4xl max-w-[95vw] max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Left: Live preview */}
          <div className="hidden sm:flex sm:w-[300px] shrink-0 bg-secondary/30 border-r border-border p-4 flex-col items-center justify-center gap-3">
            <div className="w-full">
              <RealisticSlidePreview
                bgMode={bgMode} accentColor={accentColor}
                profileName={profileData.name} profileHandle={profileData.handle}
                avatarUrl={profileData.avatar}
                sampleImageUrls={uploadedImages.length ? uploadedImages : sampleImages}
              />
            </div>
            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              Preview em tempo real do estilo selecionado
            </p>
          </div>

          {/* Right: Form */}
          <div className="flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">
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
                  bgMode={bgMode} accentColor={accentColor}
                  profileName={profileData.name} profileHandle={profileData.handle}
                  avatarUrl={profileData.avatar}
                  sampleImageUrls={uploadedImages.length ? uploadedImages : sampleImages}
                />
              </div>
            </div>

            {/* Media type selector */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Tipo de mídia</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setMediaType("image")}
                  className={`flex-1 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    mediaType === "image"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary hover:border-muted-foreground/30"
                  }`}
                >
                  <ImageIcon className="w-4 h-4" style={{ color: mediaType === "image" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                  <span className={`text-xs font-semibold ${mediaType === "image" ? "text-primary" : "text-muted-foreground"}`}>Imagens</span>
                </button>
                <button
                  onClick={() => setMediaType("video")}
                  className={`flex-1 py-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                    mediaType === "video"
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary hover:border-muted-foreground/30"
                  }`}
                >
                  <Video className="w-4 h-4" style={{ color: mediaType === "video" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }} />
                  <span className={`text-xs font-semibold ${mediaType === "video" ? "text-primary" : "text-muted-foreground"}`}>Vídeos</span>
                </button>
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


            {/* Image upload section - only for image mode */}
            {mediaType === "image" && <div className="border-t border-border pt-4">
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
            </div>}

            {/* Video info */}
            {mediaType === "video" && (
              <div className="border-t border-border pt-4">
                <p className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-primary" />
                  Vídeos automáticos
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Vídeos serão buscados automaticamente no Pexels com base no conteúdo de cada slide.
                </p>
              </div>
            )}

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
              A IA gera o conteúdo e busca {mediaType === "video" ? "vídeos" : "fotos"} reais automaticamente.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateDialog;
