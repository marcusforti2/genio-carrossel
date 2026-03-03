import { useState, useEffect } from "react";
import { CarouselData, SlideData, createDefaultCarousel } from "@/types/carousel";
import SlidePreview from "@/components/SlidePreview";
import EditorSidebar from "@/components/EditorSidebar";
import GenerateDialog from "@/components/GenerateDialog";
import ExportButtons from "@/components/ExportButtons";
import ProjectsSheet from "@/components/ProjectsSheet";
import CanvasView from "@/components/CanvasView";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft, ChevronRight, Sparkles, User, LogOut, LayoutGrid, Monitor, Menu, X, Save, Check, Loader2 as Loader } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProjectAutosave, Project } from "@/hooks/useProjectAutosave";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const CarouselEditor = () => {
  const [carousel, setCarousel] = useState<CarouselData>(createDefaultCarousel());
  const [selectedSlide, setSelectedSlide] = useState(0);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [caption, setCaption] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<"editor" | "canvas">("editor");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
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

  const handleAIGenerated = (slides: SlideData[], newCaption: string) => {
    setCarousel({ ...carousel, slides });
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
    />
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="h-12 sm:h-14 border-b border-border flex items-center justify-between px-3 sm:px-5 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => setMobileSidebarOpen(true)}>
              <Menu className="w-4 h-4" />
            </Button>
          )}
          <ProjectsSheet
            onLoadProject={handleLoadProject}
            onNewProject={handleNewProject}
            currentProjectId={projectId}
          />
          <Input
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="h-7 text-xs bg-transparent border-none px-1 w-24 sm:w-40 font-semibold truncate"
            placeholder="Nome do projeto"
          />
          <SaveStatusIndicator />
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          {/* View toggle */}
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

          <Button variant="ghost" size="sm" onClick={() => navigate("/profile")} className="text-xs gap-1 text-muted-foreground h-8 px-2">
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Perfil</span>
          </Button>
          <ExportButtons carousel={carousel} />
          <Button size="sm" className="text-xs gap-1 h-8 px-2 sm:px-3" onClick={() => setGenerateOpen(true)}>
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Gerar com IA</span>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={signOut}>
            <LogOut className="w-3.5 h-3.5" />
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && viewMode === "editor" && (
          <div className="w-80 flex-shrink-0">
            {sidebarContent}
          </div>
        )}

        {/* Mobile Sidebar Sheet */}
        {isMobile && (
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="left" className="w-[85vw] p-0 bg-card border-border">
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
          <div className="flex-1 flex items-center justify-center relative bg-background px-4">
            <div className="relative w-full" style={{ maxWidth: isMobile ? "280px" : "340px" }}>
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
              <div className="absolute -left-10 sm:-left-14 top-1/2 -translate-y-1/2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goToSlide(-1)}
                  disabled={selectedSlide === 0}
                  className="rounded-full w-8 h-8 sm:w-9 sm:h-9 text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </div>
              <div className="absolute -right-10 sm:-right-14 top-1/2 -translate-y-1/2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => goToSlide(1)}
                  disabled={selectedSlide === carousel.slides.length - 1}
                  className="rounded-full w-8 h-8 sm:w-9 sm:h-9 text-muted-foreground hover:text-foreground disabled:opacity-20"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Dots */}
              <div className="flex items-center justify-center gap-1.5 mt-4 sm:mt-6">
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

              {/* Mobile: view mode toggle */}
              {isMobile && (
                <div className="flex justify-center mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-[10px] gap-1 h-7"
                    onClick={() => setViewMode("canvas")}
                  >
                    <LayoutGrid className="w-3 h-3" />
                    Ver todos
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {caption && (
        <div className="border-t border-border px-3 sm:px-5 py-2 sm:py-3 max-h-28 sm:max-h-32 overflow-y-auto">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Legenda gerada</p>
          <p className="text-xs text-foreground/80 whitespace-pre-wrap">{caption}</p>
        </div>
      )}

      <GenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerated={handleAIGenerated}
      />
    </div>
  );
};

export default CarouselEditor;
