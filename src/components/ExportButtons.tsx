import { useState, useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { CarouselData } from "@/types/carousel";
import SlidePreview from "@/components/SlidePreview";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileArchive, Image } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ExportButtonsProps {
  carousel: CarouselData;
}

const ExportButtons = ({ carousel }: ExportButtonsProps) => {
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const renderSlideToBlob = useCallback(async (slideIndex: number): Promise<Blob> => {
    // Create an off-screen element to render the slide
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.style.width = "1080px";
    wrapper.style.zIndex = "-1";
    document.body.appendChild(wrapper);

    // Use ReactDOM to render
    const { createRoot } = await import("react-dom/client");
    const root = createRoot(wrapper);

    await new Promise<void>((resolve) => {
      root.render(
        <div style={{ width: 1080 }}>
          <SlidePreview
            slide={carousel.slides[slideIndex]}
            carousel={carousel}
            slideIndex={slideIndex}
            totalSlides={carousel.slides.length}
          />
        </div>
      );
      // Wait for render + images to load
      setTimeout(resolve, 500);
    });

    const dataUrl = await toPng(wrapper, {
      width: 1080,
      height: 1350,
      pixelRatio: 2,
      cacheBust: true,
    });

    root.unmount();
    document.body.removeChild(wrapper);

    const res = await fetch(dataUrl);
    return res.blob();
  }, [carousel]);

  const downloadSingle = async (slideIndex: number) => {
    setExporting(true);
    try {
      const blob = await renderSlideToBlob(slideIndex);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `slide-${slideIndex + 1}.png`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Slide ${slideIndex + 1} baixado!`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao exportar slide");
    } finally {
      setExporting(false);
    }
  };

  const downloadAll = async () => {
    setExporting(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < carousel.slides.length; i++) {
        toast.info(`Exportando slide ${i + 1}/${carousel.slides.length}...`);
        const blob = await renderSlideToBlob(i);
        zip.file(`slide-${i + 1}.png`, blob);
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carrossel.zip";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Carrossel exportado!");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao exportar carrossel");
    } finally {
      setExporting(false);
    }
  };

  const downloadCurrentSlide = async (index: number) => {
    await downloadSingle(index);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" disabled={exporting}>
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Exportar
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={downloadAll} className="gap-2 text-xs cursor-pointer">
          <FileArchive className="w-3.5 h-3.5" />
          Baixar tudo (.zip)
        </DropdownMenuItem>
        {carousel.slides.map((_, i) => (
          <DropdownMenuItem key={i} onClick={() => downloadSingle(i)} className="gap-2 text-xs cursor-pointer">
            <Image className="w-3.5 h-3.5" />
            Slide {i + 1} (.png)
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportButtons;
