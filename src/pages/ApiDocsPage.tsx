import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Plus, Trash2, Key, Webhook, Code2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
  is_active: boolean;
}

interface WebhookRow {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export default function ApiDocsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [apiKeys, setApiKeys] = useState<ApiKeyRow[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookRow[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showMcp, setShowMcp] = useState(false);

  const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;
  const MCP_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mcp-server`;

  useEffect(() => {
    if (user) {
      loadApiKeys();
      loadWebhooks();
    }
  }, [user]);

  async function loadApiKeys() {
    const { data } = await supabase.from("api_keys").select("id, name, key_prefix, created_at, last_used_at, is_active").eq("user_id", user!.id) as any;
    setApiKeys(data || []);
  }

  async function loadWebhooks() {
    const { data } = await supabase.from("webhooks").select("id, url, events, is_active, created_at").eq("user_id", user!.id) as any;
    setWebhooks(data || []);
  }

  async function createApiKey() {
    if (!newKeyName.trim()) {
      toast.error("Digite um nome para a chave");
      return;
    }
    const rawKey = `gc_${crypto.randomUUID().replace(/-/g, "")}`;
    const keyHash = await sha256(rawKey);
    const keyPrefix = rawKey.slice(0, 10) + "...";

    const { error } = await supabase.from("api_keys").insert({
      user_id: user!.id,
      name: newKeyName.trim(),
      key_hash: keyHash,
      key_prefix: keyPrefix,
    } as any);

    if (error) {
      toast.error("Erro ao criar chave");
      return;
    }

    setRevealedKey(rawKey);
    setNewKeyName("");
    loadApiKeys();
    toast.success("Chave criada! Copie agora, ela não será exibida novamente.");
  }

  async function deleteApiKey(id: string) {
    await supabase.from("api_keys").delete().eq("id", id);
    loadApiKeys();
    toast.success("Chave removida");
  }

  async function createWebhook() {
    if (!newWebhookUrl.trim()) {
      toast.error("Digite a URL do webhook");
      return;
    }
    const secret = crypto.randomUUID();
    const { error } = await supabase.from("webhooks").insert({
      user_id: user!.id,
      url: newWebhookUrl.trim(),
      events: ["project.created", "project.updated", "project.deleted"],
      secret,
    } as any);

    if (error) {
      toast.error("Erro ao criar webhook");
      return;
    }
    setNewWebhookUrl("");
    loadWebhooks();
    toast.success("Webhook criado!");
  }

  async function deleteWebhook(id: string) {
    await supabase.from("webhooks").delete().eq("id", id);
    loadWebhooks();
    toast.success("Webhook removido");
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API & Integrações</h1>
            <p className="text-muted-foreground">Gerencie chaves de API, webhooks e integração com Claude Code</p>
          </div>
        </div>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="w-5 h-5" /> Chaves de API</CardTitle>
            <CardDescription>Use chaves de API para autenticar chamadas à API REST</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {revealedKey && (
              <div className="bg-accent/20 border border-accent/40 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-accent-foreground">🔑 Sua nova chave (copie agora!):</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm font-mono break-all">{revealedKey}</code>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(revealedKey)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setRevealedKey(null)}>Fechar</Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="Nome da chave (ex: Claude Code)"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createApiKey()}
              />
              <Button onClick={createApiKey}><Plus className="w-4 h-4 mr-1" /> Criar</Button>
            </div>

            {apiKeys.map(k => (
              <div key={k.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                <div>
                  <p className="font-medium">{k.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{k.key_prefix}</p>
                </div>
                <div className="flex items-center gap-2">
                  {k.last_used_at && (
                    <span className="text-xs text-muted-foreground">Último uso: {new Date(k.last_used_at).toLocaleDateString("pt-BR")}</span>
                  )}
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteApiKey(k.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Webhooks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Webhook className="w-5 h-5" /> Webhooks</CardTitle>
            <CardDescription>Receba notificações quando projetos são criados, atualizados ou deletados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="https://sua-url.com/webhook"
                value={newWebhookUrl}
                onChange={e => setNewWebhookUrl(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createWebhook()}
              />
              <Button onClick={createWebhook}><Plus className="w-4 h-4 mr-1" /> Criar</Button>
            </div>

            {webhooks.map(wh => (
              <div key={wh.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
                <div>
                  <p className="font-mono text-sm">{wh.url}</p>
                  <div className="flex gap-1 mt-1">
                    {wh.events.map(ev => (
                      <Badge key={ev} variant="secondary" className="text-xs">{ev}</Badge>
                    ))}
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteWebhook(wh.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* API Docs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Code2 className="w-5 h-5" /> Documentação da API</CardTitle>
            <CardDescription>Referência rápida dos endpoints disponíveis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-1">
              <p className="text-sm font-medium">Base URL:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono">{BASE_URL}</code>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(BASE_URL)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">Autenticação:</p>
              <code className="block bg-muted rounded p-3 text-xs font-mono whitespace-pre">{`curl ${BASE_URL}/v1/projects \\
  -H "x-api-key: gc_sua_chave_aqui"`}</code>
            </div>

            <div className="space-y-3">
              <p className="font-medium text-sm">Endpoints:</p>
              {[
                { method: "GET", path: "/v1/projects", desc: "Listar projetos" },
                { method: "GET", path: "/v1/projects/:id", desc: "Buscar projeto" },
                { method: "POST", path: "/v1/projects", desc: "Criar projeto" },
                { method: "PUT", path: "/v1/projects/:id", desc: "Atualizar projeto" },
                { method: "DELETE", path: "/v1/projects/:id", desc: "Deletar projeto" },
                { method: "GET", path: "/v1/profile", desc: "Buscar perfil" },
                { method: "PUT", path: "/v1/profile", desc: "Atualizar perfil" },
                { method: "GET", path: "/v1/webhooks", desc: "Listar webhooks" },
                { method: "POST", path: "/v1/webhooks", desc: "Criar webhook" },
                { method: "DELETE", path: "/v1/webhooks/:id", desc: "Deletar webhook" },
              ].map(ep => (
                <div key={ep.path + ep.method} className="flex items-center gap-3">
                  <Badge variant={ep.method === "GET" ? "secondary" : ep.method === "POST" ? "default" : ep.method === "DELETE" ? "destructive" : "outline"} className="font-mono text-xs w-16 justify-center">
                    {ep.method}
                  </Badge>
                  <code className="text-sm font-mono flex-1">{ep.path}</code>
                  <span className="text-sm text-muted-foreground">{ep.desc}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">Eventos de Webhook:</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">project.created</Badge>
                <Badge variant="outline">project.updated</Badge>
                <Badge variant="outline">project.deleted</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Cada webhook recebe o header <code>X-Webhook-Signature</code> com HMAC-SHA256 do body para validação.</p>
            </div>
          </CardContent>
        </Card>

        {/* Claude Code / MCP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="w-5 h-5" /> Integração com Claude Code
            </CardTitle>
            <CardDescription>Use o MCP Server para que o Claude Code acesse seus projetos e perfil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted rounded-lg p-4 space-y-1">
              <p className="text-sm font-medium">MCP Server URL:</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono">{MCP_URL}</code>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copyToClipboard(MCP_URL)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">Configuração no Claude Code:</p>
              <p className="text-sm text-muted-foreground">Adicione no seu arquivo <code>.claude/mcp.json</code>:</p>
              <pre className="bg-muted rounded p-3 text-xs font-mono whitespace-pre overflow-x-auto">{JSON.stringify({
                mcpServers: {
                  "genio-carrossel": {
                    type: "streamable-http",
                    url: MCP_URL,
                    headers: {
                      "x-api-key": "gc_SUA_CHAVE_AQUI"
                    }
                  }
                }
              }, null, 2)}</pre>
            </div>

            <div className="space-y-2">
              <p className="font-medium text-sm">Tools disponíveis no MCP:</p>
              <div className="grid gap-2">
                {[
                  { name: "list_projects", desc: "Listar todos os projetos" },
                  { name: "get_project", desc: "Buscar projeto por ID" },
                  { name: "create_project", desc: "Criar novo projeto" },
                  { name: "update_project", desc: "Atualizar projeto existente" },
                  { name: "delete_project", desc: "Deletar projeto" },
                  { name: "get_profile", desc: "Buscar perfil do usuário" },
                  { name: "update_profile", desc: "Atualizar perfil" },
                ].map(t => (
                  <div key={t.name} className="flex items-center gap-3">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">{t.name}</code>
                    <span className="text-sm text-muted-foreground">{t.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
              <p className="text-sm"><strong>Como usar:</strong></p>
              <ol className="text-sm text-muted-foreground list-decimal list-inside space-y-1 mt-2">
                <li>Crie uma chave de API acima</li>
                <li>Copie a configuração MCP acima e substitua a chave</li>
                <li>Cole no arquivo <code>.claude/mcp.json</code> do seu projeto</li>
                <li>Reinicie o Claude Code</li>
                <li>Agora o Claude pode listar, criar e editar seus carrosséis!</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
