import { motion } from "framer-motion";
import { Lock, MessageCircle, Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CarouselLimitWallProps {
  count: number;
  limit: number;
  onClose?: () => void;
}

const WHATSAPP_NUMBER = "5515998346245";
const WHATSAPP_MESSAGE = encodeURIComponent(
  "Oi Marcus! Usei meus 15 carrosséis grátis no Carousel Spark e quero saber mais sobre o diagnóstico. Topa um bate papo?"
);
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`;

const CarouselLimitWall = ({ count, limit, onClose }: CarouselLimitWallProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex items-center justify-center p-5"
    >
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[150px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] bg-primary/8 rounded-full blur-[120px] -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
        className="max-w-lg w-full text-center"
      >
        {/* Lock icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-8 shadow-xl shadow-primary/10"
        >
          <Lock className="w-9 h-9 text-primary" />
        </motion.div>

        {/* Counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 mb-6"
        >
          <Sparkles className="w-3 h-3 text-primary" />
          <span className="text-xs font-semibold text-primary">{count}/{limit} carrosséis utilizados</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-2xl sm:text-3xl font-black tracking-tight mb-4"
        >
          Seus carrosséis grátis{" "}
          <span className="bg-gradient-to-r from-primary to-[hsl(20,90%,60%)] bg-clip-text text-transparent">acabaram!</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground max-w-md mx-auto mb-4 leading-relaxed"
        >
          Você já criou {count} carrosséis incríveis! Mas sabia que existe algo ainda mais poderoso do que posts?
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 mb-8 text-left"
        >
          <p className="text-sm font-semibold mb-2 text-foreground">💡 Vamos fazer um diagnóstico?</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Você <span className="text-foreground font-semibold">não precisa de mais posts</span> e posso te provar.
            Topa um bate-papo rápido comigo?
          </p>
          <div className="flex items-center gap-2 mt-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center text-sm font-bold">
              MF
            </div>
            <div>
              <p className="text-xs font-bold">Marcus Forti</p>
              <p className="text-[10px] text-muted-foreground">Fundador do Grupo Forti</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col gap-3"
        >
          <Button
            size="lg"
            className="text-sm gap-2 h-13 px-8 rounded-xl text-base shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] transition-all bg-[#25D366] hover:bg-[#20BD5A] w-full"
            onClick={() => window.open(WHATSAPP_URL, "_blank")}
          >
            <MessageCircle className="w-5 h-5" />
            Falar com Marcus no WhatsApp
            <ArrowRight className="w-4 h-4" />
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={onClose}
            >
              Voltar ao dashboard
            </Button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default CarouselLimitWall;
