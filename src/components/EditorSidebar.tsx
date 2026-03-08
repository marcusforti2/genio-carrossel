import { useState, useEffect } from "react";
import { SlideData, CarouselData, ACCENT_PRESETS, DESIGN_TEMPLATES, FONT_FAMILIES, TITLE_SIZES, BODY_SIZES, DesignStyle, SlideStyleOverride, SlideBgStyle } from "@/types/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, User, ImagePlus, Loader2, Sun, Moon, Search, X, Upload, Type, LayoutTemplate, ALargeSmall, Palette, Image as ImageIcon, Paintbrush, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SlideEditorPanelProps {
  slide: SlideData;
  onUpdate: (updated: SlideData) => void;
  onDelete: () => void;
  canDelete: boolean;
  carousel: CarouselData;
}

const SlideEditorPanel = ({ slide, onUpdate, onDelete, canDelete, carousel }: SlideEditorPanelProps) => {
  const [imgLoading, setImgLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{ id: number; url: string; thumbnail: string; photographer: string; alt: string }>>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [videoSearchQuery, setVideoSearchQuery] = useState("");
  const [videoResults, setVideoResults] = useState<Array<{ id: number; url: string; thumbnail: string; duration: number; user: string }>>([]);
  const [searchingVideo, setSearchingVideo] = useState(false);
  const [showVideoSearch, setShowVideoSearch] = useState(false);
  const [previewVideo, setPreviewVideo] = useState<{ url: string; thumbnail: string; user: string } | null>(null);

  const generateImage = async () => {
    setImgLoading(true);
    onUpdate({ ...slide, imageLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke("generate-slide-image", {
        body: {
          slideTitle: slide.title,
          slideBody: slide.body,
          slideType: slide.type,
          topic: carousel.brandingText || carousel.profileName,
          bgMode: carousel.theme.bgMode,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.imageUrl) {
        onUpdate({ ...slide, imageUrl: data.imageUrl, hasImage: true, imageLoading: false });
        toast.success("Imagem gerada!");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao gerar imagem");
      onUpdate({ ...slide, imageLoading: false });
    } finally {
      setImgLoading(false);
    }
  };

  const searchPexels = async (query?: string) => {
    const q = query || searchQuery || slide.title;
    if (!q.trim()) return;
    setSearching(true);
    setShowSearch(true);
    // Build richer context for first automatic search
    const contextParts = [slide.title, slide.body].filter(Boolean).join(" — ");
    try {
      const { data, error } = await supabase.functions.invoke("search-pexels", {
        body: {
          query: query || searchQuery || contextParts,
          perPage: 6,
          topic: [carousel.brandingText, carousel.profileName, carousel.niche].filter(Boolean).join(", "),
          bgMode: carousel.theme?.bgMode || "dark",
          niche: carousel.niche || "",
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setSearchResults(data?.photos || []);
      if (!data?.photos?.length) toast.info("Nenhuma imagem encontrada");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao buscar imagens");
    } finally {
      setSearching(false);
    }
  };

  const selectPhoto = (photo: { url: string; photographer: string }) => {
    onUpdate({ ...slide, imageUrl: photo.url, hasImage: true, mediaType: "image", videoUrl: undefined });
    setShowSearch(false);
    setSearchResults([]);
    toast.success(`Foto de ${photo.photographer} aplicada!`);
  };

  const searchPexelsVideos = async (query?: string) => {
    const q = query || videoSearchQuery || slide.title;
    if (!q.trim()) return;
    setSearchingVideo(true);
    setShowVideoSearch(true);
    const contextParts = [slide.title, slide.body].filter(Boolean).join(" — ");
    try {
      const { data, error } = await supabase.functions.invoke("search-pexels-videos", {
        body: {
          query: query || videoSearchQuery || contextParts,
          perPage: 6,
          topic: [carousel.brandingText, carousel.profileName, carousel.niche].filter(Boolean).join(", "),
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setVideoResults(data?.videos || []);
      if (!data?.videos?.length) toast.info("Nenhum vídeo encontrado");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao buscar vídeos");
    } finally {
      setSearchingVideo(false);
    }
  };

  const selectVideo = (video: { url: string; thumbnail: string; user: string }) => {
    setPreviewVideo(video);
  };

  const confirmVideo = () => {
    if (!previewVideo) return;
    onUpdate({ ...slide, videoUrl: previewVideo.url, videoThumbnail: previewVideo.thumbnail, hasImage: true, mediaType: "video", imageUrl: previewVideo.thumbnail });
    setPreviewVideo(null);
    setShowVideoSearch(false);
    setVideoResults([]);
    toast.success(`Vídeo de ${previewVideo.user} aplicado!`);
  };

  const cancelVideoPreview = () => {
    setPreviewVideo(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {slide.type === "cover" ? "Capa" : slide.type === "cta" ? "CTA" : "Conteúdo"}
          </span>
        </div>
        {canDelete && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-muted-foreground hover:text-destructive h-7 px-2">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Título</Label>
        <Input
          value={slide.title}
          onChange={(e) => onUpdate({ ...slide, title: e.target.value })}
          placeholder="Título impactante..."
          className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {slide.type === "content" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Corpo do texto</Label>
          <Textarea
            value={slide.body}
            onChange={(e) => onUpdate({ ...slide, body: e.target.value })}
            placeholder="Desenvolva o argumento..."
            rows={4}
            className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground/50 resize-none"
          />
        </div>
      )}

      {slide.type === "cta" && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Corpo do texto</Label>
          <Textarea
            value={slide.body}
            onChange={(e) => onUpdate({ ...slide, body: e.target.value })}
            placeholder="Call to action..."
            rows={3}
            className="bg-secondary border-border/50 text-foreground placeholder:text-muted-foreground/50 resize-none"
          />
        </div>
      )}

      {/* ── Fundo & Mídia ── */}
      <div className="space-y-3 rounded-lg border border-border bg-card/50 p-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Fundo & Mídia</span>
        </div>

        {/* Background style tabs */}
        <div className="flex gap-1">
          {([
            { id: "theme" as const, label: "Tema" },
            { id: "color" as const, label: "Cor sólida" },
            { id: "fullimage" as const, label: "Imagem cheia" },
          ] as { id: SlideBgStyle; label: string }[]).map((opt) => (
            <button
              key={opt.id}
              onClick={() => onUpdate({ ...slide, styleOverride: { ...slide.styleOverride, bgStyle: opt.id } })}
              className={`flex-1 py-1.5 rounded-md border transition-all text-[10px] font-semibold ${
                (slide.styleOverride?.bgStyle || "theme") === opt.id
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/30"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Color presets */}
        {slide.styleOverride?.bgStyle === "color" && (
          <div className="grid grid-cols-5 gap-1.5">
            {[
              { name: "Preto", color: "0 0% 8%" },
              { name: "Marinho", color: "220 30% 12%" },
              { name: "Cinza", color: "0 0% 20%" },
              { name: "Creme", color: "40 30% 90%" },
              { name: "Branco", color: "0 0% 98%" },
              ...ACCENT_PRESETS.slice(0, 5),
            ].map((c) => (
              <button
                key={c.name}
                onClick={() => onUpdate({ ...slide, styleOverride: { ...slide.styleOverride, bgStyle: "color", bgColor: c.color } })}
                className={`flex flex-col items-center gap-1 py-1.5 rounded-md border transition-all ${
                  slide.styleOverride?.bgColor === c.color
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="w-5 h-5 rounded-full border border-border/50" style={{ background: `hsl(${c.color})` }} />
                <span className="text-[8px] text-muted-foreground">{c.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Fullimage hint */}
        {slide.styleOverride?.bgStyle === "fullimage" && !slide.imageUrl && !slide.videoUrl && (
          <p className="text-[9px] text-muted-foreground/70">
            Adicione uma imagem ou vídeo abaixo para usar como fundo em tela cheia.
          </p>
        )}

        {/* Separator */}
        <div className="border-t border-border/50" />

        {/* Media preview (if exists) */}
        {(slide.imageUrl || slide.videoUrl) && (
          <div className="rounded-md overflow-hidden border border-border">
            {slide.mediaType === "video" && slide.videoUrl ? (
              <div className="relative">
                <video src={slide.videoUrl} autoPlay loop muted playsInline className="w-full object-cover" style={{ aspectRatio: "16/10" }} />
                <div className="absolute top-1 right-1 bg-black/70 rounded px-1.5 py-0.5 flex items-center gap-1">
                  <Video className="w-3 h-3 text-white" />
                  <span className="text-[9px] text-white font-medium">Vídeo</span>
                </div>
              </div>
            ) : (
              <img src={slide.imageUrl} alt="Slide" className="w-full object-cover" style={{ aspectRatio: "16/10" }} />
            )}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-[10px] text-muted-foreground"
              onClick={() => onUpdate({ ...slide, imageUrl: undefined, hasImage: false, videoUrl: undefined, videoThumbnail: undefined, mediaType: undefined })}
            >
              Remover {slide.mediaType === "video" ? "vídeo" : "imagem"}
            </Button>
          </div>
        )}

        {/* Media actions - compact grid */}
        <div className="grid grid-cols-2 gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[10px] h-8"
            disabled={searching}
            onClick={() => searchPexels(slide.title)}
          >
            {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            Buscar Foto
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[10px] h-8"
            disabled={searchingVideo}
            onClick={() => searchPexelsVideos(slide.title)}
          >
            {searchingVideo ? <Loader2 className="w-3 h-3 animate-spin" /> : <Video className="w-3 h-3" />}
            Buscar Vídeo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[10px] h-8"
            onClick={() => document.getElementById(`upload-${slide.id}`)?.click()}
          >
            <Upload className="w-3 h-3" />
            Upload
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-[10px] h-8"
            disabled={imgLoading}
            onClick={generateImage}
          >
            {imgLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
            Gerar com IA
          </Button>
        </div>

        <input
          type="file"
          accept="image/*"
          id={`upload-${slide.id}`}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) { toast.error("Imagem muito grande (máx 5MB)"); return; }
            const reader = new FileReader();
            reader.onload = () => {
              onUpdate({ ...slide, imageUrl: reader.result as string, hasImage: true });
              toast.success("Imagem carregada!");
            };
            reader.readAsDataURL(file);
            e.target.value = "";
          }}
        />

        {/* Pexels photo search results */}
        {showSearch && (
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por tema..."
                className="bg-secondary border-border/50 text-xs h-7"
                onKeyDown={(e) => e.key === "Enter" && searchPexels()}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => { setShowSearch(false); setSearchResults([]); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            {searchResults.length > 0 && (
              <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto">
                {searchResults.map((photo) => (
                  <button key={photo.id} onClick={() => selectPhoto(photo)} className="rounded overflow-hidden border border-border hover:border-primary transition-colors relative group">
                    <img src={photo.thumbnail} alt={photo.alt} className="w-full h-12 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[7px] text-white font-medium">Usar</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[7px] text-muted-foreground/60 text-center">Fotos por Pexels</p>
          </div>
        )}

        {/* Pexels video search results */}
        {showVideoSearch && (
          <div className="space-y-1.5">
            {/* Video preview */}
            {previewVideo && (
              <div className="rounded-md overflow-hidden border border-primary">
                <video src={previewVideo.url} autoPlay loop muted playsInline className="w-full object-cover" style={{ aspectRatio: "16/10" }} />
                <div className="flex gap-1 p-1.5">
                  <Button size="sm" className="flex-1 text-[10px] h-7" onClick={confirmVideo}>
                    Aplicar vídeo
                  </Button>
                  <Button variant="ghost" size="sm" className="text-[10px] h-7" onClick={cancelVideoPreview}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
            <div className="flex gap-1.5">
              <Input
                value={videoSearchQuery}
                onChange={(e) => setVideoSearchQuery(e.target.value)}
                placeholder="Buscar vídeo..."
                className="bg-secondary border-border/50 text-xs h-7"
                onKeyDown={(e) => e.key === "Enter" && searchPexelsVideos()}
              />
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={() => { setShowVideoSearch(false); setVideoResults([]); setPreviewVideo(null); }}>
                <X className="w-3 h-3" />
              </Button>
            </div>
            {videoResults.length > 0 && (
              <div className="grid grid-cols-3 gap-1 max-h-36 overflow-y-auto">
                {videoResults.map((video) => (
                  <button key={video.id} onClick={() => selectVideo(video)} className={`rounded overflow-hidden border transition-colors relative group ${previewVideo?.url === video.url ? 'border-primary ring-1 ring-primary' : 'border-border hover:border-primary'}`}>
                    <img src={video.thumbnail} alt="" className="w-full h-12 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Video className="w-3 h-3 text-white" />
                    </div>
                    <div className="absolute top-0.5 right-0.5 bg-black/70 rounded px-1">
                      <span className="text-[7px] text-white">{video.duration}s</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[7px] text-muted-foreground/60 text-center">Vídeos por Pexels</p>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Per-slide design overrides panel ── */
const SlideDesignOverrides = ({ slide, onUpdate, carousel }: { slide: SlideData; onUpdate: (s: SlideData) => void; carousel: CarouselData }) => {
  const so = slide.styleOverride || {};
  const globalDs = carousel.designStyle || { template: "bold" as const, fontFamily: "sans" as const, titleSize: "grande" as const };
  const globalTheme = carousel.theme || { bgMode: "dark" as const, accentColor: "1 83% 55%", accentName: "Vermelho" };

  const effectiveTemplate = so.template ?? globalDs.template;
  const effectiveFont = so.fontFamily ?? globalDs.fontFamily;
  const effectiveSize = so.titleSize ?? globalDs.titleSize;
  const effectiveBg = so.bgMode ?? globalTheme.bgMode;
  const effectiveAccent = so.accentColor ?? globalTheme.accentColor;

  const updateOverride = (partial: Partial<SlideStyleOverride>) => {
    onUpdate({ ...slide, styleOverride: { ...so, ...partial } });
  };

  const clearOverrides = () => {
    const { styleOverride, ...rest } = slide;
    onUpdate(rest as SlideData);
  };

  const hasOverrides = Object.keys(so).length > 0;

  return (
    <div className="space-y-4 pt-4 border-t border-border/50">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
          <LayoutTemplate className="w-3.5 h-3.5" /> Design deste slide
        </Label>
        {hasOverrides && (
          <Button variant="ghost" size="sm" className="text-[10px] h-6 px-2 text-muted-foreground" onClick={clearOverrides}>
            Resetar
          </Button>
        )}
      </div>

      {/* BG mode */}
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground/70">Fundo</Label>
        <div className="flex gap-1.5">
          <button
            onClick={() => updateOverride({ bgMode: "dark" })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border transition-all text-[10px] font-semibold ${
              effectiveBg === "dark" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
            } ${so.bgMode === "dark" ? "ring-1 ring-primary/50" : ""}`}
          >
            <Moon className="w-3 h-3" /> Escuro
          </button>
          <button
            onClick={() => updateOverride({ bgMode: "light" })}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border transition-all text-[10px] font-semibold ${
              effectiveBg === "light" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary text-muted-foreground"
            } ${so.bgMode === "light" ? "ring-1 ring-primary/50" : ""}`}
          >
            <Sun className="w-3 h-3" /> Claro
          </button>
        </div>
      </div>

      {/* Accent color */}
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground/70">Cor destaque</Label>
        <div className="grid grid-cols-4 gap-1.5">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => updateOverride({ accentColor: preset.color, accentName: preset.name })}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-md border transition-all ${
                effectiveAccent === preset.color ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
              } ${so.accentColor === preset.color ? "ring-1 ring-primary/50" : ""}`}
            >
              <div className="w-5 h-5 rounded-full border border-border/50" style={{ background: `hsl(${preset.color})` }} />
              <span className="text-[8px] text-muted-foreground">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

interface EditorSidebarProps {
  carousel: CarouselData;
  selectedSlideIndex: number;
  onSelectSlide: (index: number) => void;
  onUpdateSlide: (index: number, slide: SlideData) => void;
  onDeleteSlide: (index: number) => void;
  onAddSlide: () => void;
  onUpdateCarousel: (carousel: CarouselData) => void;
  initialTab?: "slide" | "design" | "profile" | "footer";
}

const EditorSidebar = ({
  carousel,
  selectedSlideIndex,
  onSelectSlide,
  onUpdateSlide,
  onDeleteSlide,
  onAddSlide,
  onUpdateCarousel,
  initialTab,
}: EditorSidebarProps) => {
  const [tab, setTab] = useState<"slide" | "design" | "profile" | "footer">(initialTab || "slide");
  const selectedSlide = carousel.slides[selectedSlideIndex];

  // Sync tab when initialTab changes (mobile tab bar)
  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const updateTheme = (partial: Partial<CarouselData["theme"]>) => {
    onUpdateCarousel({ ...carousel, theme: { ...carousel.theme, ...partial } });
  };

  const updateDesignStyle = (partial: Partial<DesignStyle>) => {
    const current = carousel.designStyle || { template: "bold" as const, fontFamily: "sans" as const, titleSize: "grande" as const, bodySize: "grande" as const };
    onUpdateCarousel({ ...carousel, designStyle: { ...current, ...partial } });
  };

  const ds = carousel.designStyle || { template: "bold", fontFamily: "sans", titleSize: "grande", bodySize: "grande" };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {(["slide", "design", "profile", "footer"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-[10px] sm:text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap px-2 ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "slide" ? "Slide" : t === "design" ? "Design" : t === "profile" ? "Perfil" : "Rodapé"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "slide" && selectedSlide && (
          <div>
            <SlideEditorPanel
              key={selectedSlide.id}
              slide={selectedSlide}
              onUpdate={(s) => onUpdateSlide(selectedSlideIndex, s)}
              onDelete={() => onDeleteSlide(selectedSlideIndex)}
              canDelete={carousel.slides.length > 1}
              carousel={carousel}
            />
            <SlideDesignOverrides
              slide={selectedSlide}
              onUpdate={(s) => onUpdateSlide(selectedSlideIndex, s)}
              carousel={carousel}
            />
          </div>
        )}

        {tab === "design" && (
          <div className="space-y-6 animate-fade-in">
            {/* BG mode */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Fundo do slide</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateTheme({ bgMode: "dark" })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all text-xs font-semibold ${
                    carousel.theme.bgMode === "dark"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  <Moon className="w-4 h-4" /> Escuro
                </button>
                <button
                  onClick={() => updateTheme({ bgMode: "light" })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all text-xs font-semibold ${
                    carousel.theme.bgMode === "light"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  <Sun className="w-4 h-4" /> Claro
                </button>
              </div>
            </div>

            {/* Accent color */}
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Cor destaque</Label>
              <div className="grid grid-cols-4 gap-2">
                {ACCENT_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => updateTheme({ accentColor: preset.color, accentName: preset.name })}
                    className={`flex flex-col items-center gap-1.5 py-2 rounded-lg border-2 transition-all ${
                      carousel.theme.accentColor === preset.color
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full border border-border/50" style={{ background: `hsl(${preset.color})` }} />
                    <span className="text-[9px] text-muted-foreground">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "profile" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center">
                {carousel.avatarUrl ? (
                  <img src={carousel.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">Foto vem do seu perfil</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input value={carousel.profileName} onChange={(e) => onUpdateCarousel({ ...carousel, profileName: e.target.value })} className="bg-secondary border-border/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Handle</Label>
              <Input value={carousel.profileHandle} onChange={(e) => onUpdateCarousel({ ...carousel, profileHandle: e.target.value })} className="bg-secondary border-border/50" />
            </div>
          </div>
        )}

        {tab === "footer" && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-[10px] text-muted-foreground">
              Edite aqui e aplique em todos os slides automaticamente.
            </p>

            {/* Branding text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Texto do branding</Label>
                <Switch
                  checked={carousel.footer?.showBranding !== false}
                  onCheckedChange={(checked) => onUpdateCarousel({ ...carousel, footer: { ...carousel.footer, showBranding: checked } })}
                />
              </div>
              <Input
                value={carousel.brandingText}
                onChange={(e) => onUpdateCarousel({ ...carousel, brandingText: e.target.value })}
                placeholder="Ex: Governo de Negócios"
                className="bg-secondary border-border/50"
                disabled={carousel.footer?.showBranding === false}
              />
            </div>

            {/* Sub-branding */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sub-branding (topo)</Label>
              <Input
                value={carousel.brandingSubtext}
                onChange={(e) => onUpdateCarousel({ ...carousel, brandingSubtext: e.target.value })}
                placeholder="Ex: Aceleração Forti"
                className="bg-secondary border-border/50"
              />
            </div>

            {/* Handle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">@Handle</Label>
                <Switch
                  checked={carousel.footer?.showHandle !== false}
                  onCheckedChange={(checked) => onUpdateCarousel({ ...carousel, footer: { ...carousel.footer, showHandle: checked } })}
                />
              </div>
              <Input
                value={carousel.profileHandle}
                onChange={(e) => onUpdateCarousel({ ...carousel, profileHandle: e.target.value })}
                placeholder="@seuhandle"
                className="bg-secondary border-border/50"
                disabled={carousel.footer?.showHandle === false}
              />
            </div>

            {/* CTA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Texto CTA</Label>
                <Switch
                  checked={carousel.footer?.showCta !== false}
                  onCheckedChange={(checked) => onUpdateCarousel({ ...carousel, footer: { ...carousel.footer, showCta: checked } })}
                />
              </div>
              <Input
                value={carousel.footer?.ctaText || "Arrasta para o lado >"}
                onChange={(e) => onUpdateCarousel({ ...carousel, footer: { ...carousel.footer, ctaText: e.target.value } })}
                placeholder="Ex: Arrasta para o lado >"
                className="bg-secondary border-border/50"
                disabled={carousel.footer?.showCta === false}
              />
            </div>

            {/* Footer live preview */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Preview do rodapé</Label>
              <div
                className="rounded-lg p-3 flex items-center gap-2"
                style={{ background: carousel.theme.bgMode === "dark" ? "hsl(0 0% 6.5%)" : "hsl(0 0% 96%)" }}
              >
                {carousel.footer?.showBranding !== false && carousel.brandingText && (
                  <span
                    className="text-[8px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: `hsl(${carousel.theme.accentColor})`, color: "#fff" }}
                  >
                    {carousel.brandingText}
                  </span>
                )}
                {carousel.footer?.showHandle !== false && carousel.profileHandle && (
                  <span
                    className="text-[8px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      background: carousel.theme.bgMode === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                      color: carousel.theme.bgMode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
                      border: `1px solid ${carousel.theme.bgMode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
                    }}
                  >
                    {carousel.profileHandle}
                  </span>
                )}
                {carousel.footer?.showCta !== false && (
                  <span className="ml-auto text-[8px]" style={{ color: carousel.theme.bgMode === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                    {carousel.footer?.ctaText || "Arrasta para o lado >"}
                  </span>
                )}
                {!carousel.footer?.showBranding && !carousel.footer?.showHandle && !carousel.footer?.showCta && (
                  <span className="text-[8px] text-muted-foreground italic">Rodapé oculto</span>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-secondary/50 border border-border p-3">
              <p className="text-[10px] text-muted-foreground">
                ✓ Todas as alterações aqui são aplicadas em todos os slides simultaneamente.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Slide thumbnails */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {carousel.slides.map((slide, i) => {
            const hasOverride = slide.styleOverride && Object.keys(slide.styleOverride).length > 0;
            return (
              <button
                key={slide.id}
                onClick={() => { onSelectSlide(i); setTab("slide"); }}
                className={`relative flex-shrink-0 w-10 h-12 rounded-md border-2 transition-all text-[8px] font-bold flex items-center justify-center ${
                  i === selectedSlideIndex
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/50"
                }`}
              >
                {i + 1}
                {hasOverride && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-card" style={{ background: `hsl(${slide.styleOverride?.accentColor || carousel.theme.accentColor})` }} />
                )}
              </button>
            );
          })}
          <button
            onClick={onAddSlide}
            className="flex-shrink-0 w-10 h-12 rounded-md border-2 border-dashed border-border hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors flex items-center justify-center"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorSidebar;
