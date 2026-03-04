import { useState, useCallback } from "react";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { jsPDF } from "jspdf";
import { CarouselData } from "@/types/carousel";
import SlidePreview from "@/components/SlidePreview";
import { Button } from "@/components/ui/button";
import { Download, Loader2, FileArchive, Image, FileText } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExportButtonsProps {
  carousel: CarouselData;
}

// Convert external URL to base64 data URL via proxy
const proxyImageToBase64 = async (url: string): Promise<string> => {
  if (!url || url.startsWith("data:")) return url;
  try {
    const { data, error } = await supabase.functions.invoke("proxy-image", {
      body: { url },
    });
    if (error || data?.error) return url;
    return data?.dataUrl || url;
  } catch {
    return url;
  }
};

// Pre-process carousel: convert all external images to base64
const prepareCarouselForExport = async (carousel: CarouselData): Promise<CarouselData> => {
  const slides = await Promise.all(
    carousel.slides.map(async (slide) => {
      if (slide.imageUrl && !slide.imageUrl.startsWith("data:")) {
        const base64Url = await proxyImageToBase64(slide.imageUrl);
        return { ...slide, imageUrl: base64Url };
      }
      return slide;
    })
  );

  let avatarUrl = carousel.avatarUrl;
  if (avatarUrl && !avatarUrl.startsWith("data:")) {
    avatarUrl = await proxyImageToBase64(avatarUrl);
  }

  return { ...carousel, slides, avatarUrl };
};

const ExportButtons = ({ carousel }: ExportButtonsProps) => {
  const [exporting, setExporting] = useState(false);

  const renderSlideToBlob = useCallback(async (preparedCarousel: CarouselData, slideIndex: number): Promise<Blob> => {
    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.style.width = "1080px";
    wrapper.style.height = "1350px";
    wrapper.style.zIndex = "-1";
    wrapper.style.overflow = "hidden";

    // Copy all stylesheets to ensure Tailwind classes work
    const styleSheets = document.querySelectorAll('style, link[rel="stylesheet"]');
    styleSheets.forEach((sheet) => {
      wrapper.appendChild(sheet.cloneNode(true));
    });

    // Copy CSS variables from document
    const rootStyles = getComputedStyle(document.documentElement);
    const cssVars = [
      "--background", "--foreground", "--card", "--card-foreground",
      "--primary", "--primary-foreground", "--secondary", "--secondary-foreground",
      "--muted", "--muted-foreground", "--accent", "--accent-foreground",
      "--border", "--ring", "--radius",
    ];
    cssVars.forEach((v) => {
      wrapper.style.setProperty(v, rootStyles.getPropertyValue(v));
    });

    document.body.appendChild(wrapper);

    const { createRoot } = await import("react-dom/client");
    const renderTarget = document.createElement("div");
    renderTarget.style.width = "1080px";
    renderTarget.style.height = "1350px";
    wrapper.appendChild(renderTarget);

    const root = createRoot(renderTarget);

    await new Promise<void>((resolve) => {
      root.render(
        <div style={{ width: 1080, height: 1350, fontFamily: "'Inter', 'Space Grotesk', sans-serif" }}>
          <SlidePreview
            slide={preparedCarousel.slides[slideIndex]}
            carousel={preparedCarousel}
            slideIndex={slideIndex}
            totalSlides={preparedCarousel.slides.length}
          />
        </div>
      );
      setTimeout(resolve, 800);
    });

    // Wait for fonts
    await document.fonts.ready;

    // Wait for all images to load
    const images = wrapper.querySelectorAll("img");
    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete) { resolve(); return; }
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
      )
    );

    // Extra safety delay
    await new Promise((r) => setTimeout(r, 300));

    const isDark = preparedCarousel.theme?.bgMode === "dark";
    const bgColor = isDark ? "#111" : "#f5f5f5";

    const dataUrl = await toPng(renderTarget, {
      width: 1080,
      height: 1350,
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: bgColor,
      skipAutoScale: true,
    });

    root.unmount();
    document.body.removeChild(wrapper);

    const res = await fetch(dataUrl);
    return res.blob();
  }, []);

  const downloadSingle = async (slideIndex: number) => {
    setExporting(true);
    try {
      toast.info("Preparando imagens...");
      const prepared = await prepareCarouselForExport(carousel);
      const blob = await renderSlideToBlob(prepared, slideIndex);
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
      toast.info("Preparando imagens para export...");
      const prepared = await prepareCarouselForExport(carousel);
      const zip = new JSZip();
      for (let i = 0; i < prepared.slides.length; i++) {
        toast.info(`Exportando slide ${i + 1}/${prepared.slides.length}...`);
        const blob = await renderSlideToBlob(prepared, i);
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

  const downloadPdf = async () => {
    setExporting(true);
    const TARGET_SIZE = 90 * 1024 * 1024; // 90MB target
    try {
      toast.info("Preparando PDF em alta qualidade...");
      const prepared = await prepareCarouselForExport(carousel);
      const pageW = 210;
      const pageH = pageW * (1350 / 1080);

      // Render all slides to PNG blobs first
      const slideBlobs: Blob[] = [];
      for (let i = 0; i < prepared.slides.length; i++) {
        toast.info(`Renderizando slide ${i + 1}/${prepared.slides.length}...`);
        slideBlobs.push(await renderSlideToBlob(prepared, i));
      }

      // Convert blobs to canvases with white background
      const slideCanvases: HTMLCanvasElement[] = [];
      for (const blob of slideBlobs) {
        const imgBitmap = await createImageBitmap(blob);
        const cvs = document.createElement("canvas");
        cvs.width = imgBitmap.width;
        cvs.height = imgBitmap.height;
        const ctx = cvs.getContext("2d")!;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.drawImage(imgBitmap, 0, 0);
        imgBitmap.close();
        slideCanvases.push(cvs);
      }

      // Try quality from 1.0 down until PDF fits under target
      let quality = 1.0;
      let pdfBlob: Blob | null = null;

      while (quality >= 0.5) {
        toast.info(`Gerando PDF (qualidade ${Math.round(quality * 100)}%)...`);
        const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: [pageW, pageH], compress: true });

        for (let i = 0; i < slideCanvases.length; i++) {
          const jpegDataUrl = slideCanvases[i].toDataURL("image/jpeg", quality);
          if (i > 0) pdf.addPage([pageW, pageH]);
          pdf.addImage(jpegDataUrl, "JPEG", 0, 0, pageW, pageH);
        }

        pdfBlob = pdf.output("blob");
        const sizeMB = pdfBlob.size / (1024 * 1024);
        console.log(`PDF quality=${quality} → ${sizeMB.toFixed(1)}MB`);

        if (pdfBlob.size <= TARGET_SIZE) {
          // If we have room and quality < 1, we found the sweet spot
          break;
        }
        quality -= 0.05;
      }

      if (!pdfBlob) throw new Error("Falha ao gerar PDF");

      const sizeMB = (pdfBlob.size / (1024 * 1024)).toFixed(1);
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carrossel.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`PDF exportado! (${sizeMB}MB, qualidade ${Math.round(quality * 100)}%)`);
    } catch (e) {
      console.error(e);
      toast.error("Erro ao exportar PDF");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs gap-1.5" disabled={exporting}>
          {exporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">Exportar</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={downloadAll} className="gap-2 text-xs cursor-pointer">
          <FileArchive className="w-3.5 h-3.5" />
          Baixar tudo (.zip)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={downloadPdf} className="gap-2 text-xs cursor-pointer">
          <FileText className="w-3.5 h-3.5" />
          Baixar PDF
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
