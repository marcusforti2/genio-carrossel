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

// 1px transparent PNG fallback
const TRANSPARENT_PIXEL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQABNjN9GQAAAAlwRFlzAAAWJQAAFiUBSVIk8AAAAA0lEQVQI12P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==";

// Convert external URL to base64 data URL via proxy with retry
const proxyImageToBase64 = async (url: string, retries = 2): Promise<string> => {
  if (!url || url.startsWith("data:")) return url;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { data, error } = await supabase.functions.invoke("proxy-image", {
        body: { url },
      });
      if (!error && data?.dataUrl) {
        console.log(`[Export] Proxied image OK (attempt ${attempt + 1}): ${url.substring(0, 80)}...`);
        return data.dataUrl;
      }
      console.warn(`[Export] Proxy attempt ${attempt + 1} failed for: ${url.substring(0, 80)}`, error || data?.error);
    } catch (e) {
      console.warn(`[Export] Proxy attempt ${attempt + 1} exception for: ${url.substring(0, 80)}`, e);
    }

    // Wait before retry
    if (attempt < retries) {
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
    }
  }

  // All retries failed — return transparent pixel instead of original URL
  // Original URL would cause CORS failure in html-to-image
  console.error(`[Export] All proxy attempts failed, using fallback for: ${url.substring(0, 80)}`);
  return TRANSPARENT_PIXEL;
};

// Pre-process carousel: convert all external images to base64
const prepareCarouselForExport = async (carousel: CarouselData): Promise<CarouselData> => {
  console.log("[Export] Preparing carousel for export...");

  // Collect all URLs that need proxying
  const urlsToProxy: { key: string; url: string }[] = [];

  carousel.slides.forEach((slide, i) => {
    if (slide.imageUrl && !slide.imageUrl.startsWith("data:")) {
      urlsToProxy.push({ key: `slide-${i}`, url: slide.imageUrl });
    }
  });

  if (carousel.avatarUrl && !carousel.avatarUrl.startsWith("data:")) {
    urlsToProxy.push({ key: "avatar", url: carousel.avatarUrl });
  }

  console.log(`[Export] Need to proxy ${urlsToProxy.length} images`);

  // Proxy all images in parallel
  const results = await Promise.all(
    urlsToProxy.map(async ({ key, url }) => ({
      key,
      dataUrl: await proxyImageToBase64(url),
    }))
  );

  const urlMap = new Map(results.map(r => [r.key, r.dataUrl]));

  const slides = carousel.slides.map((slide, i) => {
    const proxied = urlMap.get(`slide-${i}`);
    if (proxied) {
      return { ...slide, imageUrl: proxied };
    }
    return slide;
  });

  const avatarUrl = urlMap.get("avatar") || carousel.avatarUrl;

  console.log("[Export] All images prepared");
  return { ...carousel, slides, avatarUrl };
};

// Gather all computed CSS rules as inline <style> text
const gatherStyles = (): string => {
  const cssTexts: string[] = [];
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          cssTexts.push(rule.cssText);
        }
      } catch {
        // Cross-origin stylesheet, skip
      }
    }
  } catch {
    // Ignore
  }
  return cssTexts.join("\n");
};

const ExportButtons = ({ carousel }: ExportButtonsProps) => {
  const [exporting, setExporting] = useState(false);

  const renderSlideToBlob = useCallback(async (preparedCarousel: CarouselData, slideIndex: number): Promise<Blob> => {
    console.log(`[Export] Rendering slide ${slideIndex + 1}...`);

    const wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.style.width = "1080px";
    wrapper.style.height = "1350px";
    wrapper.style.zIndex = "-1";
    wrapper.style.overflow = "hidden";

    // Inject all CSS as inline <style> so html-to-image can serialize it
    const styleEl = document.createElement("style");
    styleEl.textContent = gatherStyles();
    wrapper.appendChild(styleEl);

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
      setTimeout(resolve, 1200);
    });

    // Wait for fonts
    await document.fonts.ready;

    // Wait for all images to load with timeout
    const images = wrapper.querySelectorAll("img");
    console.log(`[Export] Slide ${slideIndex + 1}: waiting for ${images.length} images...`);

    await Promise.all(
      Array.from(images).map(
        (img) =>
          new Promise<void>((resolve) => {
            if (img.complete && img.naturalWidth > 0) {
              console.log(`[Export] Image already loaded: ${img.src.substring(0, 60)}...`);
              resolve();
              return;
            }
            const timeout = setTimeout(() => {
              console.warn(`[Export] Image load timeout: ${img.src.substring(0, 60)}...`);
              resolve();
            }, 5000);
            img.onload = () => {
              clearTimeout(timeout);
              console.log(`[Export] Image loaded: ${img.src.substring(0, 60)}... (${img.naturalWidth}x${img.naturalHeight})`);
              resolve();
            };
            img.onerror = () => {
              clearTimeout(timeout);
              console.error(`[Export] Image FAILED to load: ${img.src.substring(0, 60)}...`);
              resolve();
            };
          })
      )
    );

    // Extra safety delay for rendering
    await new Promise((r) => setTimeout(r, 500));

    const isDark = preparedCarousel.theme?.bgMode === "dark";
    const bgColor = isDark ? "#111" : "#f5f5f5";

    console.log(`[Export] Capturing slide ${slideIndex + 1} with toPng...`);

    const dataUrl = await toPng(renderTarget, {
      width: 1080,
      height: 1350,
      pixelRatio: 3,
      cacheBust: true,
      backgroundColor: bgColor,
      skipAutoScale: true,
      includeQueryParams: true,
    });

    console.log(`[Export] Slide ${slideIndex + 1} captured, data URL length: ${dataUrl.length}`);

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
      console.error("[Export] Error exporting single slide:", e);
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
      const failed: number[] = [];
      for (let i = 0; i < prepared.slides.length; i++) {
        toast.info(`Exportando slide ${i + 1}/${prepared.slides.length}...`);
        try {
          const blob = await renderSlideToBlob(prepared, i);
          zip.file(`slide-${i + 1}.png`, blob);
        } catch (err) {
          console.error(`[Export] Erro no slide ${i + 1}:`, err);
          failed.push(i + 1);
        }
      }
      if (Object.keys(zip.files).length === 0) {
        toast.error("Nenhum slide foi exportado com sucesso.");
        return;
      }
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "carrossel.zip";
      a.click();
      URL.revokeObjectURL(url);
      if (failed.length > 0) {
        toast.warning(`Exportado com ${failed.length} slide(s) com erro: ${failed.join(", ")}`);
      } else {
        toast.success("Carrossel exportado!");
      }
    } catch (e) {
      console.error("[Export] Error:", e);
      toast.error("Erro ao exportar carrossel");
    } finally {
      setExporting(false);
    }
  };

  const downloadPdf = async () => {
    setExporting(true);
    const TARGET_SIZE = 90 * 1024 * 1024;
    try {
      toast.info("Preparando PDF em alta qualidade...");
      const prepared = await prepareCarouselForExport(carousel);
      const pageW = 210;
      const pageH = pageW * (1350 / 1080);

      const slideBlobs: Blob[] = [];
      for (let i = 0; i < prepared.slides.length; i++) {
        toast.info(`Renderizando slide ${i + 1}/${prepared.slides.length}...`);
        slideBlobs.push(await renderSlideToBlob(prepared, i));
      }

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
        console.log(`[Export] PDF quality=${quality} → ${sizeMB.toFixed(1)}MB`);

        if (pdfBlob.size <= TARGET_SIZE) break;
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
      console.error("[Export] PDF error:", e);
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
