import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2, LayoutTemplate, Type, ALargeSmall } from "lucide-react";
import MiniSlidePreview from "@/components/MiniSlidePreview";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SlideData, DesignStyle, DESIGN_TEMPLATES, FONT_FAMILIES, TITLE_SIZES, DesignTemplate, FontFamily, TitleSize } from "@/types/carousel";
import { toast } from "sonner";

interface GenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (slides: SlideData[], caption: string, designStyle: DesignStyle) => void;
  currentDesignStyle?: DesignStyle;
}

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

const GenerateDialog = ({ open, onOpenChange, onGenerated, currentDesignStyle }: GenerateDialogProps) => {
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

      setLoadingStatus("Buscando imagens reais...");
      const imagePromises = slides.map((slide: any) =>
        slide.type === "cta" ? Promise.resolve(undefined) : fetchPexelsImage(slide.title, topic.trim(), slide._imageQuery)
      );
      const images = await Promise.all(imagePromises);

      const slidesWithImages: SlideData[] = slides.map((slide: any, i: number) => {
        const { _imageQuery, ...clean } = slide;
        return { ...clean, imageUrl: images[i] || undefined };
      });

      const designStyle: DesignStyle = { template, fontFamily, titleSize };
      onGenerated(slidesWithImages, data.caption || "", designStyle);
      toast.success("Carrossel gerado com imagens!");
      onOpenChange(false);
      setTopic("");
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
      <DialogContent className="bg-card border-border sm:max-w-lg max-w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-sm sm:text-base">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerar Carrossel com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
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

          {/* Narrative style */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Estilo de narrativa</Label>
            <Select value={style} onValueChange={setStyle}>
              <SelectTrigger className="bg-secondary border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tribunal">⚖️ Tribunal — Julgar e provocar</SelectItem>
                <SelectItem value="opinião">🔥 Opinião — Polêmico e direto</SelectItem>
                <SelectItem value="informativo">📊 Informativo — Educar com personalidade</SelectItem>
                <SelectItem value="sacada">💡 Sacada — Insights rápidos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Slide count */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Número de slides</Label>
              <span className="text-xs font-bold text-primary">{slideCount[0]}</span>
            </div>
            <Slider value={slideCount} onValueChange={setSlideCount} min={3} max={11} step={1} className="py-2" />
          </div>

          {/* Design section divider */}
          <div className="border-t border-border pt-4">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground mb-1 flex items-center gap-1.5">
                  <LayoutTemplate className="w-3.5 h-3.5 text-primary" />
                  Design do Carrossel
                </p>
                <p className="text-[10px] text-muted-foreground">Escolha o estilo visual</p>
              </div>
              <div className="w-20 shrink-0">
                <MiniSlidePreview template={template} fontFamily={fontFamily} titleSize={titleSize} />
              </div>
            </div>

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
                  <ALargeSmall className="w-3 h-3" /> Tamanho
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

          {/* Generate button */}
          <Button onClick={handleGenerate} disabled={loading || !topic.trim()} className="w-full gap-2">
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
      </DialogContent>
    </Dialog>
  );
};

export default GenerateDialog;
