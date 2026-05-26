import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type Mode = "login" | "signup" | "forgot";

const AuthPage = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) toast.error(error.message);
      else toast.success("Enviamos um link de recuperação para seu email.");
      setLoading(false);
      return;
    }

    const { error } = mode === "login"
      ? await signIn(email, password)
      : await signUp(email, password);

    if (error) {
      toast.error(error.message);
    } else if (mode === "signup") {
      toast.success("Conta criada com sucesso!");
    }
    setLoading(false);
  };

  const title =
    mode === "login" ? "Entre na sua conta" :
    mode === "signup" ? "Crie sua conta" :
    "Recuperar senha";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Carrossel AI</h1>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="bg-secondary border-border/50"
            />
          </div>

          {mode !== "forgot" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Senha</Label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-[11px] text-primary hover:underline"
                  >
                    Esqueci a senha
                  </button>
                )}
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="bg-secondary border-border/50"
              />
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Carregando..." :
              mode === "login" ? "Entrar" :
              mode === "signup" ? "Criar conta" :
              "Enviar link de recuperação"}
          </Button>
        </form>

        {mode === "forgot" ? (
          <button
            onClick={() => setMode("login")}
            className="w-full flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-3 h-3" />
            Voltar para login
          </button>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            {mode === "login" ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-primary hover:underline font-medium"
            >
              {mode === "login" ? "Criar conta" : "Entrar"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
