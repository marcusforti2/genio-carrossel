import { SlideData, CarouselData, DesignStyle } from "@/types/carousel";
import { User, Loader2 } from "lucide-react";
import { useMemo, useRef, useState, useEffect } from "react";

interface SlidePreviewProps {
  slide: SlideData;
  carousel: CarouselData;
  slideIndex: number;
  totalSlides: number;
}

// Render at fixed 1080x1350 and scale to fit container
const SLIDE_W = 1080;
const SLIDE_H = 1350;

const SlidePreview = ({ slide, carousel, slideIndex, totalSlides }: SlidePreviewProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setScale(w / SLIDE_W);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const isCover = slide.type === "cover";
  const theme = carousel.theme || { bgMode: "dark" as const, accentColor: "1 83% 55%", accentName: "Vermelho" };
  const ds: DesignStyle = carousel.designStyle || { template: "editorial", fontFamily: "serif", titleSize: "grande" };

  const fontFam = ds.fontFamily === "serif" ? "'Playfair Display', serif" : "'Inter', sans-serif";
  const titleScale = ds.titleSize === "impacto" ? 1.35 : ds.titleSize === "grande" ? 1.15 : 1;

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
      <img src={carousel.avatarUrl} alt="Avatar" className="rounded-full object-cover" style={{ width: 80, height: 80, border: `3px solid ${styles.accent}` }} />
    ) : (
      <div className="rounded-full flex items-center justify-center" style={{ width: 80, height: 80, background: `${styles.accent}33`, border: `3px solid ${styles.accent}55` }}>
        <User style={{ width: 36, height: 36, color: `${styles.accent}aa` }} />
      </div>
    );

  const footerHandle = carousel.profileHandle || "";
  const footerBranding = carousel.brandingText || "";

  const shared = { slide, carousel, styles, fontFam, titleScale, Avatar, footerHandle, footerBranding };

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden" style={{ aspectRatio: "4/5" }}>
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          background: styles.bg,
          fontFamily: fontFam,
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* Header bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "48px 56px 0" }}>
          <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: styles.branding }}>
            {carousel.brandingSubtext || carousel.brandingText}
          </p>
          <p style={{ fontSize: 24, color: styles.branding }}>{footerHandle}</p>
          <div style={{ background: styles.counterBg, color: styles.counterText, borderRadius: 999, padding: "6px 20px", fontSize: 22, fontWeight: 500, backdropFilter: "blur(8px)" }}>
            {slideIndex + 1}/{totalSlides}
          </div>
        </div>

        {isCover ? (
          <CoverSlide {...shared} />
        ) : ds.template === "editorial" ? (
          <EditorialContent {...shared} />
        ) : ds.template === "bold" ? (
          <BoldContent {...shared} />
        ) : (
          <ModernoContent {...shared} />
        )}
      </div>
    </div>
  );
};

/* ── Shared props ── */
interface TemplateProps {
  slide: SlideData;
  carousel: CarouselData;
  styles: Record<string, string>;
  fontFam: string;
  titleScale: number;
  Avatar: React.FC;
  footerHandle: string;
  footerBranding: string;
}

/* ═══════════════════════════════════════════
   COVER SLIDE
   ═══════════════════════════════════════════ */
const CoverSlide = ({ slide, carousel, styles, fontFam, titleScale, Avatar, footerHandle }: TemplateProps) => (
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%", position: "relative" }}>
    {slide.imageUrl && <img src={slide.imageUrl} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
    <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${styles.overlayFrom}, ${styles.overlayTo})` }} />
    <div style={{ position: "relative", zIndex: 10, padding: "0 75px 120px", textAlign: "left" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 40 }}>
        <Avatar />
        <div>
          <p style={{ fontSize: 32, fontWeight: 700, color: styles.title, lineHeight: 1.2 }}>
            {carousel.profileName} <span style={{ color: styles.accent }}>✓</span>
          </p>
          <p style={{ fontSize: 26, color: styles.body, marginTop: 4 }}>{footerHandle}</p>
        </div>
      </div>
      <h1 style={{ fontSize: 68 * titleScale, fontWeight: 900, lineHeight: 1.1, color: styles.title, fontFamily: fontFam, WebkitLineClamp: 4, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {slide.title}
      </h1>
      {slide.body && (
        <p style={{ fontSize: 32, lineHeight: 1.5, color: styles.body, marginTop: 24, WebkitLineClamp: 3, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {slide.body}
        </p>
      )}
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   EDITORIAL TEMPLATE
   ═══════════════════════════════════════════ */
const EditorialContent = ({ slide, styles, carousel, fontFam, titleScale, footerHandle, footerBranding }: TemplateProps) => {
  const hasImg = slide.hasImage && (slide.imageUrl || slide.imageLoading);
  const titleFs = hasImg ? 56 * titleScale : 72 * titleScale;
  const bodyFs = hasImg ? 34 : 38;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "150px 65px 55px", overflow: "hidden" }}>
      <h2 style={{ fontSize: titleFs, fontWeight: 900, lineHeight: 1.12, color: styles.title, fontFamily: fontFam, flexShrink: 0, WebkitLineClamp: 5, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {slide.title}
      </h2>

      {slide.body && !hasImg && (
        <p style={{ fontSize: bodyFs, lineHeight: 1.5, color: styles.accent, marginTop: 40, fontFamily: fontFam, flexShrink: 0, WebkitLineClamp: 8, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {slide.body}
        </p>
      )}

      {hasImg && (
        <div style={{ marginTop: "auto", paddingTop: 40, flexShrink: 0 }}>
          {slide.imageLoading ? (
            <div style={{ width: "100%", aspectRatio: "16/9", background: styles.mutedBg, border: `1px solid ${styles.borderLight}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 className="animate-spin" style={{ width: 48, height: 48, color: styles.accent }} />
            </div>
          ) : (
            <img src={slide.imageUrl} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12 }} />
          )}
        </div>
      )}

      {slide.body && hasImg && (
        <p style={{ fontSize: bodyFs, lineHeight: 1.45, fontWeight: 700, color: styles.title, marginTop: 40, fontFamily: fontFam, flexShrink: 0, WebkitLineClamp: 6, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {slide.body}
        </p>
      )}

      {!hasImg && <div style={{ flex: 1 }} />}

      <SlideFooter carousel={carousel} styles={styles} footerHandle={footerHandle} footerBranding={footerBranding} />
    </div>
  );
};

/* ═══════════════════════════════════════════
   MODERNO TEMPLATE
   ═══════════════════════════════════════════ */
const ModernoContent = ({ slide, styles, carousel, fontFam, titleScale, footerHandle, footerBranding }: TemplateProps) => (
  <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "160px 75px 55px", overflow: "hidden" }}>
    <h2 style={{ fontSize: 52 * titleScale, fontWeight: 800, lineHeight: 1.18, color: styles.title, fontFamily: fontFam, marginBottom: 28, flexShrink: 0, WebkitLineClamp: 3, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
      {slide.title}
    </h2>

    {slide.body && (
      <p style={{ fontSize: 32, lineHeight: 1.6, color: styles.body, fontFamily: fontFam, flexShrink: 0, WebkitLineClamp: 7, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {slide.body}
      </p>
    )}

    {slide.hasImage && (slide.imageUrl || slide.imageLoading) && (
      <div style={{ marginTop: "auto", paddingTop: 40 }}>
        {slide.imageLoading ? (
          <div style={{ width: "100%", aspectRatio: "16/10", background: styles.mutedBg, border: `1px solid ${styles.borderLight}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Loader2 className="animate-spin" style={{ width: 48, height: 48, color: styles.accent }} />
          </div>
        ) : (
          <img src={slide.imageUrl} alt="" style={{ width: "100%", aspectRatio: "16/10", objectFit: "cover", borderRadius: 12 }} />
        )}
      </div>
    )}

    {!slide.hasImage && !slide.imageUrl && (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ width: 120, height: 8, borderRadius: 999, background: styles.accent }} />
      </div>
    )}

    <SlideFooter carousel={carousel} styles={styles} footerHandle={footerHandle} footerBranding={footerBranding} />
  </div>
);

/* ═══════════════════════════════════════════
   BOLD TEMPLATE
   ═══════════════════════════════════════════ */
const BoldContent = ({ slide, styles, carousel, fontFam, titleScale, footerHandle, footerBranding }: TemplateProps) => {
  const hasImg = slide.hasImage && (slide.imageUrl || slide.imageLoading);
  const isTextOnly = !hasImg;
  const bg = isTextOnly ? styles.accent : styles.bg;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "150px 65px 55px", overflow: "hidden", background: bg }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <h2 style={{ fontSize: (isTextOnly ? 82 : 62) * titleScale, fontWeight: 900, lineHeight: 1.08, color: isTextOnly ? styles.tagFg : styles.title, fontFamily: fontFam, WebkitLineClamp: 6, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {slide.title}
        </h2>
        {slide.body && (
          <p style={{ fontSize: isTextOnly ? 36 : 32, lineHeight: 1.5, marginTop: 48, fontWeight: 500, color: isTextOnly ? `${styles.tagFg}cc` : styles.body, fontFamily: fontFam, WebkitLineClamp: 7, display: "-webkit-box", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {slide.body}
          </p>
        )}
      </div>

      {hasImg && (
        <div style={{ flexShrink: 0, paddingTop: 28 }}>
          {slide.imageLoading ? (
            <div style={{ width: "100%", aspectRatio: "16/9", background: styles.mutedBg, border: `1px solid ${styles.borderLight}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Loader2 className="animate-spin" style={{ width: 48, height: 48, color: styles.accent }} />
            </div>
          ) : (
            <img src={slide.imageUrl} alt="" style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12 }} />
          )}
        </div>
      )}

      <SlideFooter carousel={carousel} styles={styles} footerHandle={footerHandle} footerBranding={footerBranding} invertColors={isTextOnly} />
    </div>
  );
};

/* ── Footer ── */
interface FooterProps {
  carousel: CarouselData;
  styles: Record<string, string>;
  footerHandle: string;
  footerBranding: string;
  invertColors?: boolean;
}

const SlideFooter = ({ carousel, styles, footerHandle, footerBranding, invertColors }: FooterProps) => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 40, flexShrink: 0 }}>
    {carousel.footer?.showBranding !== false && footerBranding && (
      <span style={{ fontSize: 24, fontWeight: 600, padding: "8px 24px", borderRadius: 999, background: invertColors ? "rgba(255,255,255,0.2)" : styles.tagBg, color: styles.tagFg }}>
        {footerBranding}
      </span>
    )}
    {carousel.footer?.showHandle !== false && footerHandle && (
      <span style={{ fontSize: 24, fontWeight: 500, padding: "8px 24px", borderRadius: 999, background: invertColors ? "rgba(255,255,255,0.15)" : styles.handleBg, color: invertColors ? "rgba(255,255,255,0.8)" : `${styles.title}b3`, border: `1px solid ${invertColors ? "rgba(255,255,255,0.2)" : styles.borderLight}` }}>
        {footerHandle}
      </span>
    )}
    {carousel.footer?.showCta !== false && (
      <span style={{ marginLeft: "auto", fontSize: 24, color: invertColors ? "rgba(255,255,255,0.5)" : `${styles.body}80` }}>
        {carousel.footer?.ctaText || "Arrasta para o lado →"}
      </span>
    )}
  </div>
);

export default SlidePreview;
