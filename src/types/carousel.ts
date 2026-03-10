export type CtaBgStyle = "theme" | "accent" | "image";
export type SlideBgStyle = "theme" | "color" | "fullimage";

export interface SlideStyleOverride {
  template?: DesignTemplate;
  fontFamily?: FontFamily;
  titleSize?: TitleSize;
  bgMode?: "dark" | "light";
  accentColor?: string;
  accentName?: string;
  ctaBgStyle?: CtaBgStyle;
  bgStyle?: SlideBgStyle;
  bgColor?: string;
}

export type MediaType = "image" | "video";

export interface SlideData {
  id: string;
  type: "cover" | "content" | "cta";
  title: string;
  body: string;
  hasImage: boolean;
  imageUrl?: string;
  imagePrompt?: string;
  imageLoading?: boolean;
  mediaType?: MediaType;
  videoUrl?: string;
  videoThumbnail?: string;
  styleOverride?: SlideStyleOverride;
}

export type DesignTemplate = "editorial" | "moderno" | "bold" | "minimal";
export type FontFamily = "serif" | "sans";
export type TitleSize = "normal" | "grande" | "impacto";
export type BodySize = "pequeno" | "medio" | "grande";

export interface DesignStyle {
  template: DesignTemplate;
  fontFamily: FontFamily;
  titleSize: TitleSize;
  bodySize: BodySize;
}

export const DESIGN_TEMPLATES: { id: DesignTemplate; name: string; description: string }[] = [
  { id: "editorial", name: "Editorial", description: "Títulos grandes em serif, layout texto + imagem separados. Estilo profissional." },
  { id: "moderno", name: "Moderno", description: "Sans-serif clean, layout equilibrado com cards sofisticados." },
  { id: "bold", name: "Bold", description: "Texto gigante que preenche o slide. Máximo impacto visual." },
  { id: "minimal", name: "Minimal", description: "Centralizado, muito espaço branco, tipografia elegante e limpa." },
];

export const FONT_FAMILIES: { id: FontFamily; name: string; preview: string }[] = [
  { id: "serif", name: "Serif", preview: "Playfair Display" },
  { id: "sans", name: "Sans-serif", preview: "Inter" },
];

export const TITLE_SIZES: { id: TitleSize; name: string }[] = [
  { id: "normal", name: "Normal" },
  { id: "grande", name: "Grande" },
  { id: "impacto", name: "Impacto" },
];

export const BODY_SIZES: { id: BodySize; name: string }[] = [
  { id: "pequeno", name: "Pequeno" },
  { id: "medio", name: "Médio" },
  { id: "grande", name: "Grande" },
];

export interface CarouselTheme {
  bgMode: "dark" | "light";
  accentColor: string;
  accentName: string;
  bgColor?: string;
  bgColorName?: string;
}

export const BG_COLOR_PRESETS = [
  { name: "Escuro", color: "0 0% 6.5%", mode: "dark" as const },
  { name: "Claro", color: "0 0% 96%", mode: "light" as const },
  { name: "Cinza", color: "0 0% 22%", mode: "dark" as const },
  { name: "Vermelho", color: "1 70% 35%", mode: "dark" as const },
  { name: "Laranja", color: "25 85% 40%", mode: "dark" as const },
  { name: "Amarelo", color: "45 90% 50%", mode: "light" as const },
  { name: "Verde", color: "142 60% 30%", mode: "dark" as const },
  { name: "Azul", color: "217 70% 35%", mode: "dark" as const },
  { name: "Roxo", color: "263 55% 35%", mode: "dark" as const },
  { name: "Rosa", color: "330 60% 40%", mode: "dark" as const },
];

export interface FooterConfig {
  showBranding: boolean;
  showHandle: boolean;
  showCta: boolean;
  ctaText: string;
}

export interface CarouselData {
  id: string;
  profileName: string;
  profileHandle: string;
  brandingText: string;
  brandingSubtext: string;
  avatarUrl: string;
  slides: SlideData[];
  theme: CarouselTheme;
  footer: FooterConfig;
  designStyle: DesignStyle;
}

export const ACCENT_PRESETS = [
  { name: "Vermelho", color: "1 83% 55%" },
  { name: "Laranja", color: "25 95% 53%" },
  { name: "Amarelo", color: "45 93% 47%" },
  { name: "Verde", color: "142 71% 45%" },
  { name: "Azul", color: "217 91% 60%" },
  { name: "Roxo", color: "263 70% 50%" },
  { name: "Rosa", color: "330 81% 60%" },
  { name: "Branco", color: "0 0% 90%" },
];

export const createDefaultCarousel = (): CarouselData => ({
  id: crypto.randomUUID(),
  profileName: "",
  profileHandle: "",
  brandingText: "",
  brandingSubtext: "",
  avatarUrl: "",
  theme: {
    bgMode: "dark",
    accentColor: "1 83% 55%",
    accentName: "Vermelho",
  },
  footer: {
    showBranding: true,
    showHandle: true,
    showCta: true,
    ctaText: "Arrasta para o lado >",
  },
  designStyle: {
    template: "bold",
    fontFamily: "sans",
    titleSize: "grande",
    bodySize: "grande",
  },
  slides: [
    {
      id: crypto.randomUUID(),
      type: "cover",
      title: "Como o LinkedIn está criando uma geração de profissionais cansados e culpados.",
      body: "",
      hasImage: true,
    },
    {
      id: crypto.randomUUID(),
      type: "content",
      title: "A vitrine nunca fecha.",
      body: "O LinkedIn transformou carreira em reality show corporativo. Promoções viraram anúncios públicos. Cursos viraram medalhas. Cada conquista é exibida. Cada silêncio parece atraso. Você não trabalha mais em paz, você performa progresso.",
      hasImage: true,
    },
    {
      id: crypto.randomUUID(),
      type: "content",
      title: "A comparação nunca foi tão injusta.",
      body: "Você compara seus bastidores com o palco dos outros. Enquanto você lida com dúvida, insegurança e cansaço, o feed entrega cargos novos, metas batidas e \"muito feliz em compartilhar\".",
      hasImage: true,
    },
    {
      id: crypto.randomUUID(),
      type: "content",
      title: "Performance virou identidade.",
      body: "Não é mais \"o que você faz\". É \"quem você é\". Seu valor parece proporcional à sua produtividade. Se você desacelera, sente que está perdendo relevância. Descansar começa a parecer fracasso.",
      hasImage: false,
    },
  ],
});
