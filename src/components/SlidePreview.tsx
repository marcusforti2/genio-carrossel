import { SlideData, CarouselData } from "@/types/carousel";
import { User } from "lucide-react";

interface SlidePreviewProps {
  slide: SlideData;
  carousel: CarouselData;
  slideIndex: number;
  totalSlides: number;
}

const SlidePreview = ({ slide, carousel, slideIndex, totalSlides }: SlidePreviewProps) => {
  const isCover = slide.type === "cover";

  const Avatar = () => (
    carousel.avatarUrl ? (
      <img src={carousel.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-primary/50" />
    ) : (
      <div className="w-8 h-8 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center">
        <User className="w-4 h-4 text-primary/70" />
      </div>
    )
  );

  return (
    <div
      className="relative w-full overflow-hidden bg-slide-bg font-display"
      style={{ aspectRatio: "4/5" }}
    >
      {/* Branding top-left */}
      <div className="absolute top-5 left-5 z-10">
        <p className="text-[10px] font-semibold tracking-wide text-slide-branding uppercase">
          {carousel.brandingText}
        </p>
        <p className="text-[8px] text-slide-branding/70">{carousel.brandingSubtext}</p>
      </div>

      {/* Slide counter top-right */}
      <div className="absolute top-5 right-5 z-10">
        <div className="bg-foreground/20 backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[9px] text-slide-title/80">
          {slideIndex + 1}/{totalSlides}
        </div>
      </div>

      {isCover ? (
        <div className="flex flex-col justify-end h-full relative">
          {slide.hasImage && (
            <div className="absolute inset-0 bg-gradient-to-b from-muted/40 to-slide-bg/95" />
          )}

          <div className="relative z-10 p-6 pb-8 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Avatar />
              <div>
                <p className="text-[11px] font-bold text-slide-title">
                  {carousel.profileName}{" "}
                  <span className="text-primary">✓</span>
                </p>
                <p className="text-[9px] text-slide-body">{carousel.profileHandle}</p>
              </div>
            </div>

            <h1 className="text-lg font-black leading-tight text-slide-title">
              {slide.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full p-6 pt-14">
          <div className="flex-1 flex flex-col">
            <h2 className="text-base font-black leading-tight text-slide-title mb-3">
              {slide.title}
            </h2>
            <p className="text-[10px] leading-relaxed text-slide-body flex-shrink-0">
              {slide.body}
            </p>

            {slide.hasImage && (
              <div className="mt-auto pt-3">
                <div className="w-full rounded-md bg-muted/30 border border-border/30"
                  style={{ aspectRatio: "16/10" }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span className="bg-slide-tag-bg text-slide-tag-fg text-[7px] font-semibold px-2 py-0.5 rounded-full">
              @novaordem.hub
            </span>
            <span className="bg-foreground/10 text-slide-title/70 text-[7px] font-medium px-2 py-0.5 rounded-full border border-border/30">
              {carousel.profileHandle}
            </span>
            <span className="ml-auto text-[7px] text-slide-body/50">Arrasta para o lado &gt;</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlidePreview;
