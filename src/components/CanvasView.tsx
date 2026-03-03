import { CarouselData } from "@/types/carousel";
import SlidePreview from "@/components/SlidePreview";
import { motion } from "framer-motion";

interface CanvasViewProps {
  carousel: CarouselData;
  selectedSlide: number;
  onSelectSlide: (index: number) => void;
}

const CanvasView = ({ carousel, selectedSlide, onSelectSlide }: CanvasViewProps) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-w-6xl mx-auto">
        {carousel.slides.map((slide, i) => (
          <motion.button
            key={slide.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => onSelectSlide(i)}
            className={`rounded-lg overflow-hidden border-2 transition-all hover:scale-[1.02] ${
              i === selectedSlide
                ? "border-primary shadow-lg shadow-primary/20"
                : "border-border/50 hover:border-muted-foreground/40"
            }`}
          >
            <SlidePreview
              slide={slide}
              carousel={carousel}
              slideIndex={i}
              totalSlides={carousel.slides.length}
            />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default CanvasView;
