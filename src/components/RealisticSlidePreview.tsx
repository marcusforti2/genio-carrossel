import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { DesignTemplate, FontFamily, TitleSize } from "@/types/carousel";
import { User } from "lucide-react";

interface RealisticSlidePreviewProps {
  template: DesignTemplate;
  fontFamily: FontFamily;
  titleSize: TitleSize;
  bgMode: "dark" | "light";
  accentColor: string;
  profileName?: string;
  profileHandle?: string;
  avatarUrl?: string;
  sampleImageUrl?: string;
}

// Fixed internal resolution for realistic rendering
const SLIDE_W = 1080;
const SLIDE_H = 1350;

const SAMPLE_SLIDES = [
  { type: "cover" as const, title: "Como criar conteúdo que gera impacto real.", body: "", showImage: true },
  { type: "content" as const, title: "O segredo que poucos contam.", body: "Conteúdo de valor real conecta emoção com estratégia de forma intencional.", showImage: true },
  { type: "content" as const, title: "Pare de seguir fórmulas.", body: "Autenticidade vende mais que qualquer template pronto do mercado.", showImage: false },
  { type: "cta" as const, title: "Gostou? Me siga para mais.", body: "", showImage: false },
];

function useColors(bgMode: "dark" | "light", accentColor: string) {
  return useMemo(() => {
    const isDark = bgMode === "dark";
    return {
      bg: isDark ? "hsl(0 0% 6.5%)" : "hsl(0 0% 96%)",
      title: isDark ? "hsl(0 0% 100%)" : "hsl(0 0% 8%)",
      body: isDark ? "hsl(0 0% 70%)" : "hsl(0 0% 35%)",
      accent: `hsl(${accentColor})`,
      tagBg: `hsl(${accentColor})`,
      footerBorder: isDark ? "hsl(0 0% 12%)" : "hsl(0 0% 85%)",
      footerText: isDark ? "hsl(0 0% 50%)" : "hsl(0 0% 55%)",
      imageBg: isDark
        ? "linear-gradient(145deg, hsl(0 0% 18%), hsl(0 0% 8%))"
        : "linear-gradient(145deg, hsl(0 0% 88%), hsl(0 0% 78%))",
      overlayFrom: isDark ? "rgba(20,20,20,0.15)" : "rgba(240,240,240,0.15)",
      overlayTo: isDark ? "rgba(17,17,17,0.92)" : "rgba(245,245,245,0.92)",
      counterBg: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
      counterText: isDark ? "rgba(255,255,255,0.8)" : "rgba(0,0,0,0.7)",
      mutedBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      borderLight: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    };
  }, [bgMode, accentColor]);
}

interface MiniSlideProps {
  slideIndex: number;
  type: "cover" | "content" | "cta";
  title: string;
  body: string;
  showImage: boolean;
  template: DesignTemplate;
  fontFam: string;
  titleScale: number;
  colors: ReturnType<typeof useColors>;
  profileName: string;
  profileHandle: string;
  avatarUrl?: string;
  sampleImageUrl?: string;
  totalSlides: number;
}

// This component renders at 1080x1350 internally and scales down
const MiniSlide = ({
  slideIndex, type, title, body, showImage, template, fontFam, titleScale,
  colors, profileName, profileHandle, avatarUrl, sampleImageUrl, totalSlides,
}: MiniSlideProps) => {
  const isCover = type === "cover";
  const isCta = type === "cta";

  const hasImage = showImage && !isCta && (template === "editorial" || template === "moderno" || template === "magazine");

  const renderEditorialContent = () => (
    <>
      {hasImage && (
        <div style={{ height: isCover ? "50%" : "42%", position: "relative", overflow: "hidden", background: sampleImageUrl && slideIndex === 0 ? "transparent" : colors.imageBg }}>
          {sampleImageUrl && slideIndex === 0 ? (
            <>
              <img src={sampleImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${colors.overlayFrom}, ${colors.overlayTo})` }} />
            </>
          ) : hasImage ? (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={colors.body} strokeWidth="1" opacity={0.25}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          ) : null}
        </div>
      )}

      <div style={{
        flex: 1, padding: "60px 65px 0",
        display: "flex", flexDirection: "column", justifyContent: hasImage ? "flex-start" : "center", gap: 24,
      }}>
        {/* Tag */}
        <div style={{
          alignSelf: "flex-start", background: colors.tagBg, color: "white",
          fontSize: 28, fontWeight: 800, padding: "8px 24px", borderRadius: 6,
          letterSpacing: 2, textTransform: "uppercase",
        }}>
          INSIGHT
        </div>

        {/* Title */}
        <div style={{
          fontFamily: fontFam, fontSize: Math.max(72, 90 * titleScale),
          fontWeight: template === "bold" ? 900 : 700, color: colors.title,
          lineHeight: 1.1, letterSpacing: "-0.02em",
        }}>
          {title}
        </div>

        {/* Body */}
        {body && (
          <div style={{ fontSize: 36, color: colors.body, lineHeight: 1.55, maxWidth: "90%" }}>
            {body}
          </div>
        )}
      </div>
    </>
  );

  const renderBoldContent = () => (
    <div style={{
      flex: 1, padding: "80px 65px", display: "flex", flexDirection: "column",
      justifyContent: "center", gap: 28,
    }}>
      <div style={{
        alignSelf: "flex-start", background: colors.tagBg, color: "white",
        fontSize: 28, fontWeight: 800, padding: "8px 24px", borderRadius: 6,
        letterSpacing: 2, textTransform: "uppercase",
      }}>
        INSIGHT
      </div>
      <div style={{
        fontFamily: fontFam, fontSize: Math.max(100, 120 * titleScale),
        fontWeight: 900, color: colors.title, lineHeight: 1.05,
        letterSpacing: "-0.03em",
      }}>
        {title}
      </div>
    </div>
  );

  const renderMinimalContent = () => (
    <div style={{
      flex: 1, padding: "80px 65px", display: "flex", flexDirection: "column",
      justifyContent: "center", alignItems: "center", textAlign: "center", gap: 20,
    }}>
      <div style={{ width: 60, height: 3, background: colors.accent, borderRadius: 99 }} />
      <div style={{
        fontFamily: fontFam, fontSize: Math.max(80, 100 * titleScale),
        fontWeight: 300, color: colors.title, lineHeight: 1.12,
        letterSpacing: "-0.02em",
      }}>
        {title}
      </div>
      {body && (
        <div style={{ fontSize: 34, color: colors.body, lineHeight: 1.55, maxWidth: "85%" }}>
          {body}
        </div>
      )}
      <div style={{ width: 60, height: 3, background: colors.accent, borderRadius: 99, marginTop: 10 }} />
    </div>
  );

  const renderNeonContent = () => (
    <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
      <div style={{
        position: "absolute", inset: 30, border: `2px solid ${colors.accent}60`,
        borderRadius: 16, boxShadow: `inset 0 0 20px ${colors.accent}15, 0 0 20px ${colors.accent}10`,
        pointerEvents: "none",
      }} />
      <div style={{ position: "absolute", top: 0, left: 0, width: 200, height: 200, background: `radial-gradient(circle at top left, ${colors.accent}30, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{
        flex: 1, padding: "80px 75px", display: "flex", flexDirection: "column",
        justifyContent: "center", gap: 28, position: "relative", zIndex: 1,
      }}>
        <div style={{
          alignSelf: "flex-start", background: `${colors.accent}25`, color: colors.accent,
          fontSize: 26, fontWeight: 800, padding: "8px 22px", borderRadius: 99,
          letterSpacing: 2, textTransform: "uppercase", border: `1px solid ${colors.accent}50`,
        }}>
          INSIGHT
        </div>
        <div style={{
          fontFamily: fontFam, fontSize: Math.max(90, 110 * titleScale),
          fontWeight: 700, color: colors.title, lineHeight: 1.08, letterSpacing: "-0.02em",
        }}>
          {title}
        </div>
      </div>
    </div>
  );

  const renderMagazineContent = () => (
    <>
      {hasImage && (
        <div style={{ height: "38%", position: "relative", overflow: "hidden", background: sampleImageUrl && slideIndex === 0 ? "transparent" : colors.imageBg }}>
          {sampleImageUrl && slideIndex === 0 ? (
            <>
              <img src={sampleImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${colors.overlayFrom}, ${colors.overlayTo})` }} />
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke={colors.body} strokeWidth="1" opacity={0.25}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
          <div style={{ position: "absolute", top: 20, left: 65, right: 65, display: "flex", gap: 8 }}>
            <div style={{ flex: 3, height: 4, background: colors.accent, borderRadius: 999 }} />
            <div style={{ flex: 1, height: 4, background: `${colors.accent}40`, borderRadius: 999 }} />
          </div>
        </div>
      )}
      <div style={{ flex: 1, padding: "50px 65px", display: "flex", flexDirection: "row", gap: 40 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{
            alignSelf: "flex-start", background: colors.tagBg, color: "white",
            fontSize: 24, fontWeight: 800, padding: "6px 18px", borderRadius: 4,
            letterSpacing: 2, textTransform: "uppercase", marginBottom: 20,
          }}>
            INSIGHT
          </div>
          <div style={{
            fontFamily: fontFam, fontSize: Math.max(64, 80 * titleScale),
            fontWeight: 900, color: colors.title, lineHeight: 1.08,
          }}>
            {title}
          </div>
        </div>
        {body && (
          <div style={{ flex: 1, borderLeft: `2px solid ${colors.footerBorder}`, paddingLeft: 40, display: "flex", alignItems: "center" }}>
            <div style={{ fontSize: 32, color: colors.body, lineHeight: 1.55 }}>
              {body}
            </div>
          </div>
        )}
      </div>
    </>
  );

  const renderCta = () => (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: 80, gap: 30,
    }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt="" style={{
          width: 140, height: 140, borderRadius: "50%", objectFit: "cover",
          border: `4px solid ${colors.accent}`,
        }} />
      ) : (
        <div style={{
          width: 140, height: 140, borderRadius: "50%", background: `${colors.accent}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: `4px solid ${colors.accent}55`,
        }}>
          <User style={{ width: 60, height: 60, color: `${colors.accent}aa` }} />
        </div>
      )}
      <div style={{ fontFamily: fontFam, fontSize: 52, fontWeight: 700, color: colors.title, textAlign: "center" }}>
        {profileName || "Seu Nome"}
      </div>
      <div style={{ fontSize: 34, color: colors.body }}>
        {profileHandle ? `@${profileHandle}` : "@seuhandle"}
      </div>
      <div style={{
        marginTop: 10, padding: "16px 60px", borderRadius: 99,
        background: colors.accent, fontSize: 30, fontWeight: 700,
        color: "white", textTransform: "uppercase", letterSpacing: 2,
      }}>
        SEGUIR
      </div>
    </div>
  );

  const renderContent = () => {
    if (isCta) return renderCta();
    switch (template) {
      case "bold": return renderBoldContent();
      case "minimal": return renderMinimalContent();
      case "neon": return renderNeonContent();
      case "magazine": return renderMagazineContent();
      default: return renderEditorialContent();
    }
  };

  return (
    <div style={{
      width: SLIDE_W, height: SLIDE_H, background: colors.bg,
      display: "flex", flexDirection: "column", position: "relative",
      fontFamily: "'Inter', sans-serif", overflow: "hidden",
    }}>
      {/* Slide counter */}
      <div style={{
        position: "absolute", top: 28, right: 35, zIndex: 10,
        background: colors.counterBg, backdropFilter: "blur(8px)",
        borderRadius: 20, padding: "6px 18px",
        fontSize: 26, fontWeight: 600, color: colors.counterText,
      }}>
        {slideIndex + 1}/{totalSlides}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {renderContent()}
      </div>

      {/* Footer */}
      <div style={{
        padding: "28px 65px", display: "flex", alignItems: "center", gap: 20,
        borderTop: `2px solid ${colors.footerBorder}`,
      }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: `${colors.accent}40` }} />
        )}
        <div style={{ fontSize: 30, color: colors.footerText, fontWeight: 500 }}>
          {profileHandle ? `${profileHandle}` : "@seuhandle"}
        </div>
      </div>
    </div>
  );
};

const ScaledSlideCard = ({ children }: { children: React.ReactNode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / SLIDE_W);
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        aspectRatio: `${SLIDE_W}/${SLIDE_H}`,
        overflow: "hidden",
        borderRadius: 6,
        position: "relative",
      }}
    >
      <div style={{
        width: SLIDE_W,
        height: SLIDE_H,
        position: "absolute",
        top: 0,
        left: 0,
        transformOrigin: "top left",
        transform: `scale(${scale})`,
      }}>
        {children}
      </div>
    </div>
  );
};

const RealisticSlidePreview = ({
  template, fontFamily, titleSize, bgMode, accentColor,
  profileName = "", profileHandle = "", avatarUrl, sampleImageUrl,
}: RealisticSlidePreviewProps) => {
  const fontFam = fontFamily === "serif" ? "'Playfair Display', serif" : "'Inter', sans-serif";
  const titleScale = titleSize === "impacto" ? 1.35 : titleSize === "grande" ? 1.15 : 1;
  const colors = useColors(bgMode, accentColor);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
      {SAMPLE_SLIDES.map((slide, i) => (
        <ScaledSlideCard key={i}>
          <MiniSlide
            slideIndex={i}
            type={slide.type}
            title={slide.title}
            body={slide.body}
            showImage={slide.showImage}
            template={template}
            fontFam={fontFam}
            titleScale={titleScale}
            colors={colors}
            profileName={profileName}
            profileHandle={profileHandle}
            avatarUrl={avatarUrl}
            sampleImageUrl={sampleImageUrl}
            totalSlides={SAMPLE_SLIDES.length}
          />
        </ScaledSlideCard>
      ))}
    </div>
  );
};

export default RealisticSlidePreview;
