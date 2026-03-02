export interface SlideData {
  id: string;
  type: "cover" | "content";
  title: string;
  body: string;
  hasImage: boolean;
  imageUrl?: string;
}

export interface CarouselData {
  id: string;
  profileName: string;
  profileHandle: string;
  brandingText: string;
  brandingSubtext: string;
  avatarUrl: string;
  slides: SlideData[];
}

export const createDefaultCarousel = (): CarouselData => ({
  id: crypto.randomUUID(),
  profileName: "",
  profileHandle: "",
  brandingText: "",
  brandingSubtext: "",
  avatarUrl: "",
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
