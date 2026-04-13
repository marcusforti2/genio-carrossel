import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2, Users, FolderOpen, TrendingUp, Shield, Trash2, ArrowLeft, CreditCard, Eye, ChevronLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import SlidePreview from "@/components/SlidePreview";
import { CarouselData } from "@/types/carousel";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  profile: {
    display_name: string;
    handle: string;
    avatar_url: string | null;
    niche: string;
  } | null;
  roles: string[];
  credits: { total_limit: number };
  project_count: number;
}

interface Stats {
  total_users: number;
  total_projects: number;
  new_users_7d: number;
}

interface ChartsData {
  users_per_week: { week: string; count: number }[];
  projects_per_day: { day: string; count: number }[];
  credits_usage: { label: string; count: number }[];
}

interface ProjectItem {
  id: string;
  title: string;
  data: CarouselData | null;
  created_at: string;
  updated_at: string;
}

const AdminPage = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  // Credits dialog
  const [creditsUser, setCreditsUser] = useState<AdminUser | null>(null);
  const [newLimit, setNewLimit] = useState("");
  const [chartsData, setChartsData] = useState<ChartsData | null>(null);

  // Projects dialog
  const [projectsUser, setProjectsUser] = useState<AdminUser | null>(null);
  const [userProjects, setUserProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [expandedProject, setExpandedProject] = useState<ProjectItem | null>(null);

  const callAdmin = async (action: string, method = "GET", body?: Record<string, unknown>) => {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users/${action}`;
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return res.json();
  };

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, statsRes, chartsRes] = await Promise.all([
      callAdmin(`list?page=${page}&limit=${PAGE_SIZE}`),
      callAdmin("stats"),
      callAdmin("charts"),
    ]);
    if (usersRes.users) setUsers(usersRes.users);
    if (statsRes.total_users !== undefined) setStats(statsRes);
    if (chartsRes.users_per_week) setChartsData(chartsRes);
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session, page]);

  const handleSetRole = async (userId: string, role: string, action: "add" | "remove") => {
    const res = await callAdmin("set-role", "POST", { user_id: userId, role, action });
    if (res.success) {
      toast({ title: action === "add" ? `Papel ${role} atribuído` : `Papel ${role} removido` });
      fetchData();
    } else {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
    }
  };

  const handleDelete = async (userId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário "${name}"? Essa ação é irreversível.`)) return;
    const res = await callAdmin("delete", "POST", { user_id: userId });
    if (res.success) {
      toast({ title: "Usuário excluído" });
      fetchData();
    } else {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
    }
  };

  const handleSetCredits = async () => {
    if (!creditsUser) return;
    const limit = parseInt(newLimit);
    if (isNaN(limit) || limit < 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    const res = await callAdmin("set-credits", "POST", { user_id: creditsUser.id, total_limit: limit });
    if (res.success) {
      toast({ title: `Limite atualizado para ${limit}` });
      setCreditsUser(null);
      fetchData();
    } else {
      toast({ title: "Erro", description: res.error, variant: "destructive" });
    }
  };

  const handleViewProjects = async (u: AdminUser) => {
    setProjectsUser(u);
    setProjectsLoading(true);
    const res = await callAdmin(`user-projects?user_id=${u.id}`);
    setUserProjects(res.projects || []);
    setProjectsLoading(false);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Painel Admin</h1>
            <p className="text-sm text-muted-foreground">Gerencie usuários, créditos e monitore a plataforma</p>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Usuários</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.total_users}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Projetos</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.total_projects}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Novos (7 dias)</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.new_users_7d}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Usuários ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Nicho</TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>Projetos</TableHead>
                  <TableHead>Papéis</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {u.profile?.avatar_url ? (
                          <img src={u.profile.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            {(u.profile?.display_name || u.email || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-foreground text-sm">{u.profile?.display_name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{u.profile?.handle || ""}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{u.profile?.niche || "—"}</TableCell>
                    <TableCell>
                      <button
                        onClick={() => {
                          setCreditsUser(u);
                          setNewLimit(String(u.credits?.total_limit ?? 15));
                        }}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        {u.project_count}/{u.credits?.total_limit ?? 15}
                      </button>
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleViewProjects(u)}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {u.project_count}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {u.roles.length > 0 ? (
                          u.roles.map((r) => (
                            <Badge
                              key={r}
                              variant={r === "admin" ? "default" : "secondary"}
                              className="cursor-pointer text-xs"
                              onClick={() => handleSetRole(u.id, r, "remove")}
                              title="Clique para remover"
                            >
                              {r} ×
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">usuário</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(u.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!u.roles.includes("admin") && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetRole(u.id, "admin", "add")}
                            title="Tornar admin"
                          >
                            <Shield className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(u.id, u.profile?.display_name || u.email || u.id)}
                          className="text-destructive hover:text-destructive"
                          title="Excluir usuário"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination */}
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Página {page} • {users.length} usuários exibidos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={users.length < PAGE_SIZE}
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Credits Dialog */}
      <Dialog open={!!creditsUser} onOpenChange={() => setCreditsUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar créditos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Usuário: <strong className="text-foreground">{creditsUser?.profile?.display_name || creditsUser?.email}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Uso atual: <strong className="text-foreground">{creditsUser?.project_count}</strong> projetos
            </p>
            <div>
              <label className="text-sm font-medium text-foreground">Novo limite de carrosséis</label>
              <Input
                type="number"
                min={0}
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreditsUser(null)}>Cancelar</Button>
            <Button onClick={handleSetCredits}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Projects Dialog */}
      <Dialog open={!!projectsUser} onOpenChange={() => { setProjectsUser(null); setExpandedProject(null); }}>
        <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            {expandedProject ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpandedProject(null)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <DialogTitle className="truncate">{expandedProject.title}</DialogTitle>
              </div>
            ) : (
              <DialogTitle>
                Projetos de {projectsUser?.profile?.display_name || projectsUser?.email}
              </DialogTitle>
            )}
          </DialogHeader>

          {projectsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : expandedProject ? (
            // Expanded: show all slide cards in a grid
            <div className="overflow-y-auto flex-1 py-2">
              {expandedProject.data?.slides && expandedProject.data.slides.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {expandedProject.data.slides.map((slide, idx) => (
                    <div key={slide.id || idx} className="rounded-lg overflow-hidden border border-border bg-muted/30">
                      <div className="aspect-[4/5]">
                        <SlidePreview
                          slide={slide}
                          carousel={expandedProject.data as CarouselData}
                          slideIndex={idx}
                          totalSlides={expandedProject.data!.slides.length}
                        />
                      </div>
                      <div className="p-2 border-t border-border">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{slide.type} • Slide {idx + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Sem slides neste projeto.</p>
              )}
            </div>
          ) : userProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum projeto encontrado.</p>
          ) : (
            // Project list with first slide preview
            <div className="overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {userProjects.map((p) => {
                  const carousel = p.data as CarouselData | null;
                  const firstSlide = carousel?.slides?.[0];
                  return (
                    <button
                      key={p.id}
                      onClick={() => setExpandedProject(p)}
                      className="flex gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/10 transition-colors text-left cursor-pointer"
                    >
                      {firstSlide && carousel ? (
                        <div className="w-20 h-25 flex-shrink-0 rounded overflow-hidden border border-border">
                          <div className="aspect-[4/5]">
                            <SlidePreview
                              slide={firstSlide}
                              carousel={carousel}
                              slideIndex={0}
                              totalSlides={carousel.slides.length}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-20 h-25 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{carousel?.slides?.length || 0} slides</p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.updated_at)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
