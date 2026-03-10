import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Copy, Trash2, Loader2, LogOut, User, FolderOpen, Search, Sparkles, MoreHorizontal, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import GenerateDialog from "@/components/GenerateDialog";
import CarouselLimitWall from "@/components/CarouselLimitWall";
import { useCarouselLimit } from "@/hooks/useCarouselLimit";
import { SlideData, DesignStyle, createDefaultCarousel } from "@/types/carousel";

interface ProjectItem {
  id: string;
  title: string;
  updated_at: string;
  created_at: string;
}

const DashboardPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [showLimitWall, setShowLimitWall] = useState(false);
  const { count: carouselCount, remaining, limitReached, FREE_LIMIT } = useCarouselLimit();

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("id, title, created_at, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar projetos");
    }
    setProjects(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [user]);

  const handleGenerated = async (slides: SlideData[], caption: string, designStyle: DesignStyle) => {
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const defaultCarousel = createDefaultCarousel();
    const carouselData = {
      ...defaultCarousel,
      slides,
      designStyle,
      profileName: profile?.display_name || "",
      profileHandle: profile?.handle || "",
      brandingText: profile?.branding_text || "",
      brandingSubtext: profile?.branding_subtext || "",
      avatarUrl: profile?.avatar_url || "",
      _caption: caption,
    };

    const title = slides[0]?.title?.substring(0, 60) || "Sem título";

    const { data: newProject, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        title,
        data: carouselData as any,
      })
      .select("id")
      .single();

    if (error || !newProject) {
      toast.error("Erro ao salvar projeto");
      return;
    }

    navigate(`/editor?project=${newProject.id}`);
  };

  const handleOpen = (id: string) => {
    navigate(`/editor?project=${id}`);
  };

  const handleDuplicate = async (id: string) => {
    const { data: original } = await supabase.from("projects").select("*").eq("id", id).single();
    if (!original || !user) return;
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: `${original.title} (cópia)`,
      data: original.data,
    } as any);
    if (error) {
      toast.error("Erro ao duplicar");
      return;
    }
    toast.success("Projeto duplicado!");
    fetchProjects();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("projects").delete().eq("id", deleteId);
    if (error) {
      toast.error("Erro ao deletar");
      return;
    }
    toast.success("Projeto deletado!");
    setDeleteId(null);
    fetchProjects();
  };

  const formatDate = useCallback((d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }), []);

  const filtered = useMemo(() => projects.filter((p) =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  ), [projects, searchQuery]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <h1 className="text-sm font-bold tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              Carousel Spark
            </h1>
            <span className="text-[9px] font-medium text-muted-foreground border border-border rounded px-1.5 py-0.5 uppercase tracking-wider">by Forti</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile")}
              className="text-xs gap-1.5 text-muted-foreground"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Perfil</span>
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={signOut}>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Title + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }}>
              Meus Projetos
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {projects.length} {projects.length === 1 ? "carrossel" : "carrosséis"} criados
            </p>
          </div>
          <Button onClick={() => setGenerateOpen(true)} className="gap-2 text-sm h-10 px-5">
            <Sparkles className="w-4 h-4" />
            Criar novo carrossel
          </Button>
        </div>

        {/* Search */}
        {projects.length > 0 && (
          <div className="relative mb-6 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar projeto..."
              className="pl-9 bg-card border-border h-10"
            />
          </div>
        )}

        {/* Projects grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 && projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold mb-2">Nenhum carrossel ainda</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Crie seu primeiro carrossel e comece a produzir conteúdo.
            </p>
            <Button onClick={() => setGenerateOpen(true)} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Criar primeiro carrossel
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">
            Nenhum projeto encontrado para "{searchQuery}"
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  onClick={() => handleOpen(project.id)}
                  className="w-full text-left group"
                >
                  <div className="rounded-xl border border-border bg-card p-5 hover:border-primary/50 hover:bg-card/80 transition-all duration-200 space-y-3">
                    <div className="w-10 h-1 rounded-full bg-primary/60" />
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {project.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          Editado {formatDate(project.updated_at)}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpen(project.id); }}>
                            <FolderOpen className="w-3.5 h-3.5 mr-2" /> Abrir
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(project.id); }}>
                            <Copy className="w-3.5 h-3.5 mr-2" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); setDeleteId(project.id); }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O projeto será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Generate Dialog */}
      <GenerateDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onGenerated={handleGenerated}
      />
    </div>
  );
};

export default DashboardPage;