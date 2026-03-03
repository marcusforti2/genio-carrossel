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
      body: isDark ? "hsl(0 0% 70%)" : "hsl(0 0% 35%)",
      branding: isDark ? "hsl(0 0% 50%)" : "hsl(0 0% 55%)",
      accent: `hsl(${theme.accentColor})`,
      tagBg: `hsl(${theme.accentColor})`,
      tagFg: "hsl(0 0% 100%)",
      overlayFrom: isDark ? "rgba(20,20,20,0.3)" : "rgba(240,240,240,0.3)",
      overlayTo: isDark ? "rgba(17,17,17,0.92)" : "rgba(245,245,245,0.92)",
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
        className="w-10 h-10 rounded-full object-cover"
        style={{ border: `2px solid ${styles.accent}` }}
      />
    ) : (
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center"
        style={{ background: `${styles.accent}33`, border: `2px solid ${styles.accent}55` }}
      >
        <User className="w-5 h-5" style={{ color: `${styles.accent}aa` }} />
      </div>
    );

  const footerHandle = carousel.profileHandle || "";
  const footerBranding = carousel.brandingText || "";

  return (
    <div
      className="relative w-full overflow-hidden font-display"
      style={{ aspectRatio: "4/5", background: styles.bg }}
    >
      {/* Branding top-left */}
      <div className="absolute top-[5%] left-[5.5%] z-10">
        <p className="text-[3.2%] font-bold tracking-wider uppercase leading-tight" style={{ color: styles.branding }}>
          {carousel.brandingText}
        </p>
        <p className="text-[2.4%] leading-tight mt-[2px]" style={{ color: `${styles.branding}b3` }}>
          {carousel.brandingSubtext}
        </p>
      </div>

      {/* Slide counter top-right */}
      <div className="absolute top-[5%] right-[5.5%] z-10">
        <div
          className="backdrop-blur-sm rounded-full px-[3%] py-[1%] text-[2.8%] font-medium"
          style={{ background: styles.counterBg, color: styles.counterText }}
        >
          {slideIndex + 1}/{totalSlides}
        </div>
      </div>

      {isCover ? (
        <CoverSlide slide={slide} carousel={carousel} styles={styles} Avatar={Avatar} footerHandle={footerHandle} />
      ) : (
        <ContentSlide
          slide={slide}
          carousel={carousel}
          styles={styles}
          footerHandle={footerHandle}
          footerBranding={footerBranding}
        />
      )}
    </div>
  );
};

/* ── Cover Slide ── */
interface CoverProps {
  slide: SlideData;
  carousel: CarouselData;
  styles: Record<string, string>;
  Avatar: React.FC;
  footerHandle: string;
}

const CoverSlide = ({ slide, carousel, styles, Avatar, footerHandle }: CoverProps) => (
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

    <div className="relative z-10 p-[7%] pb-[10%] text-left space-y-[4%]">
      <div className="flex items-center gap-[3%]">
        <Avatar />
        <div>
          <p className="text-[3.4%] font-bold leading-tight" style={{ color: styles.title }}>
            {carousel.profileName}{" "}
            <span style={{ color: styles.accent }}>✓</span>
          </p>
          <p className="text-[2.8%] leading-tight mt-[2px]" style={{ color: styles.body }}>
            {footerHandle}
          </p>
        </div>
      </div>

      <h1 className="text-[6.5%] font-black leading-[1.15] line-clamp-3" style={{ color: styles.title }}>
        {slide.title}
      </h1>
    </div>
  </div>
);

/* ── Content Slide ── */
interface ContentProps {
  slide: SlideData;
  carousel: CarouselData;
  styles: Record<string, string>;
  footerHandle: string;
  footerBranding: string;
}

const ContentSlide = ({ slide, carousel, styles, footerHandle, footerBranding }: ContentProps) => (
  <div className="flex flex-col h-full p-[7%] pt-[14%] overflow-hidden">
    <div className="flex-1 flex flex-col min-h-0">
      {slide.hasImage && (slide.imageUrl || slide.imageLoading) ? (
        <SlideWithImage slide={slide} styles={styles} />
      ) : slide.hasImage ? (
        <SlideWithImagePlaceholder slide={slide} styles={styles} />
      ) : (
        <SlideTextOnly slide={slide} styles={styles} />
      )}
    </div>

    <SlideFooter
      carousel={carousel}
      styles={styles}
      footerHandle={footerHandle}
      footerBranding={footerBranding}
    />
  </div>
);

/* ── Slide with Image ── */
const SlideWithImage = ({ slide, styles }: { slide: SlideData; styles: Record<string, string> }) => (
  <>
    <h2 className="text-[5%] font-black leading-[1.2] mb-[3%] line-clamp-2" style={{ color: styles.title }}>
      {slide.title}
    </h2>
    <p className="text-[3.2%] leading-[1.6] flex-shrink-0 line-clamp-3" style={{ color: styles.body }}>
      {slide.body}
    </p>
    <div className="mt-auto pt-[4%]">
      {slide.imageLoading ? (
        <div
          className="w-full rounded-lg flex items-center justify-center"
          style={{ aspectRatio: "16/10", background: styles.mutedBg, border: `1px solid ${styles.borderLight}` }}
        >
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: styles.accent }} />
        </div>
      ) : (
        <img
          src={slide.imageUrl}
          alt=""
          className="w-full rounded-lg object-cover"
          style={{ aspectRatio: "16/10" }}
        />
      )}
    </div>
  </>
);

/* ── Slide with Image Placeholder ── */
const SlideWithImagePlaceholder = ({ slide, styles }: { slide: SlideData; styles: Record<string, string> }) => (
  <>
    <h2 className="text-[5%] font-black leading-[1.2] mb-[3%] line-clamp-2" style={{ color: styles.title }}>
      {slide.title}
    </h2>
    <p className="text-[3.2%] leading-[1.6] flex-shrink-0 line-clamp-3" style={{ color: styles.body }}>
      {slide.body}
    </p>
    <div className="mt-auto pt-[4%]">
      {slide.imageLoading ? (
        <div
          className="w-full rounded-lg flex items-center justify-center"
          style={{ aspectRatio: "16/10", background: styles.mutedBg, border: `1px solid ${styles.borderLight}` }}
        >
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: styles.accent }} />
        </div>
      ) : (
        <div
          className="w-full rounded-lg"
          style={{ aspectRatio: "16/10", background: styles.mutedBg, border: `1px solid ${styles.borderLight}` }}
        />
      )}
    </div>
  </>
);

/* ── Text Only Slide ── */
const SlideTextOnly = ({ slide, styles }: { slide: SlideData; styles: Record<string, string> }) => (
  <div className="flex-1 flex flex-col justify-center items-start text-left px-[2%]">
    <div
      className="w-[12%] h-[1%] rounded-full mb-[5%]"
      style={{ background: styles.accent }}
    />
    <h2 className="text-[6%] font-black leading-[1.15] mb-[4%] line-clamp-3" style={{ color: styles.title }}>
      {slide.title}
    </h2>
    <p className="text-[3.6%] leading-[1.7] line-clamp-5" style={{ color: styles.body }}>
      {slide.body}
    </p>
    <div
      className="w-[12%] h-[1%] rounded-full mt-[5%]"
      style={{ background: styles.accent }}
    />
  </div>
);

/* ── Footer ── */
interface FooterProps {
  carousel: CarouselData;
  styles: Record<string, string>;
  footerHandle: string;
  footerBranding: string;
}

const SlideFooter = ({ carousel, styles, footerHandle, footerBranding }: FooterProps) => (
  <div className="flex items-center gap-[2%] mt-[4%] flex-shrink-0">
    {carousel.footer?.showBranding !== false && footerBranding && (
      <span
        className="text-[2.6%] font-semibold px-[3%] py-[1%] rounded-full"
        style={{ background: styles.tagBg, color: styles.tagFg }}
      >
        {footerBranding}
      </span>
    )}
    {carousel.footer?.showHandle !== false && footerHandle && (
      <span
        className="text-[2.6%] font-medium px-[3%] py-[1%] rounded-full"
        style={{
          background: styles.handleBg,
          color: `${styles.title}b3`,
          border: `1px solid ${styles.borderLight}`,
        }}
      >
        {footerHandle}
      </span>
    )}
    {carousel.footer?.showCta !== false && (
      <span className="ml-auto text-[2.6%]" style={{ color: `${styles.body}80` }}>
        {carousel.footer?.ctaText || "Arrasta para o lado →"}
      </span>
    )}
  </div>
);

export default SlidePreview;
