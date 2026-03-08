import { useState } from "react";
import { SlideData, CarouselData, ACCENT_PRESETS, SlideBgStyle } from "@/types/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Trash2, GripVertical, ImagePlus, Loader2, Search, X, Upload, Image as ImageIcon, Video } from "lucide-react";
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
    const contextParts = [slide.title, slide.body].filter(Boolean).join(" — ");
    try {
      const { data, error } = await supabase.functions.invoke("search-pexels", {
        body: {
          query: query || searchQuery || contextParts,
          perPage: 6,
          topic: [carousel.brandingText, carousel.profileName].filter(Boolean).join(", "),
          bgMode: carousel.theme?.bgMode || "dark",
          niche: "",
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
          topic: [carousel.brandingText, carousel.profileName].filter(Boolean).join(", "),
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

export default SlideEditorPanel;
