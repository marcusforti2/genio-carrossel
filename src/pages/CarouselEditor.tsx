import { useState } from "react";
import { CarouselData, SlideData, createDefaultCarousel } from "@/types/carousel";
import SlidePreview from "@/components/SlidePreview";
import EditorSidebar from "@/components/EditorSidebar";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Sparkles, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";

const CarouselEditor = () => {
  const [carousel, setCarousel] = useState<CarouselData>(createDefaultCarousel());
  const [selectedSlide, setSelectedSlide] = useState(0);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const updateSlide = (index: number, slide: SlideData) => {
    const newSlides = [...carousel.slides];
    newSlides[index] = slide;
    setCarousel({ ...carousel, slides: newSlides });
  };

  const deleteSlide = (index: number) => {
    if (carousel.slides.length <= 1) return;
    const newSlides = carousel.slides.filter((_, i) => i !== index);
    setCarousel({ ...carousel, slides: newSlides });
    if (selectedSlide >= newSlides.length) setSelectedSlide(newSlides.length - 1);
  };

  const addSlide = () => {
    const newSlide: SlideData = {
      id: crypto.randomUUID(),
      type: "content",
      title: "Novo título impactante.",
      body: "Desenvolva seu argumento aqui. Seja provocativo, direto e autêntico.",
      hasImage: true,
    };
    setCarousel({ ...carousel, slides: [...carousel.slides, newSlide] });
    setSelectedSlide(carousel.slides.length);
  };

  const goToSlide = (dir: -1 | 1) => {
    const next = selectedSlide + dir;
    if (next >= 0 && next < carousel.slides.length) setSelectedSlide(next);
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="text-sm font-bold tracking-tight font-display">Carrossel AI</h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="text-xs gap-1.5 text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            Perfil
          </Button>
          <Button variant="outline" size="sm" className="text-xs gap-1.5">
            <Download className="w-3.5 h-3.5" />
            Exportar
          </Button>
          <Button size="sm" className="text-xs gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Gerar com IA
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={signOut}>
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <EditorSidebar
            carousel={carousel}
            selectedSlideIndex={selectedSlide}
            onSelectSlide={setSelectedSlide}
            onUpdateSlide={updateSlide}
            onDeleteSlide={deleteSlide}
            onAddSlide={addSlide}
            onUpdateCarousel={setCarousel}
          />
        </div>

        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center relative bg-background">
          {/* Slide preview */}
          <div className="relative" style={{ width: "340px" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={carousel.slides[selectedSlide]?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl overflow-hidden shadow-2xl shadow-primary/5 border border-border/50"
              >
                <SlidePreview
                  slide={carousel.slides[selectedSlide]}
                  carousel={carousel}
                  slideIndex={selectedSlide}
                  totalSlides={carousel.slides.length}
                />
              </motion.div>
            </AnimatePresence>

            {/* Nav arrows */}
            <div className="absolute -left-14 top-1/2 -translate-y-1/2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => goToSlide(-1)}
                disabled={selectedSlide === 0}
                className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground disabled:opacity-20"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
            </div>
            <div className="absolute -right-14 top-1/2 -translate-y-1/2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => goToSlide(1)}
                disabled={selectedSlide === carousel.slides.length - 1}
                className="rounded-full w-9 h-9 text-muted-foreground hover:text-foreground disabled:opacity-20"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Dots */}
            <div className="flex items-center justify-center gap-1.5 mt-6">
              {carousel.slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedSlide(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === selectedSlide
                      ? "w-6 h-1.5 bg-primary"
                      : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarouselEditor;
