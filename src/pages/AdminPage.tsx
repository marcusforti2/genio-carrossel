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

  // Credits dialog
  const [creditsUser, setCreditsUser] = useState<AdminUser | null>(null);
  const [newLimit, setNewLimit] = useState("");

  // Projects dialog
  const [projectsUser, setProjectsUser] = useState<AdminUser | null>(null);
  const [userProjects, setUserProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

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
    const [usersRes, statsRes] = await Promise.all([
      callAdmin("list"),
      callAdmin("stats"),
    ]);
    if (usersRes.users) setUsers(usersRes.users);
    if (statsRes.total_users !== undefined) setStats(statsRes);
    setLoading(false);
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

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
      <Dialog open={!!projectsUser} onOpenChange={() => setProjectsUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Projetos de {projectsUser?.profile?.display_name || projectsUser?.email}
            </DialogTitle>
          </DialogHeader>
          {projectsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : userProjects.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhum projeto encontrado.</p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Atualizado em</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userProjects.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-sm font-medium text-foreground">{p.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.created_at)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(p.updated_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
