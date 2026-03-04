import { useMemo } from "react";
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

interface SlideCardProps {
  type: "cover" | "content" | "cta";
  title: string;
  body?: string;
  template: DesignTemplate;
  fontFam: string;
  titleScale: number;
  colors: ReturnType<typeof useColors>;
  accentColor: string;
  profileName: string;
  profileHandle: string;
  avatarUrl?: string;
  showImage: boolean;
  sampleImageUrl?: string;
}

function useColors(bgMode: "dark" | "light", accentColor: string) {
  return useMemo(() => {
    const isDark = bgMode === "dark";
    return {
      bg: isDark ? "hsl(0 0% 6.5%)" : "hsl(0 0% 96%)",
      title: isDark ? "hsl(0 0% 100%)" : "hsl(0 0% 8%)",
      body: isDark ? "hsl(0 0% 55%)" : "hsl(0 0% 42%)",
      accent: `hsl(${accentColor})`,
      footerBorder: isDark ? "hsl(0 0% 12%)" : "hsl(0 0% 85%)",
      footerText: isDark ? "hsl(0 0% 45%)" : "hsl(0 0% 55%)",
      imageBg: isDark
        ? "linear-gradient(145deg, hsl(0 0% 18%), hsl(0 0% 8%))"
        : "linear-gradient(145deg, hsl(0 0% 88%), hsl(0 0% 78%))",
      overlayFrom: isDark ? "rgba(20,20,20,0.1)" : "rgba(240,240,240,0.1)",
      overlayTo: isDark ? "rgba(17,17,17,0.88)" : "rgba(245,245,245,0.88)",
      cardOverlay: isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.85)",
      cardText: isDark ? "white" : "hsl(0 0% 10%)",
      ctaBg: isDark ? "hsl(0 0% 8%)" : "hsl(0 0% 94%)",
      neonGlow: `hsl(${accentColor} / 0.15)`,
    };
  }, [bgMode, accentColor]);
}

const SAMPLE_SLIDES = [
  { type: "cover" as const, title: "Como criar conteúdo que gera impacto real.", body: "" },
  { type: "content" as const, title: "O segredo que poucos contam.", body: "Conteúdo de valor real conecta emoção com estratégia." },
  { type: "content" as const, title: "Pare de seguir fórmulas.", body: "Autenticidade vende mais que qualquer template." },
  { type: "cta" as const, title: "Gostou? Me siga para mais.", body: "" },
];

const SlideCard = ({
  type, title, body, template, fontFam, titleScale, colors,
  accentColor, profileName, profileHandle, avatarUrl, showImage, sampleImageUrl,
}: SlideCardProps) => {
  const isCover = type === "cover";
  const isCta = type === "cta";

  const hasImage = showImage && !isCta && (template === "editorial" || template === "moderno" || template === "magazine");

  return (
    <div
      style={{
        width: "100%",
        aspectRatio: "4/5",
        background: colors.bg,
        borderRadius: 6,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        border: `1px solid ${colors.footerBorder}`,
      }}
    >
      {/* Neon frame */}
      {template === "neon" && (
        <div style={{
          position: "absolute", inset: 3, border: `1px solid ${colors.accent}50`,
          borderRadius: 4, boxShadow: `inset 0 0 6px ${colors.neonGlow}, 0 0 6px ${colors.neonGlow}`,
          pointerEvents: "none", zIndex: 2,
        }} />
      )}

      {/* Image area */}
      {hasImage && (
        <div style={{
          height: "38%", position: "relative", overflow: "hidden",
          background: sampleImageUrl ? "transparent" : colors.imageBg,
        }}>
          {sampleImageUrl ? (
            <>
              <img src={sampleImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{
                position: "absolute", inset: 0,
                background: `linear-gradient(to bottom, ${colors.overlayFrom}, ${colors.overlayTo})`,
              }} />
            </>
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={colors.body} strokeWidth="1.5" opacity={0.4}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}

          {/* Moderno card overlay */}
          {template === "moderno" && (
            <div style={{
              position: "absolute", bottom: 4, left: 5, right: 5,
              background: colors.cardOverlay, backdropFilter: "blur(6px)",
              borderRadius: 4, padding: "3px 5px",
            }}>
              <div style={{ fontFamily: fontFam, fontSize: Math.max(5, 6.5 * titleScale), fontWeight: 700, color: colors.cardText, lineHeight: 1.2 }}>
                {title.slice(0, 30)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CTA special layout */}
      {isCta ? (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", padding: 8, gap: 4,
        }}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" style={{ width: 18, height: 18, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${colors.accent}` }} />
          ) : (
            <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${colors.accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User style={{ width: 9, height: 9, color: `${colors.accent}aa` }} />
            </div>
          )}
          <div style={{ fontFamily: fontFam, fontSize: Math.max(5, 6 * titleScale), fontWeight: 700, color: colors.title, textAlign: "center", lineHeight: 1.2 }}>
            {profileName || "Seu Nome"}
          </div>
          <div style={{ fontSize: 4.5, color: colors.body, textAlign: "center" }}>
            {profileHandle ? `@${profileHandle}` : "@seuhandle"}
          </div>
          <div style={{
            marginTop: 2, padding: "2px 8px", borderRadius: 99,
            background: colors.accent, fontSize: 4.5, fontWeight: 700,
            color: "white", textTransform: "uppercase", letterSpacing: 0.5,
          }}>
            SEGUIR
          </div>
        </div>
      ) : (
        /* Text content */
        <div style={{
          flex: 1, padding: template === "bold" || template === "neon" ? "8px 7px" : template === "minimal" ? "8px 8px" : "5px 7px",
          display: "flex", flexDirection: template === "magazine" ? "row" : "column",
          justifyContent: (template === "bold" || template === "minimal" || template === "neon") ? "center" : "flex-start",
          alignItems: template === "minimal" ? "center" : "stretch",
          textAlign: template === "minimal" ? "center" : "left",
          gap: 3, position: "relative", zIndex: 1,
        }}>
          {/* Tag */}
          {template !== "minimal" && isCover && (
            <div style={{
              alignSelf: "flex-start",
              background: template === "neon" ? `${colors.accent}25` : colors.accent,
              color: template === "neon" ? colors.accent : "white",
              fontSize: 3.5, fontWeight: 800, padding: "1px 4px",
              borderRadius: template === "neon" ? 99 : 2,
              letterSpacing: 0.6, textTransform: "uppercase",
              border: template === "neon" ? `1px solid ${colors.accent}50` : "none",
            }}>
              INSIGHT
            </div>
          )}

          {/* Minimal line */}
          {template === "minimal" && (
            <div style={{ width: 12, height: 1, background: colors.accent, borderRadius: 99, marginBottom: 2 }} />
          )}

          {/* Magazine two-col */}
          {template === "magazine" && !hasImage ? (
            <>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontFamily: fontFam, fontSize: Math.max(6, 7.5 * titleScale), fontWeight: 900, color: colors.title, lineHeight: 1.1 }}>
                  {title.slice(0, 25)}
                </div>
              </div>
              <div style={{ flex: 1, borderLeft: `1px solid ${colors.footerBorder}`, paddingLeft: 5, display: "flex", alignItems: "center" }}>
                <div style={{ fontSize: 4, color: colors.body, lineHeight: 1.4 }}>
                  {body?.slice(0, 60) || "Corpo de texto..."}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Title */}
              <div style={{
                fontFamily: fontFam,
                fontSize: (template === "bold" || template === "neon")
                  ? Math.max(8, 10 * titleScale)
                  : template === "minimal"
                  ? Math.max(7, 9 * titleScale)
                  : Math.max(6, 7.5 * titleScale),
                fontWeight: template === "bold" ? 900 : template === "minimal" ? 300 : 700,
                color: colors.title,
                lineHeight: 1.15,
                letterSpacing: template === "bold" ? "-0.03em" : "-0.01em",
              }}>
                {title.slice(0, 40)}
              </div>

              {/* Body */}
              {body && template !== "bold" && template !== "neon" && (
                <div style={{ fontSize: 4.5, color: colors.body, lineHeight: 1.4 }}>
                  {body.slice(0, 50)}...
                </div>
              )}

              {/* Minimal bottom line */}
              {template === "minimal" && (
                <div style={{ width: 12, height: 1, background: colors.accent, borderRadius: 99, marginTop: 3 }} />
              )}
            </>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{
        padding: "3px 7px 4px", display: "flex", alignItems: "center", gap: 3,
        borderTop: `1px solid ${colors.footerBorder}`,
      }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: 8, height: 8, borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: `${colors.accent}40` }} />
        )}
        <div style={{ fontSize: 4, color: colors.footerText, fontWeight: 500 }}>
          {profileHandle ? `@${profileHandle}` : "@seuhandle"}
        </div>
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, width: "100%" }}>
      {SAMPLE_SLIDES.map((slide, i) => (
        <SlideCard
          key={i}
          type={slide.type}
          title={slide.title}
          body={slide.body}
          template={template}
          fontFam={fontFam}
          titleScale={titleScale}
          colors={colors}
          accentColor={accentColor}
          profileName={profileName}
          profileHandle={profileHandle}
          avatarUrl={avatarUrl}
          showImage={i < 2}
          sampleImageUrl={i === 0 ? sampleImageUrl : undefined}
        />
      ))}
    </div>
  );
};

export default RealisticSlidePreview;
