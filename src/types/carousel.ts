export interface SlideData {
  id: string;
  type: "cover" | "content";
  title: string;
  body: string;
  hasImage: boolean;
  imageUrl?: string;
  imagePrompt?: string;
  imageLoading?: boolean;
}

export interface CarouselTheme {
  bgMode: "dark" | "light";
  accentColor: string; // HSL string like "1 83% 55%"
  accentName: string;
}

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
