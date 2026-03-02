import { SlideData, CarouselData } from "@/types/carousel";
import { User, Loader2 } from "lucide-react";
import { useMemo } from "react";

interface SlidePreviewProps {
  slide: SlideData;
  carousel: CarouselData;
  slideIndex: number;
  totalSlides: number;
}

const SlidePreview = ({ slide, carousel, slideIndex, totalSlides }: SlidePreviewProps) => {
  const isCover = slide.type === "cover";
  const theme = carousel.theme || { bgMode: "dark" as const, accentColor: "1 83% 55%", accentName: "Vermelho" };

  const styles = useMemo(() => {
    const isDark = theme.bgMode === "dark";
    return {
      bg: isDark ? "hsl(0 0% 6.5%)" : "hsl(0 0% 96%)",
      title: isDark ? "hsl(0 0% 100%)" : "hsl(0 0% 8%)",
      body: isDark ? "hsl(0 0% 60%)" : "hsl(0 0% 40%)",
      branding: isDark ? "hsl(0 0% 50%)" : "hsl(0 0% 55%)",
      accent: `hsl(${theme.accentColor})`,
      tagBg: `hsl(${theme.accentColor})`,
      tagFg: "hsl(0 0% 100%)",
      overlayFrom: isDark ? "rgba(20,20,20,0.4)" : "rgba(240,240,240,0.4)",
      overlayTo: isDark ? "rgba(17,17,17,0.95)" : "rgba(245,245,245,0.95)",
      counterBg: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
      counterText: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
      mutedBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      borderLight: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
      handleBg: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
    };
  }, [theme]);

  const Avatar = () =>
    carousel.avatarUrl ? (
      <img
        src={carousel.avatarUrl}
        alt="Avatar"
        className="w-8 h-8 rounded-full object-cover"
        style={{ border: `1.5px solid ${styles.accent}` }}
      />
    ) : (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: `${styles.accent}33`, border: `1.5px solid ${styles.accent}55` }}
      >
        <User className="w-4 h-4" style={{ color: `${styles.accent}aa` }} />
      </div>
    );

  return (
    <div
      className="relative w-full overflow-hidden font-display"
      style={{ aspectRatio: "4/5", background: styles.bg }}
    >
      {/* Branding top-left */}
      <div className="absolute top-5 left-5 z-10">
        <p className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: styles.branding }}>
          {carousel.brandingText}
        </p>
        <p className="text-[8px]" style={{ color: `${styles.branding}b3` }}>{carousel.brandingSubtext}</p>
      </div>

      {/* Slide counter top-right */}
      <div className="absolute top-5 right-5 z-10">
        <div
          className="backdrop-blur-sm rounded-full px-2.5 py-0.5 text-[9px]"
          style={{ background: styles.counterBg, color: styles.counterText }}
        >
          {slideIndex + 1}/{totalSlides}
        </div>
      </div>

      {isCover ? (
        <div className="flex flex-col justify-end h-full relative">
          {slide.imageUrl && (
            <img src={slide.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, ${styles.overlayFrom}, ${styles.overlayTo})`,
            }}
          />

          <div className="relative z-10 p-6 pb-8 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Avatar />
              <div>
                <p className="text-[11px] font-bold" style={{ color: styles.title }}>
                  {carousel.profileName}{" "}
                  <span style={{ color: styles.accent }}>✓</span>
                </p>
                <p className="text-[9px]" style={{ color: styles.body }}>{carousel.profileHandle}</p>
              </div>
            </div>

            <h1 className="text-lg font-black leading-tight" style={{ color: styles.title }}>
              {slide.title}
            </h1>
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full p-6 pt-14">
          <div className="flex-1 flex flex-col">
            {slide.hasImage && slide.imageUrl ? (
              <>
                <h2 className="text-base font-black leading-tight mb-3" style={{ color: styles.title }}>
                  {slide.title}
                </h2>
                <p className="text-[10px] leading-relaxed flex-shrink-0" style={{ color: styles.body }}>
                  {slide.body}
                </p>
                <div className="mt-auto pt-3">
                  {slide.imageLoading ? (
                    <div
                      className="w-full rounded-md flex items-center justify-center"
                      style={{ aspectRatio: "16/10", background: styles.mutedBg, border: `1px solid ${styles.borderLight}` }}
                    >
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: styles.accent }} />
                    </div>
                  ) : (
                    <img
                      src={slide.imageUrl}
                      alt=""
                      className="w-full rounded-md object-cover"
                      style={{ aspectRatio: "16/10" }}
                    />
                  )}
                </div>
              </>
            ) : slide.hasImage && !slide.imageUrl ? (
              <>
                <h2 className="text-base font-black leading-tight mb-3" style={{ color: styles.title }}>
                  {slide.title}
                </h2>
                <p className="text-[10px] leading-relaxed flex-shrink-0" style={{ color: styles.body }}>
                  {slide.body}
                </p>
                <div className="mt-auto pt-3">
                  {slide.imageLoading ? (
                    <div
                      className="w-full rounded-md flex items-center justify-center"
                      style={{ aspectRatio: "16/10", background: styles.mutedBg, border: `1px solid ${styles.borderLight}` }}
                    >
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: styles.accent }} />
                    </div>
                  ) : (
                    <div
                      className="w-full rounded-md"
                      style={{ aspectRatio: "16/10", background: styles.mutedBg, border: `1px solid ${styles.borderLight}` }}
                    />
                  )}
                </div>
              </>
            ) : (
              /* No-image layout: text-focused, centered, bigger typography */
              <div className="flex-1 flex flex-col justify-center items-center text-center px-2">
                <div
                  className="w-10 h-1 rounded-full mb-5"
                  style={{ background: styles.accent }}
                />
                <h2 className="text-xl font-black leading-tight mb-4" style={{ color: styles.title }}>
                  {slide.title}
                </h2>
                <p className="text-xs leading-relaxed" style={{ color: styles.body }}>
                  {slide.body}
                </p>
                <div
                  className="w-10 h-1 rounded-full mt-5"
                  style={{ background: styles.accent }}
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 mt-4">
            <span
              className="text-[7px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: styles.tagBg, color: styles.tagFg }}
            >
              @novaordem.hub
            </span>
            <span
              className="text-[7px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: styles.handleBg,
                color: `${styles.title}b3`,
                border: `1px solid ${styles.borderLight}`,
              }}
            >
              {carousel.profileHandle}
            </span>
            <span className="ml-auto text-[7px]" style={{ color: `${styles.body}80` }}>
              Arrasta para o lado &gt;
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SlidePreview;
