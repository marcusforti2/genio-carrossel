import { useMemo } from "react";
import SlidePreview from "@/components/SlidePreview";
import { CarouselData, DesignTemplate, FontFamily, SlideData, TitleSize } from "@/types/carousel";

interface RealisticSlidePreviewProps {
  template: DesignTemplate;
  fontFamily: FontFamily;
  titleSize: TitleSize;
  bgMode: "dark" | "light";
  accentColor: string;
  profileName?: string;
  profileHandle?: string;
  avatarUrl?: string;
  sampleImageUrls?: string[];
}

const BASE_SLIDES: Omit<SlideData, "id" | "imageUrl">[] = [
  {
    type: "cover",
    title: "Como criar conteúdo que gera impacto real.",
    body: "",
    hasImage: true,
  },
  {
    type: "content",
    title: "O segredo que poucos contam.",
    body: "Conteúdo de valor real conecta emoção com estratégia de forma intencional.",
    hasImage: true,
  },
  {
    type: "content",
    title: "Pare de seguir fórmulas prontas.",
    body: "Autenticidade bem posicionada converte melhor que volume sem direção.",
    hasImage: true,
  },
  {
    type: "cta",
    title: "Gostou? Me siga para mais insights.",
    body: "",
    hasImage: false,
  },
];

const RealisticSlidePreview = ({
  template,
  fontFamily,
  titleSize,
  bgMode,
  accentColor,
  profileName = "",
  profileHandle = "",
  avatarUrl = "",
  sampleImageUrls = [],
}: RealisticSlidePreviewProps) => {
  const previewSlides = useMemo<SlideData[]>(
    () =>
      BASE_SLIDES.map((slide, index) => ({
        ...slide,
        id: `preview-${index}`,
        imageUrl: slide.hasImage ? sampleImageUrls[index] : undefined,
      })),
    [sampleImageUrls],
  );

  const previewCarousel = useMemo<CarouselData>(
    () => ({
      id: "preview-carousel",
      profileName: profileName || "Seu Nome",
      profileHandle: profileHandle || "@seuhandle",
      brandingText: profileName || "Marca",
      brandingSubtext: "Prévia real",
      avatarUrl,
      slides: previewSlides,
      theme: {
        bgMode,
        accentColor,
        accentName: "Preview",
      },
      footer: {
        showBranding: true,
        showHandle: true,
        showCta: true,
        ctaText: "Arrasta para o lado →",
      },
      designStyle: {
        template,
        fontFamily,
        titleSize,
        bodySize: "medio",
      },
    }),
    [accentColor, avatarUrl, bgMode, fontFamily, previewSlides, profileHandle, profileName, template, titleSize],
  );

  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {previewSlides.map((slide, index) => (
        <div key={slide.id} className="rounded-md border border-border/60 overflow-hidden">
          <SlidePreview
            slide={slide}
            carousel={previewCarousel}
            slideIndex={index}
            totalSlides={previewSlides.length}
          />
        </div>
      ))}
    </div>
  );
};

export default RealisticSlidePreview;
