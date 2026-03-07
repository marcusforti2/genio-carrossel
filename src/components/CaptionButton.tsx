import { useState } from "react";
import { CarouselData } from "@/types/carousel";
import { Button } from "@/components/ui/button";
import { MessageSquareText, Loader2, Copy, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CaptionButtonProps {
  carousel: CarouselData;
  caption: string;
  onCaptionChange: (caption: string) => void;
  showLabel?: boolean;
}

const CaptionButton = ({ carousel, caption, onCaptionChange }: CaptionButtonProps) => {
  const [generating, setGenerating] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCaption = async () => {
    setGenerating(true);
    try {
      const slideSummary = carousel.slides
        .map((s, i) => `Slide ${i + 1}: ${s.title}${s.body ? ` — ${s.body}` : ""}`)
        .join("\n");

      const { data, error } = await supabase.functions.invoke("generate-caption", {
        body: {
          profileName: carousel.profileName,
          handle: carousel.profileHandle,
          slideSummary,
        },
      });

      if (error) throw error;
      if (data?.caption) {
        onCaptionChange(data.caption);
        setOpen(true);
        toast.success("Legenda gerada!");
      }
    } catch (e) {
      console.error("[Caption] Error:", e);
      toast.error("Erro ao gerar legenda");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      setCopied(true);
      toast.success("Legenda copiada!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for mobile
      const ta = document.createElement("textarea");
      ta.value = caption;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      toast.success("Legenda copiada!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClick = () => {
    if (caption) {
      setOpen(true);
    } else {
      generateCaption();
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="text-xs gap-1.5 h-8 px-2"
        onClick={handleClick}
        disabled={generating}
      >
        {generating ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <MessageSquareText className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">Legenda</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base">Legenda para o post</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="bg-muted/50 rounded-lg p-4 text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed border border-border/50">
              {caption || "Nenhuma legenda gerada ainda."}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 text-xs"
              onClick={generateCaption}
              disabled={generating}
            >
              {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {caption ? "Regerar" : "Gerar"}
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-2 text-xs"
              onClick={handleCopy}
              disabled={!caption}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiada!" : "Copiar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CaptionButton;
