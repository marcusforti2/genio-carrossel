import { DesignTemplate, FontFamily, TitleSize } from "@/types/carousel";
import { useMemo } from "react";

interface MiniSlidePreviewProps {
  template: DesignTemplate;
  fontFamily: FontFamily;
  titleSize: TitleSize;
}

const MiniSlidePreview = ({ template, fontFamily, titleSize }: MiniSlidePreviewProps) => {
  const fontFam = fontFamily === "serif" ? "'Playfair Display', serif" : "'Inter', sans-serif";
  const titleScale = titleSize === "impacto" ? 1.35 : titleSize === "grande" ? 1.15 : 1;
  const baseTitleSize = 14 * titleScale;

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

  return (
    <div
      className="rounded-lg overflow-hidden border border-border"
      style={{
        width: "100%",
        aspectRatio: "4/5",
        background: "hsl(0 0% 6.5%)",
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image area */}
      {config.showImage && (
        <div
          style={{
            height: config.layout === "split" ? "45%" : "40%",
            background: "linear-gradient(135deg, hsl(0 0% 15%), hsl(0 0% 10%))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              background: "hsl(0 0% 25%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="hsl(0 0% 45%)" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          {config.layout === "card" && (
            <div
              style={{
                position: "absolute",
                bottom: 6,
                left: 8,
                right: 8,
                background: "rgba(0,0,0,0.6)",
                borderRadius: 4,
                padding: "4px 6px",
              }}
            >
              <div
                style={{
                  fontFamily: fontFam,
                  fontSize: Math.max(7, baseTitleSize * 0.6),
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

      {/* Text area */}
      <div
        style={{
          flex: 1,
          padding: config.layout === "full-text" ? "12px 10px" : "8px 10px",
          display: "flex",
          flexDirection: "column",
          justifyContent: config.layout === "full-text" ? "center" : "flex-start",
          gap: 4,
        }}
      >
        {/* Tag */}
        <div
          style={{
            alignSelf: "flex-start",
            background: "hsl(var(--primary))",
            color: "white",
            fontSize: 5,
            fontWeight: 700,
            padding: "1px 4px",
            borderRadius: 2,
            letterSpacing: 0.5,
            textTransform: "uppercase",
          }}
        >
          INSIGHT
        </div>

        {/* Title */}
        <div
          style={{
            fontFamily: fontFam,
            fontSize: config.layout === "full-text" ? baseTitleSize * 1.3 : baseTitleSize,
            fontWeight: template === "bold" ? 900 : 700,
            color: "hsl(0 0% 100%)",
            lineHeight: 1.15,
            letterSpacing: template === "bold" ? "-0.02em" : "0",
          }}
        >
          {config.layout === "full-text"
            ? "Texto grande que preenche o slide."
            : "Como criar conteúdo que engaja."}
        </div>

        {/* Body */}
        {config.layout !== "full-text" && (
          <div
            style={{
              fontSize: 6,
              color: "hsl(0 0% 55%)",
              lineHeight: 1.4,
              marginTop: 2,
            }}
          >
            Corpo de texto com a descrição do conteúdo do slide.
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "4px 10px 6px",
          display: "flex",
          alignItems: "center",
          gap: 4,
          borderTop: "1px solid hsl(0 0% 12%)",
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "hsl(0 0% 20%)",
          }}
        />
        <div style={{ fontSize: 5, color: "hsl(0 0% 50%)" }}>@handle</div>
      </div>
    </div>
  );
};

export default MiniSlidePreview;
