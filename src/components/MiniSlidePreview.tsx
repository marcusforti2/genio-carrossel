import { DesignTemplate, FontFamily, TitleSize } from "@/types/carousel";
import { useMemo } from "react";

interface MiniSlidePreviewProps {
  template: DesignTemplate;
  fontFamily: FontFamily;
  titleSize: TitleSize;
  bgMode?: "dark" | "light";
  accentColor?: string;
}

const MiniSlidePreview = ({ template, fontFamily, titleSize, bgMode = "dark", accentColor = "1 83% 55%" }: MiniSlidePreviewProps) => {
  const fontFam = fontFamily === "serif" ? "'Playfair Display', serif" : "'Inter', sans-serif";
  const titleScale = titleSize === "impacto" ? 1.4 : titleSize === "grande" ? 1.15 : 1;
  const isDark = bgMode === "dark";

  const config = useMemo(() => {
    switch (template) {
      case "bold":
        return { showImage: false, layout: "full-text" as const };
      case "moderno":
        return { showImage: true, layout: "card" as const };
      case "minimal":
        return { showImage: false, layout: "minimal" as const };
      case "magazine":
        return { showImage: true, layout: "magazine" as const };
      case "neon":
        return { showImage: false, layout: "neon" as const };
      default:
        return { showImage: true, layout: "split" as const };
    }
  }, [template]);

  const colors = useMemo(() => ({
    bg: isDark ? "hsl(0 0% 5%)" : "hsl(0 0% 96%)",
    title: isDark ? "hsl(0 0% 100%)" : "hsl(0 0% 8%)",
    body: isDark ? "hsl(0 0% 50%)" : "hsl(0 0% 40%)",
    footerBorder: isDark ? "hsl(0 0% 12%)" : "hsl(0 0% 85%)",
    footerText: isDark ? "hsl(0 0% 45%)" : "hsl(0 0% 55%)",
    avatarBg: isDark ? "linear-gradient(135deg, hsl(0 0% 25%), hsl(0 0% 15%))" : "linear-gradient(135deg, hsl(0 0% 80%), hsl(0 0% 70%))",
    avatarBorder: isDark ? "hsl(0 0% 20%)" : "hsl(0 0% 75%)",
    imageBg: isDark ? "linear-gradient(145deg, hsl(0 0% 18%), hsl(0 0% 8%))" : "linear-gradient(145deg, hsl(0 0% 88%), hsl(0 0% 78%))",
    gridOpacity: isDark ? 0.08 : 0.12,
    iconBg: isDark ? "hsl(0 0% 20%)" : "hsl(0 0% 82%)",
    iconBorder: isDark ? "hsl(0 0% 25%)" : "hsl(0 0% 72%)",
    iconStroke: isDark ? "hsl(0 0% 40%)" : "hsl(0 0% 55%)",
    cardOverlay: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.85)",
    cardText: isDark ? "white" : "hsl(0 0% 10%)",
    accent: `hsl(${accentColor})`,
  }), [isDark, accentColor]);

  return (
    <div
      className="rounded-xl overflow-hidden border-2 border-border/60 shadow-lg shadow-black/20"
      style={{
        width: "100%",
        aspectRatio: "4/5",
        position: "relative",
        background: colors.bg,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Image area */}
        {config.showImage && (
          <div
            style={{
              height: config.layout === "split" ? "42%" : "38%",
              background: colors.imageBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: colors.gridOpacity,
                backgroundImage:
                  "linear-gradient(hsl(0 0% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 50%) 1px, transparent 1px)",
                backgroundSize: "16px 16px",
              }}
            />
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: colors.iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${colors.iconBorder}`,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={colors.iconStroke} strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>

            {config.layout === "card" && (
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: 10,
                  right: 10,
                  background: colors.cardOverlay,
                  backdropFilter: "blur(8px)",
                  borderRadius: 6,
                  padding: "6px 10px",
                }}
              >
                <div
                  style={{
                    fontFamily: fontFam,
                    fontSize: Math.max(9, 12 * titleScale),
                    fontWeight: 700,
                    color: colors.cardText,
                    lineHeight: 1.2,
                  }}
                >
                  Título exemplo
                </div>
              </div>
            )}
          </div>
        )}

        {/* Text content area */}
        <div
          style={{
            flex: 1,
            padding: config.layout === "full-text" || config.layout === "neon" ? "16px 14px" : config.layout === "minimal" ? "16px 18px" : config.layout === "magazine" ? "10px 14px" : "10px 14px",
            display: "flex",
            flexDirection: config.layout === "magazine" ? "row" : "column",
            justifyContent: (config.layout === "full-text" || config.layout === "minimal" || config.layout === "neon") ? "center" : "flex-start",
            alignItems: config.layout === "minimal" ? "center" : "stretch",
            textAlign: config.layout === "minimal" ? "center" : "left",
            gap: config.layout === "magazine" ? 8 : 6,
            position: "relative",
          }}
        >
          {/* Neon border frame */}
          {config.layout === "neon" && (
            <div style={{
              position: "absolute",
              inset: 6,
              border: `1px solid ${colors.accent}60`,
              borderRadius: 6,
              boxShadow: `inset 0 0 8px ${colors.accent}15, 0 0 8px ${colors.accent}10`,
              pointerEvents: "none",
            }} />
          )}

          {/* Corner glow for neon */}
          {config.layout === "neon" && (
            <>
              <div style={{ position: "absolute", top: 0, left: 0, width: 40, height: 40, background: `radial-gradient(circle at top left, ${colors.accent}30, transparent 70%)`, pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 40, height: 40, background: `radial-gradient(circle at bottom right, ${colors.accent}20, transparent 70%)`, pointerEvents: "none" }} />
            </>
          )}

          {/* Minimal thin line */}
          {config.layout === "minimal" && (
            <div style={{ width: 20, height: 1.5, background: colors.accent, borderRadius: 999, marginBottom: 4 }} />
          )}

          {/* Magazine accent bars */}
          {config.layout === "magazine" && (
            <div style={{ position: "absolute", top: 8, left: 14, right: 14, display: "flex", gap: 3 }}>
              <div style={{ flex: 3, height: 2, background: colors.accent, borderRadius: 999 }} />
              <div style={{ flex: 1, height: 2, background: `${colors.accent}40`, borderRadius: 999 }} />
            </div>
          )}

          {/* Tag badge — not for minimal */}
          {config.layout !== "minimal" && (
            <div
              style={{
                alignSelf: config.layout === "neon" ? "flex-start" : "flex-start",
                background: config.layout === "neon" ? `${colors.accent}25` : colors.accent,
                color: config.layout === "neon" ? colors.accent : "white",
                fontSize: 6,
                fontWeight: 800,
                padding: "2px 6px",
                borderRadius: config.layout === "neon" ? 99 : 3,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                border: config.layout === "neon" ? `1px solid ${colors.accent}50` : "none",
                marginTop: config.layout === "magazine" ? 8 : 0,
              }}
            >
              INSIGHT
            </div>
          )}

          {/* Magazine layout: two columns */}
          {config.layout === "magazine" ? (
            <>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: 6 }}>
                <div style={{ fontFamily: fontFam, fontSize: Math.max(11, 14 * titleScale), fontWeight: 900, color: colors.title, lineHeight: 1.1 }}>
                  Como criar conteúdo.
                </div>
              </div>
              <div style={{ flex: 1, borderLeft: `1px solid ${colors.footerBorder}`, paddingLeft: 8, display: "flex", flexDirection: "column", justifyContent: "center", marginTop: 6 }}>
                <div style={{ fontSize: 6.5, color: colors.body, lineHeight: 1.45 }}>
                  Corpo de texto com a descrição do conteúdo.
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Title */}
              <div
                style={{
                  fontFamily: fontFam,
                  fontSize: (config.layout === "full-text" || config.layout === "neon")
                    ? Math.max(18, 22 * titleScale)
                    : config.layout === "minimal"
                    ? Math.max(16, 20 * titleScale)
                    : Math.max(13, 16 * titleScale),
                  fontWeight: template === "bold" ? 900 : config.layout === "minimal" ? 300 : 700,
                  color: colors.title,
                  lineHeight: 1.12,
                  letterSpacing: template === "bold" ? "-0.03em" : config.layout === "minimal" ? "-0.02em" : "-0.01em",
                }}
              >
                {config.layout === "full-text" || config.layout === "neon"
                  ? "Texto grande\nque preenche\no slide."
                  : config.layout === "minimal"
                  ? "Elegância\nna simplicidade."
                  : "Como criar\nconteúdo que\nengaja."}
              </div>

              {/* Body text */}
              {config.layout !== "full-text" && config.layout !== "neon" && (
                <div
                  style={{
                    fontSize: 7.5,
                    color: colors.body,
                    lineHeight: 1.45,
                    marginTop: 2,
                  }}
                >
                  Corpo de texto com a descrição do conteúdo do slide aqui.
                </div>
              )}

              {/* Minimal bottom line */}
              {config.layout === "minimal" && (
                <div style={{ width: 20, height: 1.5, background: colors.accent, borderRadius: 999, marginTop: 6 }} />
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "6px 14px 8px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderTop: `1px solid ${colors.footerBorder}`,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: colors.avatarBg,
              border: `1px solid ${colors.avatarBorder}`,
            }}
          />
          <div style={{ fontSize: 7, color: colors.footerText, fontWeight: 500 }}>
            @seuhandle
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniSlidePreview;
