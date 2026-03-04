import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Palette, Download, Lock, ArrowRight, Star, CheckCircle2, MousePointerClick, Instagram } from "lucide-react";
import { motion } from "framer-motion";
import heroMockup from "@/assets/hero-mockup.jpg";
import instagramLifestyle from "@/assets/instagram-lifestyle.jpg";
import aiAbstract from "@/assets/ai-abstract.jpg";
import previewSlide1 from "@/assets/preview-slide-1.jpg";
import previewSlide2 from "@/assets/preview-slide-2.jpg";
import previewSlide3 from "@/assets/preview-slide-3.jpg";
import previewSlide4 from "@/assets/preview-slide-4.jpg";

const features = [
  {
    icon: Sparkles,
    title: "IA que entende seu negócio",
    description: "Gere carrosséis completos com textos persuasivos baseados no seu perfil, nicho e tom de voz.",
    image: aiAbstract,
  },
  {
    icon: Palette,
    title: "3 templates profissionais",
    description: "Editorial, Moderno e Bold — cada slide customizável individualmente com cores, fontes e estilos.",
  },
  {
    icon: Download,
    title: "Exporte em alta qualidade",
    description: "PNG em 3x resolução e PDF otimizado para LinkedIn. Pronto para postar em qualquer plataforma.",
  },
  {
    icon: Zap,
    title: "De zero a pronto em 30s",
    description: "Descreva o tema, escolha o estilo e a IA gera tudo: gancho, slides de conteúdo e CTA final.",
  },
];

const steps = [
  { n: "01", title: "Configure seu perfil", desc: "Defina seu nicho, público-alvo, tom de voz e inimigo em comum.", emoji: "🎯" },
  { n: "02", title: "Gere com IA", desc: "Descreva o tema e escolha o template. A IA cria o carrossel completo.", emoji: "⚡" },
  { n: "03", title: "Personalize e exporte", desc: "Ajuste textos, imagens e cores. Exporte em alta qualidade para o Instagram.", emoji: "🚀" },
];

const testimonials = [
  { name: "Lucas M.", role: "Mentor de Negócios", text: "Economizo 3h por semana com carrosséis que antes eu fazia no Canva." },
  { name: "Ana C.", role: "Social Media", text: "Meus clientes não acreditam que foi feito por IA. A qualidade é absurda." },
  { name: "Pedro R.", role: "Infoprodutor", text: "De longe a melhor ferramenta de carrossel que já usei. Simples e rápida." },
];

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight">Carousel Spark</span>
            <span className="text-[10px] font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5 uppercase tracking-wider">by Forti</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/auth")}>
              Entrar
            </Button>
            <Button size="sm" className="text-xs gap-1.5" onClick={() => navigate("/auth")}>
              Começar agora <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-8 px-5 relative">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px] -z-10" />
        
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6">
                <Lock className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium text-primary">Exclusivo Grupo Forti</span>
              </div>

              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                Carrosséis que{" "}
                <span className="text-primary relative">
                  vendem
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                    <path d="M2 6C50 2 150 2 198 6" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
                  </svg>
                </span>
                <br />
                criados por IA.
              </h1>

              <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
                Transforme qualquer ideia em um carrossel profissional para Instagram em segundos.
                Textos persuasivos, design impecável, pronto para postar.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3 mb-8">
                <Button size="lg" className="text-sm gap-2 h-12 px-8 rounded-xl" onClick={() => navigate("/auth")}>
                  <Sparkles className="w-4 h-4" />
                  Criar meu primeiro carrossel
                </Button>
                <Button variant="outline" size="lg" className="text-sm gap-2 h-12 px-8 rounded-xl" onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}>
                  Como funciona
                </Button>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["🟢", "🔵", "🟣", "🟠"].map((_, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-secondary flex items-center justify-center text-xs">
                      {["LM", "AC", "PR", "JF"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="w-3 h-3 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Usado por +50 clientes Forti</p>
                </div>
              </div>
            </motion.div>

            {/* Right - Hero image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-2xl overflow-hidden border border-border shadow-2xl shadow-primary/10">
                <img
                  src={heroMockup}
                  alt="Carousel Spark - Interface de criação de carrosséis"
                  className="w-full h-auto"
                  loading="eager"
                />
              </div>
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
                className="absolute -bottom-4 -left-4 bg-card border border-border rounded-xl px-4 py-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold">30 segundos</p>
                    <p className="text-[9px] text-muted-foreground">para criar um carrossel</p>
                  </div>
                </div>
              </motion.div>
              {/* Glow */}
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Carousel Preview */}
      <section className="pb-16 px-5 -mt-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Exemplo de carrossel gerado pela IA
            </p>
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-5 shadow-2xl shadow-primary/5">
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {[previewSlide1, previewSlide2, previewSlide3, previewSlide4].map((img, i) => (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden relative group"
                    style={{ aspectRatio: "4/5" }}
                  >
                    <img
                      src={img}
                      alt={`Exemplo de slide ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Logos / Trust bar */}
      <section className="py-12 px-5 border-t border-border/30">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">Ferramenta desenvolvida para</p>
          <div className="flex items-center justify-center gap-8 sm:gap-16 opacity-40">
            <span className="text-lg sm:text-2xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>GRUPO FORTI</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm sm:text-lg font-bold tracking-tight text-muted-foreground">Clientes Premium</span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-sm sm:text-lg font-bold tracking-tight text-muted-foreground hidden sm:inline">Aceleração</span>
          </div>
        </div>
      </section>

      {/* Features - with image */}
      <section className="py-20 px-5 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Recursos</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                Tudo que você precisa para<br />
                <span className="text-primary">criar conteúdo que converte</span>
              </h2>
            </motion.div>
          </div>

          {/* Feature bento grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Main feature - spans 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="sm:col-span-2 rounded-2xl border border-border bg-card overflow-hidden group hover:border-primary/30 transition-all"
            >
              <div className="h-48 overflow-hidden">
                <img
                  src={aiAbstract}
                  alt="IA avançada"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              </div>
              <div className="p-6">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-bold mb-2">{features[0].title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{features[0].description}</p>
              </div>
            </motion.div>

            {/* Other features */}
            {features.slice(1).map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i + 1) * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-colors flex flex-col"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - with lifestyle image */}
      <section id="como-funciona" className="py-20 px-5 border-t border-border/50 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative order-2 lg:order-1"
            >
              <div className="rounded-2xl overflow-hidden border border-border shadow-xl">
                <img
                  src={instagramLifestyle}
                  alt="Carrossel no Instagram"
                  className="w-full h-auto"
                  loading="lazy"
                />
              </div>
              {/* Floating stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-4 -right-4 bg-card border border-border rounded-xl px-4 py-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-[11px] font-bold">Pronto para postar</p>
                    <p className="text-[9px] text-muted-foreground">1080×1350px otimizado</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Steps */}
            <div className="order-1 lg:order-2">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Como funciona</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: "'Inter', sans-serif" }}>
                  3 passos.<br />
                  <span className="text-primary">30 segundos.</span>
                </h2>
                <p className="text-sm text-muted-foreground mb-10">Do zero ao carrossel pronto para postar.</p>
              </motion.div>

              <div className="space-y-6">
                {steps.map((step, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    className="flex gap-4 items-start"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{step.emoji}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{step.n}</span>
                        <h3 className="text-sm font-bold">{step.title}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-5 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Depoimentos</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              Quem usa, <span className="text-primary">recomenda</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border border-border bg-card p-6 space-y-4"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold">
                    {t.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                    <p className="text-xs font-bold">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 sm:p-14 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-60 h-60 bg-primary/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary/8 rounded-full blur-[60px] translate-y-1/2 -translate-x-1/3" />
            
            <div className="relative">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-background/50 mb-6">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Acesso exclusivo</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                  Pronto para criar carrosséis{" "}
                  <span className="text-primary">que vendem?</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
                  O Carousel Spark foi desenvolvido exclusivamente para os clientes do Grupo Forti.
                  Comece agora e veja seus resultados no Instagram decolarem.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button size="lg" className="text-sm gap-2 h-13 px-10 rounded-xl text-base" onClick={() => navigate("/auth")}>
                    <Sparkles className="w-5 h-5" />
                    Acessar a plataforma
                  </Button>
                </div>

                <div className="flex items-center justify-center gap-6 mt-8">
                  {[
                    "Sem limite de carrosséis",
                    "Exportação em alta qualidade",
                    "IA personalizada",
                  ].map((t) => (
                    <div key={t} className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                      <span className="text-[11px] text-muted-foreground">{t}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-primary-foreground" />
            </div>
            <span className="text-xs font-bold">Carousel Spark</span>
            <span className="text-[9px] text-muted-foreground">by Forti</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} Grupo Forti. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
