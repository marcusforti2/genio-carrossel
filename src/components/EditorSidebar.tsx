import { useState, useCallback, memo } from "react";
import { SlideData, CarouselData, ACCENT_PRESETS, BG_COLOR_PRESETS, DesignStyle } from "@/types/carousel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, User, Type, Palette, Pencil, UserCircle, ChevronDown } from "lucide-react";
import SlideEditorPanel from "@/components/SlideEditorPanel";
import SlideDesignOverrides from "@/components/SlideDesignOverrides";



import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const SectionHeader = ({ icon: Icon, label, open, onToggle }: { icon: React.ElementType; label: string; open: boolean; onToggle: () => void }) => (
  <CollapsibleTrigger asChild onClick={onToggle}>
    <button className="w-full flex items-center justify-between py-2.5 px-1 group">
      <div className="flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{label}</span>
      </div>
      <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
    </button>
  </CollapsibleTrigger>
);

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
}: EditorSidebarProps) => {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    slide: true,
    design: false,
    profile: false,
    footer: false,
  });
  const selectedSlide = carousel.slides[selectedSlideIndex];

  const toggleSection = useCallback((section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  const updateTheme = useCallback((partial: Partial<CarouselData["theme"]>) => {
    onUpdateCarousel({ ...carousel, theme: { ...carousel.theme, ...partial } });
  }, [carousel, onUpdateCarousel]);

  const updateDesignStyle = useCallback((partial: Partial<DesignStyle>) => {
    const current = carousel.designStyle || { template: "bold" as const, fontFamily: "sans" as const, titleSize: "grande" as const, bodySize: "grande" as const };
    onUpdateCarousel({ ...carousel, designStyle: { ...current, ...partial } });
  }, [carousel, onUpdateCarousel]);

  const ds = carousel.designStyle || { template: "bold", fontFamily: "sans", titleSize: "grande", bodySize: "grande" };

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      <div className="flex-1 overflow-y-auto p-3 space-y-1">

        {/* ── SLIDE ── */}
        <Collapsible open={openSections.slide}>
          <SectionHeader icon={Pencil} label="Editar Slide" open={openSections.slide} onToggle={() => toggleSection("slide")} />
          <CollapsibleContent>
            {selectedSlide && (
              <div className="pb-3">
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
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-border/40" />

        {/* ── DESIGN ── */}
        <Collapsible open={openSections.design}>
          <SectionHeader icon={Palette} label="Design Global" open={openSections.design} onToggle={() => toggleSection("design")} />
          <CollapsibleContent>
            <div className="space-y-5 pb-3">
              {/* BG color */}
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground/70">Cor de Fundo</Label>
                <div className="grid grid-cols-5 gap-1.5">
                  {BG_COLOR_PRESETS.map((preset) => {
                    const isSelected = carousel.theme.bgColor === preset.color ||
                      (!carousel.theme.bgColor && preset.name === "Escuro" && carousel.theme.bgMode === "dark") ||
                      (!carousel.theme.bgColor && preset.name === "Claro" && carousel.theme.bgMode === "light");
                    return (
                      <button
                        key={preset.name}
                        onClick={() => updateTheme({ bgMode: preset.mode, bgColor: preset.color, bgColorName: preset.name })}
                        className={`flex flex-col items-center gap-1 py-1.5 rounded-md border transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/30"
                        }`}
                      >
                        <div
                          className="w-5 h-5 rounded-full border border-border/50"
                          style={{ background: `hsl(${preset.color})` }}
                        />
                        <span className="text-[8px] text-muted-foreground">{preset.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Accent color */}
              <div className="space-y-2">
                <Label className="text-[10px] text-muted-foreground/70">Cor destaque</Label>
                <div className="grid grid-cols-4 gap-1.5">
                  {ACCENT_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => updateTheme({ accentColor: preset.color, accentName: preset.name })}
                      className={`flex flex-col items-center gap-1 py-1.5 rounded-md border transition-all ${
                        carousel.theme.accentColor === preset.color
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/30"
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full border border-border/50" style={{ background: `hsl(${preset.color})` }} />
                      <span className="text-[8px] text-muted-foreground">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-border/40" />

        {/* ── PERFIL ── */}
        <Collapsible open={openSections.profile}>
          <SectionHeader icon={UserCircle} label="Perfil" open={openSections.profile} onToggle={() => toggleSection("profile")} />
          <CollapsibleContent>
            <div className="space-y-3 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-border bg-secondary flex items-center justify-center">
                  {carousel.avatarUrl ? (
                    <img src={carousel.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <p className="text-[9px] text-muted-foreground">Foto vem do seu perfil</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground/70">Nome</Label>
                <Input value={carousel.profileName} onChange={(e) => onUpdateCarousel({ ...carousel, profileName: e.target.value })} className="bg-secondary border-border/50 h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground/70">Handle</Label>
                <Input value={carousel.profileHandle} onChange={(e) => onUpdateCarousel({ ...carousel, profileHandle: e.target.value })} className="bg-secondary border-border/50 h-8 text-xs" />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-border/40" />

        {/* ── RODAPÉ ── */}
        <Collapsible open={openSections.footer}>
          <SectionHeader icon={Type} label="Rodapé" open={openSections.footer} onToggle={() => toggleSection("footer")} />
          <CollapsibleContent>
            <div className="space-y-3 pb-3">
              {/* Branding text */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground/70">Branding</Label>
                  <Switch
                    checked={carousel.footer?.showBranding !== false}
                    onCheckedChange={(checked) => onUpdateCarousel({ ...carousel, footer: { ...carousel.footer, showBranding: checked } })}
                  />
                </div>
                <Input
                  value={carousel.brandingText}
                  onChange={(e) => onUpdateCarousel({ ...carousel, brandingText: e.target.value })}
                  placeholder="Ex: Governo de Negócios"
                  className="bg-secondary border-border/50 h-8 text-xs"
                  disabled={carousel.footer?.showBranding === false}
                />
              </div>

              {/* Sub-branding */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground/70">Sub-branding (topo)</Label>
                <Input
                  value={carousel.brandingSubtext}
                  onChange={(e) => onUpdateCarousel({ ...carousel, brandingSubtext: e.target.value })}
                  placeholder="Ex: Aceleração Forti"
                  className="bg-secondary border-border/50 h-8 text-xs"
                />
              </div>

              {/* Handle */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground/70">@Handle</Label>
                  <Switch
                    checked={carousel.footer?.showHandle !== false}
                    onCheckedChange={(checked) => onUpdateCarousel({ ...carousel, footer: { ...carousel.footer, showHandle: checked } })}
                  />
                </div>
                <Input
                  value={carousel.profileHandle}
                  onChange={(e) => onUpdateCarousel({ ...carousel, profileHandle: e.target.value })}
                  placeholder="@seuhandle"
                  className="bg-secondary border-border/50 h-8 text-xs"
                  disabled={carousel.footer?.showHandle === false}
                />
              </div>

              {/* CTA */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] text-muted-foreground/70">Texto CTA</Label>
                  <Switch
                    checked={carousel.footer?.showCta !== false}
                    onCheckedChange={(checked) => onUpdateCarousel({ ...carousel, footer: { ...carousel.footer, showCta: checked } })}
                  />
                </div>
                <Input
                  value={carousel.footer?.ctaText || "Arrasta para o lado >"}
                  onChange={(e) => onUpdateCarousel({ ...carousel, footer: { ...carousel.footer, ctaText: e.target.value } })}
                  placeholder="Ex: Arrasta para o lado >"
                  className="bg-secondary border-border/50 h-8 text-xs"
                  disabled={carousel.footer?.showCta === false}
                />
              </div>

              {/* Footer preview */}
              <div className="space-y-1.5">
                <Label className="text-[10px] text-muted-foreground/70">Preview</Label>
                <div
                  className="rounded-md p-2.5 flex items-center gap-2"
                  style={{ background: carousel.theme.bgMode === "dark" ? "hsl(0 0% 6.5%)" : "hsl(0 0% 96%)" }}
                >
                  {carousel.footer?.showBranding !== false && carousel.brandingText && (
                    <span
                      className="text-[7px] font-semibold px-1.5 py-0.5 rounded-full"
                      style={{ background: `hsl(${carousel.theme.accentColor})`, color: "#fff" }}
                    >
                      {carousel.brandingText}
                    </span>
                  )}
                  {carousel.footer?.showHandle !== false && carousel.profileHandle && (
                    <span
                      className="text-[7px] font-medium px-1.5 py-0.5 rounded-full"
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
                    <span className="ml-auto text-[7px]" style={{ color: carousel.theme.bgMode === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)" }}>
                      {carousel.footer?.ctaText || "Arrasta para o lado >"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Slide thumbnails */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {carousel.slides.map((slide, i) => {
            const hasOverride = slide.styleOverride && Object.keys(slide.styleOverride).length > 0;
            return (
              <button
                key={slide.id}
                onClick={() => { onSelectSlide(i); setOpenSections((prev) => ({ ...prev, slide: true })); }}
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

export default memo(EditorSidebar);
