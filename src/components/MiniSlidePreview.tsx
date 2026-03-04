import { DesignTemplate, FontFamily, TitleSize } from "@/types/carousel";
import { useMemo } from "react";

interface MiniSlidePreviewProps {
  template: DesignTemplate;
  fontFamily: FontFamily;
  titleSize: TitleSize;
}

const MiniSlidePreview = ({ template, fontFamily, titleSize }: MiniSlidePreviewProps) => {
  const fontFam = fontFamily === "serif" ? "'Playfair Display', serif" : "'Inter', sans-serif";
  const titleScale = titleSize === "impacto" ? 1.4 : titleSize === "grande" ? 1.15 : 1;

  const config = useMemo(() => {
    switch (template) {
      case "bold":
        return { showImage: false, layout: "full-text" as const };
      case "moderno":
        return { showImage: true, layout: "card" as const };
      default:
        return { showImage: true, layout: "split" as const };
    }
  }, [template]);

  // Internal render at fixed resolution, scale down
  const W = 270;
  const H = 337; // 4:5

  return (
    <div
      className="rounded-xl overflow-hidden border-2 border-border/60 shadow-lg shadow-black/20"
      style={{
        width: "100%",
        aspectRatio: "4/5",
        position: "relative",
        background: "hsl(0 0% 5%)",
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
              background: "linear-gradient(145deg, hsl(0 0% 18%), hsl(0 0% 8%))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative grid pattern */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                opacity: 0.08,
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
                background: "hsl(0 0% 20%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid hsl(0 0% 25%)",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(0 0% 40%)" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>

            {/* Card overlay for moderno */}
            {config.layout === "card" && (
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: 10,
                  right: 10,
                  background: "rgba(0,0,0,0.7)",
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
                    color: "white",
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
            padding: config.layout === "full-text" ? "16px 14px" : "10px 14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: config.layout === "full-text" ? "center" : "flex-start",
            gap: 6,
          }}
        >
          {/* Tag badge */}
          <div
            style={{
              alignSelf: "flex-start",
              background: "hsl(var(--primary))",
              color: "white",
              fontSize: 6,
              fontWeight: 800,
              padding: "2px 6px",
              borderRadius: 3,
              letterSpacing: 0.8,
              textTransform: "uppercase",
            }}
          >
            INSIGHT
          </div>

          {/* Title */}
          <div
            style={{
              fontFamily: fontFam,
              fontSize: config.layout === "full-text"
                ? Math.max(18, 22 * titleScale)
                : Math.max(13, 16 * titleScale),
              fontWeight: template === "bold" ? 900 : 700,
              color: "hsl(0 0% 100%)",
              lineHeight: 1.12,
              letterSpacing: template === "bold" ? "-0.03em" : "-0.01em",
            }}
          >
            {config.layout === "full-text"
              ? "Texto grande\nque preenche\no slide."
              : "Como criar\nconteúdo que\nengaja."}
          </div>

          {/* Body text */}
          {config.layout !== "full-text" && (
            <div
              style={{
                fontSize: 7.5,
                color: "hsl(0 0% 50%)",
                lineHeight: 1.45,
                marginTop: 2,
              }}
            >
              Corpo de texto com a descrição do conteúdo do slide aqui.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "6px 14px 8px",
            display: "flex",
            alignItems: "center",
            gap: 6,
            borderTop: "1px solid hsl(0 0% 12%)",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: "linear-gradient(135deg, hsl(0 0% 25%), hsl(0 0% 15%))",
              border: "1px solid hsl(0 0% 20%)",
            }}
          />
          <div style={{ fontSize: 7, color: "hsl(0 0% 45%)", fontWeight: 500 }}>
            @seuhandle
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiniSlidePreview;