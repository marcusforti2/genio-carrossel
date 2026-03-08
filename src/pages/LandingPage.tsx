import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Palette, Download, Lock, ArrowRight, Star, CheckCircle2, Instagram, ChevronDown, Play, Layers, MousePointerClick } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import heroMockup from "@/assets/hero-mockup.jpg";
import instagramLifestyle from "@/assets/instagram-lifestyle.jpg";
import aiAbstract from "@/assets/ai-abstract.jpg";
import previewSlide1 from "@/assets/preview-slide-1.jpg";
import previewSlide2 from "@/assets/preview-slide-2.jpg";
import previewSlide3 from "@/assets/preview-slide-3.jpg";
import previewSlide4 from "@/assets/preview-slide-4.jpg";

/* ── Animated Counter ── */
const AnimatedCounter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;
    let frame: number;
    const duration = 1500;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [started, target]);

  return <span ref={ref}>{count}{suffix}</span>;
};

/* ── Data ── */
const features = [
  { icon: Sparkles, title: "IA que entende seu negócio", description: "Gere carrosséis completos com textos persuasivos baseados no seu perfil, nicho e tom de voz.", image: aiAbstract },
  { icon: Palette, title: "3 templates profissionais", description: "Editorial, Moderno e Bold — cada slide customizável individualmente com cores, fontes e estilos." },
  { icon: Download, title: "Exporte em alta qualidade", description: "PNG em 3x resolução e PDF otimizado para LinkedIn. Pronto para postar em qualquer plataforma." },
  { icon: Zap, title: "De zero a pronto em 30s", description: "Descreva o tema, escolha o estilo e a IA gera tudo: gancho, slides de conteúdo e CTA final." },
];

const steps = [
  { n: "01", title: "Configure seu perfil", desc: "Defina seu nicho, público-alvo, tom de voz e inimigo em comum.", emoji: "🎯" },
  { n: "02", title: "Gere com IA", desc: "Descreva o tema e escolha o template. A IA cria o carrossel completo.", emoji: "⚡" },
  { n: "03", title: "Personalize e exporte", desc: "Ajuste textos, imagens e cores. Exporte em alta qualidade para o Instagram.", emoji: "🚀" },
];

const testimonials = [
  { name: "Lucas M.", role: "Mentor de Negócios", text: "Economizo 3h por semana com carrosséis que antes eu fazia no Canva.", avatar: "LM" },
  { name: "Ana C.", role: "Social Media", text: "Meus clientes não acreditam que foi feito por IA. A qualidade é absurda.", avatar: "AC" },
  { name: "Pedro R.", role: "Infoprodutor", text: "De longe a melhor ferramenta de carrossel que já usei. Simples e rápida.", avatar: "PR" },
];

const faqs = [
  { q: "Preciso saber design para usar?", a: "Não! A IA gera tudo automaticamente — textos, layout e cores. Você só precisa descrever o tema." },
  { q: "Quais formatos de exportação estão disponíveis?", a: "PNG em alta resolução (3x) e PDF otimizado. Perfeito para Instagram, LinkedIn e outras plataformas." },
  { q: "Quantos carrosséis posso criar?", a: "Não existe limite. Crie quantos carrosséis quiser, sem restrições." },
  { q: "A ferramenta funciona no celular?", a: "Sim! O editor é totalmente responsivo e funciona como um app instalável no seu celular." },
];

const stats = [
  { value: 50, suffix: "+", label: "Clientes ativos" },
  { value: 30, suffix: "s", label: "Para criar um carrossel" },
  { value: 3, suffix: "x", label: "Resolução de exportação" },
];

/* ── FAQ Item ── */
const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-border rounded-xl overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
      >
        <span className="text-sm font-semibold pr-4">{q}</span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>
      <motion.div
        initial={false}
        animate={{ height: open ? "auto" : 0, opacity: open ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="overflow-hidden"
      >
        <p className="px-5 pb-4 text-xs text-muted-foreground leading-relaxed">{a}</p>
      </motion.div>
    </motion.div>
  );
};

/* ── Floating Particle ── */
const FloatingParticle = ({ delay, x, y, size }: { delay: number; x: string; y: string; size: number }) => (
  <motion.div
    className="absolute rounded-full bg-primary/20"
    style={{ left: x, top: y, width: size, height: size }}
    animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: "easeInOut" }}
  />
);

const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 backdrop-blur-2xl bg-background/70">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold tracking-tight">Carousel Spark</span>
            <span className="text-[10px] font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5 uppercase tracking-wider">by Forti</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate("/auth")}>Entrar</Button>
            <Button size="sm" className="text-xs gap-1.5 shadow-lg shadow-primary/20" onClick={() => navigate("/auth")}>
              Começar agora <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section ref={heroRef} className="pt-28 pb-8 px-5 relative min-h-[90vh] flex items-center">
        {/* Particles */}
        <FloatingParticle delay={0} x="10%" y="20%" size={6} />
        <FloatingParticle delay={1} x="85%" y="30%" size={4} />
        <FloatingParticle delay={2} x="70%" y="60%" size={8} />
        <FloatingParticle delay={0.5} x="25%" y="70%" size={5} />
        <FloatingParticle delay={1.5} x="50%" y="15%" size={7} />

        {/* Gradient blobs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[150px] -z-10 animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] -z-10" />

        <div className="max-w-6xl mx-auto w-full">
          <motion.div style={{ y: heroY, opacity: heroOpacity }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Text */}
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6 backdrop-blur-sm"
                >
                  <Lock className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary">Exclusivo Grupo Forti</span>
                </motion.div>

                <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black leading-[1.05] tracking-tight mb-6">
                  Carrosséis que{" "}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-primary via-primary to-[hsl(20,90%,60%)] bg-clip-text text-transparent">vendem</span>
                    <motion.svg
                      className="absolute -bottom-1 left-0 w-full"
                      viewBox="0 0 200 8"
                      fill="none"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ delay: 0.8, duration: 0.8 }}
                    >
                      <motion.path d="M2 6C50 2 150 2 198 6" stroke="hsl(var(--primary))" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
                    </motion.svg>
                  </span>
                  <br />
                  criados por IA.
                </h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed"
                >
                  Transforme qualquer ideia em um carrossel profissional para Instagram em segundos.
                  Textos persuasivos, design impecável, pronto para postar.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex flex-col sm:flex-row items-start gap-3 mb-8"
                >
                  <Button
                    size="lg"
                    className="text-sm gap-2 h-12 px-8 rounded-xl shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                    onClick={() => navigate("/auth")}
                  >
                    <Sparkles className="w-4 h-4" />
                    Criar meu primeiro carrossel
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-sm gap-2 h-12 px-8 rounded-xl border-border/80"
                    onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    <Play className="w-3.5 h-3.5" />
                    Como funciona
                  </Button>
                </motion.div>

                {/* Social proof */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex items-center gap-4"
                >
                  <div className="flex -space-x-2.5">
                    {["LM", "AC", "PR", "JF"].map((initials, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-background bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-[10px] font-bold"
                      >
                        {initials}
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
                </motion.div>
              </motion.div>

              {/* Right - Hero image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.9, delay: 0.3, ease: "easeOut" }}
                className="relative"
              >
                <div className="rounded-2xl overflow-hidden border border-border/80 shadow-2xl shadow-primary/10 relative group">
                  <img
                    src={heroMockup}
                    alt="Carousel Spark - Interface de criação de carrosséis"
                    className="w-full h-auto group-hover:scale-[1.02] transition-transform duration-700"
                    loading="eager"
                  />
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>

                {/* Floating badges */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 1, type: "spring", stiffness: 200 }}
                  className="absolute -bottom-4 -left-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-xl"
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

                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
                  className="absolute -top-3 -right-3 bg-card/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2 shadow-xl"
                >
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-bold">3 Templates</span>
                  </div>
                </motion.div>

                {/* Glow */}
                <div className="absolute -inset-6 -z-10 rounded-3xl bg-primary/5 blur-3xl" />
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-5 h-8 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1"
          >
            <div className="w-1 h-1.5 rounded-full bg-muted-foreground/60" />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Carousel Preview ── */}
      <section className="pb-20 px-5">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-6">
              Exemplo de carrossel gerado pela IA
            </p>
            <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-3 sm:p-5 shadow-2xl shadow-primary/5">
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {[previewSlide1, previewSlide2, previewSlide3, previewSlide4].map((img, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="rounded-lg overflow-hidden relative group cursor-pointer"
                    style={{ aspectRatio: "4/5" }}
                  >
                    <img
                      src={img}
                      alt={`Exemplo de slide ${i + 1}`}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-5 border-t border-border/30">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-3 gap-6 sm:gap-12">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl sm:text-5xl font-black tracking-tight bg-gradient-to-b from-foreground to-muted-foreground bg-clip-text text-transparent">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 uppercase tracking-wider">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-5 border-t border-border/50 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[200px] -z-10" />
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Recursos</p>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                Tudo que você precisa para<br />
                <span className="bg-gradient-to-r from-primary to-[hsl(20,90%,60%)] bg-clip-text text-transparent">criar conteúdo que converte</span>
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
              className="sm:col-span-2 rounded-2xl border border-border bg-card overflow-hidden group hover:border-primary/30 transition-all duration-500"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={aiAbstract}
                  alt="IA avançada"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
              </div>
              <div className="p-6 -mt-8 relative">
                <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-4 shadow-lg shadow-primary/10">
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
                className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-all duration-500 flex flex-col group"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-primary/10 transition-shadow">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="como-funciona" className="py-20 px-5 border-t border-border/50 relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative order-2 lg:order-1"
            >
              <div className="rounded-2xl overflow-hidden border border-border shadow-xl group">
                <img
                  src={instagramLifestyle}
                  alt="Carrossel no Instagram"
                  className="w-full h-auto group-hover:scale-[1.03] transition-transform duration-700"
                  loading="lazy"
                />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-4 -right-4 bg-card/95 backdrop-blur-sm border border-border rounded-xl px-4 py-3 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-[11px] font-bold">Pronto para postar</p>
                    <p className="text-[9px] text-muted-foreground">1080×1350px otimizado</p>
                  </div>
                </div>
              </motion.div>
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/3 blur-3xl" />
            </motion.div>

            {/* Steps */}
            <div className="order-1 lg:order-2">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Como funciona</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
                  3 passos.<br />
                  <span className="bg-gradient-to-r from-primary to-[hsl(20,90%,60%)] bg-clip-text text-transparent">30 segundos.</span>
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
                    className="flex gap-4 items-start group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all">
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

      {/* ── Testimonials ── */}
      <section className="py-20 px-5 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Depoimentos</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Quem usa, <span className="bg-gradient-to-r from-primary to-[hsl(20,90%,60%)] bg-clip-text text-transparent">recomenda</span>
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
                className="rounded-2xl border border-border bg-card p-6 space-y-4 hover:border-primary/20 transition-colors duration-500 group"
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-3.5 h-3.5 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-sm text-foreground leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center text-xs font-bold group-hover:from-primary/30 transition-colors">
                    {t.avatar}
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

      {/* ── FAQ ── */}
      <section className="py-20 px-5 border-t border-border/50">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <p className="text-xs text-primary font-bold uppercase tracking-widest mb-3">Dúvidas</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Perguntas <span className="text-primary">frequentes</span>
            </h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FaqItem key={i} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-5">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 sm:p-14 text-center relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary/8 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />

            <div className="relative">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-background/50 backdrop-blur-sm mb-6">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Acesso exclusivo</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
                  Pronto para criar carrosséis{" "}
                  <span className="bg-gradient-to-r from-primary to-[hsl(20,90%,60%)] bg-clip-text text-transparent">que vendem?</span>
                </h2>
                <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
                  O Carousel Spark foi desenvolvido exclusivamente para os clientes do Grupo Forti.
                  Comece agora e veja seus resultados no Instagram decolarem.
                </p>

                <Button
                  size="lg"
                  className="text-sm gap-2 h-13 px-10 rounded-xl text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow"
                  onClick={() => navigate("/auth")}
                >
                  <Sparkles className="w-5 h-5" />
                  Acessar a plataforma
                </Button>

                <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8">
                  {["Sem limite de carrosséis", "Exportação em alta qualidade", "IA personalizada"].map((t) => (
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

      {/* ── Footer ── */}
      <footer className="border-t border-border/50 py-8 px-5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
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
