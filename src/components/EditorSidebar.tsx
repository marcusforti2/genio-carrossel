import { useState } from "react";
import { SlideData, CarouselData } from "@/types/carousel";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, GripVertical } from "lucide-react";

interface SlideEditorPanelProps {
  slide: SlideData;
  onUpdate: (updated: SlideData) => void;
  onDelete: () => void;
  canDelete: boolean;
}

const SlideEditorPanel = ({ slide, onUpdate, onDelete, canDelete }: SlideEditorPanelProps) => {
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
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive h-7 px-2"
          >
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
  const [tab, setTab] = useState<"slide" | "profile">("slide");
  const selectedSlide = carousel.slides[selectedSlideIndex];

  return (
    <div className="h-full flex flex-col bg-card border-r border-border">
      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab("slide")}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            tab === "slide"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Slide
        </button>
        <button
          onClick={() => setTab("profile")}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors ${
            tab === "profile"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Perfil
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "slide" && selectedSlide && (
          <SlideEditorPanel
            key={selectedSlide.id}
            slide={selectedSlide}
            onUpdate={(s) => onUpdateSlide(selectedSlideIndex, s)}
            onDelete={() => onDeleteSlide(selectedSlideIndex)}
            canDelete={carousel.slides.length > 1}
          />
        )}

        {tab === "profile" && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <Input
                value={carousel.profileName}
                onChange={(e) => onUpdateCarousel({ ...carousel, profileName: e.target.value })}
                className="bg-secondary border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Handle</Label>
              <Input
                value={carousel.profileHandle}
                onChange={(e) => onUpdateCarousel({ ...carousel, profileHandle: e.target.value })}
                className="bg-secondary border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Branding</Label>
              <Input
                value={carousel.brandingText}
                onChange={(e) => onUpdateCarousel({ ...carousel, brandingText: e.target.value })}
                className="bg-secondary border-border/50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sub-branding</Label>
              <Input
                value={carousel.brandingSubtext}
                onChange={(e) => onUpdateCarousel({ ...carousel, brandingSubtext: e.target.value })}
                className="bg-secondary border-border/50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Slide thumbnails + add */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {carousel.slides.map((slide, i) => (
            <button
              key={slide.id}
              onClick={() => {
                onSelectSlide(i);
                setTab("slide");
              }}
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
