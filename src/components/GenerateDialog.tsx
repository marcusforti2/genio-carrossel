import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SlideData } from "@/types/carousel";
import { toast } from "sonner";

interface GenerateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (slides: SlideData[], caption: string) => void;
}

const GenerateDialog = ({ open, onOpenChange, onGenerated }: GenerateDialogProps) => {
  const { user } = useAuth();
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("tribunal");
  const [slideCount, setSlideCount] = useState([6]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error("Digite um tema para o carrossel");
      return;
    }
    if (!user) return;

    setLoading(true);

    try {
      // Fetch profile
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

      const slides: SlideData[] = data.slides.map((s: any, i: number) => ({
        id: crypto.randomUUID(),
        type: s.type === "cover" ? "cover" : "content",
        title: s.title || "",
        body: s.body || "",
        hasImage: true,
      }));

      onGenerated(slides, data.caption || "");
      toast.success("Carrossel gerado!");
      onOpenChange(false);
      setTopic("");
    } catch (e: any) {
      console.error(e);
      toast.error("Erro ao gerar carrossel. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Gerar Carrossel com IA
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tema / Ideia</Label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Como o LinkedIn cria profissionais culpados..."
              className="bg-secondary border-border/50"
            />
          </div>

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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs text-muted-foreground">Número de slides</Label>
              <span className="text-xs font-bold text-primary">{slideCount[0]}</span>
            </div>
            <Slider
              value={slideCount}
              onValueChange={setSlideCount}
              min={3}
              max={11}
              step={1}
              className="py-2"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading || !topic.trim()}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Gerar Carrossel
              </>
            )}
          </Button>

          <p className="text-[10px] text-muted-foreground/60 text-center">
            A IA usa os dados do seu perfil para personalizar o conteúdo.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GenerateDialog;
