import { SlideData, CarouselData, ACCENT_PRESETS, BG_COLOR_PRESETS, DESIGN_TEMPLATES, FONT_FAMILIES, TITLE_SIZES, DesignStyle, SlideStyleOverride } from "@/types/carousel";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sun, Moon, LayoutTemplate } from "lucide-react";

interface SlideDesignOverridesProps {
  slide: SlideData;
  onUpdate: (s: SlideData) => void;
  carousel: CarouselData;
}

const SlideDesignOverrides = ({ slide, onUpdate, carousel }: SlideDesignOverridesProps) => {
  const so = slide.styleOverride || {};
  const globalDs = carousel.designStyle || { template: "bold" as const, fontFamily: "sans" as const, titleSize: "grande" as const };
  const globalTheme = carousel.theme || { bgMode: "dark" as const, accentColor: "1 83% 55%", accentName: "Vermelho" };

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

      {/* BG color */}
      <div className="space-y-1.5">
        <Label className="text-[10px] text-muted-foreground/70">Fundo</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {BG_COLOR_PRESETS.map((preset) => {
            const isSelected = so.bgMode === preset.mode && so.bgColor === preset.color;
            const isEffective = !so.bgColor && !so.bgMode &&
              ((carousel.theme.bgColor === preset.color) ||
               (!carousel.theme.bgColor && preset.name === "Escuro" && carousel.theme.bgMode === "dark") ||
               (!carousel.theme.bgColor && preset.name === "Claro" && carousel.theme.bgMode === "light"));
            return (
              <button
                key={preset.name}
                onClick={() => updateOverride({ bgMode: preset.mode, bgColor: preset.color })}
                className={`flex flex-col items-center gap-1 py-1.5 rounded-md border transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary/50"
                    : isEffective
                    ? "border-primary/30 bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                }`}
              >
                <div className="w-4 h-4 rounded-full border border-border/50" style={{ background: `hsl(${preset.color})` }} />
                <span className="text-[7px] text-muted-foreground">{preset.name}</span>
              </button>
            );
          })}
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

export default SlideDesignOverrides;
