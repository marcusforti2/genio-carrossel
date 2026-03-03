import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { FolderOpen, Plus, Copy, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Project } from "@/hooks/useProjectAutosave";

interface ProjectsSheetProps {
  onLoadProject: (project: Project) => void;
  onNewProject: () => void;
  currentProjectId: string | null;
}

const ProjectsSheet = ({ onLoadProject, onNewProject, currentProjectId }: ProjectsSheetProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = async () => {
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
  };

  useEffect(() => {
    if (open) fetchProjects();
  }, [open]);

  const handleLoad = async (id: string) => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();
    if (error || !data) {
      toast.error("Erro ao abrir projeto");
      return;
    }
    onLoadProject({ id: data.id, title: data.title, data: data.data as any, created_at: data.created_at, updated_at: data.updated_at });
    setOpen(false);
    toast.success("Projeto carregado!");
  };

  const handleDuplicate = async (id: string) => {
    const { data: original } = await supabase.from("projects").select("*").eq("id", id).single();
    if (!original || !user) return;
    const { error } = await supabase.from("projects").insert({
      user_id: user.id,
      title: `${original.title} (cópia)`,
      data: original.data,
    } as any);
    if (error) { toast.error("Erro ao duplicar"); return; }
    toast.success("Projeto duplicado!");
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) { toast.error("Erro ao deletar"); return; }
    toast.success("Projeto deletado!");
    fetchProjects();
  };

  const handleNew = () => {
    onNewProject();
    setOpen(false);
  };

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs gap-1.5 text-muted-foreground">
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Projetos</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 sm:w-96 bg-card border-border">
        <SheetHeader>
          <SheetTitle className="text-sm font-bold">Meus Projetos</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-3">
          <Button onClick={handleNew} variant="outline" size="sm" className="w-full gap-2 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Novo projeto
          </Button>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : projects.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">Nenhum projeto ainda</p>
          ) : (
            <div className="space-y-2 max-h-[70vh] overflow-y-auto">
              {projects.map((p) => (
                <div
                  key={p.id}
                  className={`rounded-lg border p-3 space-y-2 transition-colors ${
                    p.id === currentProjectId ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <button onClick={() => handleLoad(p.id)} className="text-left flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">{p.title}</p>
                      <p className="text-[10px] text-muted-foreground">{formatDate(p.updated_at)}</p>
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1" onClick={() => handleLoad(p.id)}>
                      Abrir
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] gap-1" onClick={() => handleDuplicate(p.id)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-[10px] gap-1 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(p.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ProjectsSheet;
