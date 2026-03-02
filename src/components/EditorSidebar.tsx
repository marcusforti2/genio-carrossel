import { useState } from "react";
import { SlideData, CarouselData, ACCENT_PRESETS } from "@/types/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical, User, ImagePlus, Loader2, Sun, Moon, Search, X } from "lucide-react";
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
    try {
      const { data, error } = await supabase.functions.invoke("search-pexels", {
        body: { query: q, perPage: 6 },
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
    onUpdate({ ...slide, imageUrl: photo.url, hasImage: true });
    setShowSearch(false);
    setSearchResults([]);
    toast.success(`Foto de ${photo.photographer} aplicada!`);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {slide.type === "cover" ? "Capa" : "Conteúdo"}
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

      <div className="flex items-center justify-between py-1">
        <Label className="text-xs text-muted-foreground">Com imagem</Label>
        <Switch
          checked={slide.hasImage}
          onCheckedChange={(checked) => onUpdate({ ...slide, hasImage: checked })}
        />
      </div>

      {/* Pexels search */}
      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 text-xs"
          disabled={searching}
          onClick={() => searchPexels(slide.title)}
        >
          {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          {searching ? "Buscando..." : "Buscar foto real (Pexels)"}
        </Button>

        {showSearch && (
          <div className="space-y-2">
            <div className="flex gap-1.5">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por tema..."
                className="bg-secondary border-border/50 text-xs h-8"
                onKeyDown={(e) => e.key === "Enter" && searchPexels()}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => { setShowSearch(false); setSearchResults([]); }}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
                {searchResults.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => selectPhoto(photo)}
                    className="rounded-md overflow-hidden border border-border hover:border-primary transition-colors relative group"
                  >
                    <img src={photo.thumbnail} alt={photo.alt} className="w-full h-16 object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[8px] text-white font-medium">Usar</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-[8px] text-muted-foreground/60 text-center">Fotos por Pexels</p>
          </div>
        )}
      </div>

      {/* AI Image button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-xs"
        disabled={imgLoading}
        onClick={generateImage}
      >
        {imgLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
        {imgLoading ? "Gerando imagem..." : "Gerar imagem com IA"}
      </Button>

      {slide.imageUrl && (
        <div className="rounded-md overflow-hidden border border-border">
          <img src={slide.imageUrl} alt="Slide" className="w-full object-cover" style={{ aspectRatio: "16/10" }} />
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-[10px] text-muted-foreground"
            onClick={() => onUpdate({ ...slide, imageUrl: undefined })}
          >
            Remover imagem
          </Button>
        </div>
      )}
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
}

const EditorSidebar = ({
  carousel,
  selectedSlideIndex,
  onSelectSlide,
  onUpdateSlide,
  onDeleteSlide,
  onAddSlide,
  onUpdateCarousel,
}: EditorSidebarProps) => {
  const [tab, setTab] = useState<"slide" | "design" | "profile">("slide");
  const selectedSlide = carousel.slides[selectedSlideIndex];

  const updateTheme = (partial: Partial<CarouselData["theme"]>) => {
    onUpdateCarousel({ ...carousel, theme: { ...carousel.theme, ...partial } });
  };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Tabs */}
      <div className="flex border-b border-border">
        {(["slide", "design", "profile"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
              tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "slide" ? "Slide" : t === "design" ? "Design" : "Perfil"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "slide" && selectedSlide && (
          <SlideEditorPanel
            key={selectedSlide.id}
            slide={selectedSlide}
            onUpdate={(s) => onUpdateSlide(selectedSlideIndex, s)}
            onDelete={() => onDeleteSlide(selectedSlideIndex)}
            canDelete={carousel.slides.length > 1}
            carousel={carousel}
          />
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
                  <Moon className="w-4 h-4" />
                  Escuro
                </button>
                <button
                  onClick={() => updateTheme({ bgMode: "light" })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 transition-all text-xs font-semibold ${
                    carousel.theme.bgMode === "light"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/50"
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  Claro
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
                    <div
                      className="w-6 h-6 rounded-full border border-border/50"
                      style={{ background: `hsl(${preset.color})` }}
                    />
                    <span className="text-[9px] text-muted-foreground">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview swatch */}
            <div className="rounded-lg p-4 space-y-2" style={{ background: carousel.theme.bgMode === "dark" ? "hsl(0 0% 6.5%)" : "hsl(0 0% 96%)" }}>
              <p className="text-[10px] font-bold" style={{ color: carousel.theme.bgMode === "dark" ? "#fff" : "#111" }}>
                Preview do tema
              </p>
              <div className="flex items-center gap-2">
                <div className="w-8 h-2 rounded-full" style={{ background: `hsl(${carousel.theme.accentColor})` }} />
                <span className="text-[9px]" style={{ color: carousel.theme.bgMode === "dark" ? "#999" : "#666" }}>
                  {carousel.theme.accentName} • {carousel.theme.bgMode === "dark" ? "Escuro" : "Claro"}
                </span>
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
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Branding</Label>
              <Input value={carousel.brandingText} onChange={(e) => onUpdateCarousel({ ...carousel, brandingText: e.target.value })} className="bg-secondary border-border/50" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sub-branding</Label>
              <Input value={carousel.brandingSubtext} onChange={(e) => onUpdateCarousel({ ...carousel, brandingSubtext: e.target.value })} className="bg-secondary border-border/50" />
            </div>
          </div>
        )}
      </div>

      {/* Slide thumbnails */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {carousel.slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => { onSelectSlide(i); setTab("slide"); }}
              className={`flex-shrink-0 w-10 h-12 rounded-md border-2 transition-all text-[8px] font-bold flex items-center justify-center ${
                i === selectedSlideIndex
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-secondary text-muted-foreground hover:border-muted-foreground/50"
              }`}
            >
              {i + 1}
            </button>
          ))}
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
