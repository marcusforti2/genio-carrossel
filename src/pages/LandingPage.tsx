import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, Palette, Download, Lock, ArrowRight, Instagram, Star } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Sparkles,
    title: "IA que entende seu negócio",
    description: "Gere carrosséis completos com textos persuasivos baseados no seu perfil, nicho e tom de voz.",
  },
  {
    icon: Palette,
    title: "3 templates profissionais",
    description: "Editorial, Moderno e Bold — cada slide customizável individualmente com cores, fontes e estilos.",
  },
  {
    icon: Download,
    title: "Exporte em alta qualidade",
    description: "PNG em 1080×1350px otimizado para Instagram. Exporte slides individuais ou o carrossel completo.",
  },
  {
    icon: Zap,
    title: "De zero a pronto em 30s",
    description: "Descreva o tema, escolha o estilo e a IA gera tudo: gancho, slides de conteúdo e CTA final.",
  },
];

const steps = [
  { n: "01", title: "Configure seu perfil", desc: "Defina seu nicho, público-alvo, tom de voz e inimigo em comum." },
  { n: "02", title: "Gere com IA", desc: "Descreva o tema e escolha o template. A IA cria o carrossel completo." },
  { n: "03", title: "Personalize e exporte", desc: "Ajuste textos, imagens e cores. Exporte em alta qualidade para o Instagram." },
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
      <section className="pt-32 pb-20 px-5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-8">
              <Lock className="w-3 h-3 text-primary" />
              <span className="text-xs font-medium text-primary">Exclusivo para clientes do Grupo Forti</span>
            </div>

            <h1
              className="text-4xl sm:text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              Carrosséis que{" "}
              <span className="text-primary">vendem</span>
              <br />
              criados por IA.
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Transforme qualquer ideia em um carrossel profissional para Instagram em segundos.
              Textos persuasivos, design impecável, pronto para postar.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="text-sm gap-2 h-12 px-8 rounded-xl" onClick={() => navigate("/auth")}>
                <Sparkles className="w-4 h-4" />
                Criar meu primeiro carrossel
              </Button>
              <Button variant="outline" size="lg" className="text-sm gap-2 h-12 px-8 rounded-xl" onClick={() => document.getElementById("como-funciona")?.scrollIntoView({ behavior: "smooth" })}>
                Como funciona
              </Button>
            </div>
          </motion.div>

          {/* Fake preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-16 relative"
          >
            <div className="rounded-2xl border border-border bg-card p-3 sm:p-5 shadow-2xl shadow-primary/5">
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {[
                  { title: "O custo de aquisição é sentença.", type: "cover" },
                  { title: "Não venda preço. Venda retorno.", type: "content" },
                  { title: "Performance virou identidade.", type: "content" },
                  { title: "Arrasta e descobre.", type: "cta" },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden"
                    style={{ aspectRatio: "4/5", background: i === 2 ? "hsl(var(--primary))" : "hsl(0 0% 6.5%)" }}
                  >
                    <div className="h-full flex flex-col justify-end p-3 sm:p-4">
                      <p
                        className="text-[10px] sm:text-xs font-bold leading-tight"
                        style={{ color: i === 2 ? "#fff" : "hsl(0 0% 90%)" }}
                      >
                        {s.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Glow */}
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-primary/5 blur-2xl" />
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-5 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              Tudo que você precisa para criar conteúdo que converte
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 hover:border-primary/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold mb-2">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-20 px-5 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              3 passos. 30 segundos.
            </h2>
            <p className="text-sm text-muted-foreground mt-3">Do zero ao carrossel pronto para postar.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center"
              >
                <div className="text-4xl font-black text-primary/20 mb-3">{step.n}</div>
                <h3 className="text-sm font-bold mb-2">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Exclusive banner */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-background/50 mb-6">
                <Star className="w-3 h-3 text-primary fill-primary" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Acesso exclusivo</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black mb-4 tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
                Ferramenta exclusiva para{" "}
                <span className="text-primary">clientes Forti</span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
                O Carousel Spark foi desenvolvido internamente para os clientes do Grupo Forti.
                Uma ferramenta profissional de criação de conteúdo que não está disponível ao público.
              </p>
              <Button size="lg" className="text-sm gap-2 h-12 px-8 rounded-xl" onClick={() => navigate("/auth")}>
                Acessar a plataforma
                <ArrowRight className="w-4 h-4" />
              </Button>
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