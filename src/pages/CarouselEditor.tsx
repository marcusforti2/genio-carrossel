import React, { useState, useEffect, useRef } from "react";
import { CarouselData, SlideData, createDefaultCarousel } from "@/types/carousel";
import SlidePreview from "@/components/SlidePreview";
import EditorSidebar from "@/components/EditorSidebar";
import GenerateDialog from "@/components/GenerateDialog";
import ExportButtons from "@/components/ExportButtons";
import CaptionButton from "@/components/CaptionButton";
import CanvasView from "@/components/CanvasView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Sparkles, User, LogOut, LayoutGrid, Monitor, Menu, X, Save, Check, Loader2 as Loader, ArrowLeft, Pencil, Palette, UserCircle, Type } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjectAutosave, Project } from "@/hooks/useProjectAutosave";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { toast } from "sonner";

const CarouselEditor = () => {
  const [carousel, setCarousel] = useState<CarouselData>(createDefaultCarousel());
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "canvas">("editor");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<"slide" | "design" | "profile" | "footer">("slide");
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();

  const {
    projectId,
    projectTitle,
    setProjectTitle,
    saveStatus,
    loadProject,
    newProject,
  } = useProjectAutosave(carousel, caption);

  // Auto-load profile data
  useEffect(() => {
    if (!user || profileLoaded) return;
    const loadProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setCarousel((prev) => ({
          ...prev,
          profileName: data.display_name || prev.profileName,
          profileHandle: data.handle || prev.profileHandle,
          brandingText: data.branding_text || prev.brandingText,
          brandingSubtext: data.branding_subtext || prev.brandingSubtext,
          avatarUrl: data.avatar_url || "",
        }));
      }
      setProfileLoaded(true);
    };
    loadProfile();
  }, [user, profileLoaded]);

  // Load project from URL
  useEffect(() => {
    const projectParam = searchParams.get("project");
    if (projectParam && user) {
      (async () => {
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectParam)
          .single();
        if (data && !error) {
          const project: Project = {
            id: data.id,
            title: data.title,
            data: data.data as any,
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
          handleLoadProject(project);
        } else {
          toast.error("Projeto não encontrado");
        }
        setInitialLoading(false);
      })();
    } else {
      setInitialLoading(false);
    }
  }, [user]);

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

  const handleAIGenerated = (slides: SlideData[], newCaption: string, designStyle?: any, theme?: any) => {
    setCarousel({
      ...carousel,
      slides,
      ...(designStyle ? { designStyle } : {}),
      ...(theme ? { theme } : {}),
    });
    setSelectedSlide(0);
    setCaption(newCaption);
  };

  const handleLoadProject = (project: Project) => {
    const data = loadProject(project);
    if (data) {
      const restored = data as any;
      const cap = restored._caption || "";
      delete restored._caption;
      setCarousel({ ...createDefaultCarousel(), ...restored });
      setCaption(cap);
      setSelectedSlide(0);
    }
  };

  const handleNewProject = () => {
    newProject();
    setCarousel(createDefaultCarousel());
    setCaption("");
    setSelectedSlide(0);
  };

  const goToSlide = (dir: -1 | 1) => {
    const next = selectedSlide + dir;
    if (next >= 0 && next < carousel.slides.length) setSelectedSlide(next);
  };

  const handleCanvasSelect = (index: number) => {
    setSelectedSlide(index);
    setViewMode("editor");
  };

  const openMobileTab = (tab: "slide" | "design" | "profile" | "footer") => {
    setMobileTab(tab);
    setMobileSidebarOpen(true);
  };

  const SaveStatusIndicator = () => (
    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
      {saveStatus === "saving" && <><Loader className="w-3 h-3 animate-spin" /> Salvando...</>}
      {saveStatus === "saved" && <><Check className="w-3 h-3 text-green-500" /> Salvo</>}
      {saveStatus === "error" && <span className="text-destructive">Erro ao salvar</span>}
    </span>
  );

  const sidebarContent = (
    <EditorSidebar
      carousel={carousel}
      selectedSlideIndex={selectedSlide}
      onSelectSlide={(i) => { setSelectedSlide(i); setMobileSidebarOpen(false); }}
      onUpdateSlide={updateSlide}
      onDeleteSlide={deleteSlide}
      onAddSlide={addSlide}
      onUpdateCarousel={setCarousel}
      initialTab={isMobile ? mobileTab : undefined}
    />
  );

  // Swipe handling for mobile
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only swipe if horizontal movement > 50px and mostly horizontal
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) goToSlide(-1);
      else goToSlide(1);
    }
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background">
      {/* Header */}
      <header className="h-12 sm:h-14 border-b border-border flex items-center justify-between px-2 sm:px-5 gap-1 sm:gap-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="h-7 text-xs bg-transparent border-none px-1 w-20 sm:w-40 font-semibold truncate"
            placeholder="Nome do projeto"
          />
          <SaveStatusIndicator />
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* View toggle - desktop */}
          <div className="hidden sm:flex items-center border border-border rounded-md">
            <Button
              variant={viewMode === "editor" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-[10px] rounded-r-none"
              onClick={() => setViewMode("editor")}
            >
              <Monitor className="w-3 h-3" />
            </Button>
            <Button
              variant={viewMode === "canvas" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 px-2 text-[10px] rounded-l-none"
              onClick={() => setViewMode("canvas")}
            >
              <LayoutGrid className="w-3 h-3" />
            </Button>
          </div>

          <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="text-xs gap-1 text-muted-foreground h-8 px-2 hidden sm:flex">
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Perfil</span>
          </Button>
          <CaptionButton carousel={carousel} caption={caption} onCaptionChange={setCaption} />
          <ExportButtons carousel={carousel} />
          <Button size="sm" className="text-xs gap-1 h-8 px-2 sm:px-3" onClick={() => setGenerateOpen(true)}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gerar com IA</span>
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 text-muted-foreground" onClick={signOut}>
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Desktop Sidebar */}
        {!isMobile && viewMode === "editor" && (
          <div className="w-80 flex-shrink-0">
            {sidebarContent}
          </div>
        )}

        {/* Mobile Bottom Sheet */}
        {isMobile && (
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="bottom" className="h-[70vh] p-0 bg-card border-border rounded-t-2xl">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30 mx-auto mt-2 mb-1" />
              {sidebarContent}
            </SheetContent>
          </Sheet>
        )}

        {/* Main area */}
        {viewMode === "canvas" ? (
          <CanvasView
            carousel={carousel}
            selectedSlide={selectedSlide}
            onSelectSlide={handleCanvasSelect}
          />
        ) : (
          <div
            className="flex-1 flex items-center justify-center relative bg-background px-2 sm:px-4"
            onTouchStart={isMobile ? handleTouchStart : undefined}
            onTouchEnd={isMobile ? handleTouchEnd : undefined}
          >
            <div className="relative w-full" style={{ maxWidth: isMobile ? "62vw" : "340px" }}>
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

              {/* Nav arrows - hidden on mobile (use swipe) */}
              <div className="hidden sm:block absolute -left-14 top-1/2 -translate-y-1/2">
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
              <div className="hidden sm:block absolute -right-14 top-1/2 -translate-y-1/2">
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

              {/* Dots - desktop only */}
              {!isMobile && (
                <div className="flex items-center justify-center gap-1.5 mt-6">
                  {carousel.slides.map((s, i) => {
                    const hasOverride = s.styleOverride && Object.keys(s.styleOverride).length > 0;
                    return (
                      <button
                        key={i}
                        onClick={() => setSelectedSlide(i)}
                        className={`rounded-full transition-all duration-200 relative ${
                          i === selectedSlide
                            ? "w-6 h-1.5 bg-primary"
                            : "w-1.5 h-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                        }`}
                      >
                        {hasOverride && (
                          <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent-foreground" style={{ background: `hsl(${s.styleOverride?.accentColor || carousel.theme.accentColor})` }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile bottom bar: slide thumbnails + tab buttons */}
      {isMobile && (
        <div className="border-t border-border bg-card flex-shrink-0 safe-area-bottom">
          {/* Slide thumbnails - scrollable */}
          <div className="px-2 pt-2 pb-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {carousel.slides.map((slide, i) => {
                const hasOverride = slide.styleOverride && Object.keys(slide.styleOverride).length > 0;
                return (
                  <button
                    key={slide.id}
                    onClick={() => setSelectedSlide(i)}
                    className={`relative flex-shrink-0 w-10 h-12 rounded-lg border-2 transition-all text-[10px] font-bold flex items-center justify-center active:scale-95 ${
                      i === selectedSlide
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                    {hasOverride && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-card" style={{ background: `hsl(${slide.styleOverride?.accentColor || carousel.theme.accentColor})` }} />
                    )}
                  </button>
                );
              })}
              <button
                onClick={addSlide}
                className="flex-shrink-0 w-10 h-12 rounded-lg border-2 border-dashed border-border hover:border-primary/50 active:scale-95 text-muted-foreground flex items-center justify-center"
              >
                <span className="text-lg leading-none">+</span>
              </button>
            </div>
          </div>

          {/* Action tabs - larger touch targets */}
          <div className="flex border-t border-border/50">
            {([
              { id: "slide" as const, icon: Pencil, label: "Slide" },
              { id: "design" as const, icon: Palette, label: "Design" },
              { id: "profile" as const, icon: UserCircle, label: "Perfil" },
              { id: "footer" as const, icon: Type, label: "Rodapé" },
            ]).map((t) => (
              <button
                key={t.id}
                onClick={() => openMobileTab(t.id)}
                className="flex-1 flex flex-col items-center gap-0.5 py-3 text-muted-foreground active:text-primary active:bg-primary/5 transition-colors"
              >
                <t.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{t.label}</span>
              </button>
            ))}
            <button
              onClick={() => setViewMode(viewMode === "canvas" ? "editor" : "canvas")}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 text-muted-foreground active:text-primary active:bg-primary/5 transition-colors"
            >
              <LayoutGrid className="w-5 h-5" />
              <span className="text-[10px] font-medium">Todos</span>
            </button>
          </div>
        </div>
      )}


      <GenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerated={handleAIGenerated}
        currentDesignStyle={carousel.designStyle}
        currentTheme={carousel.theme}
      />
    </div>
  );
};

export default CarouselEditor;
