import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase places the recovery token in URL hash; the client picks it up
    // and fires a PASSWORD_RECOVERY event. We just wait for a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha precisa ter pelo menos 6 caracteres.");
    if (password !== confirm) return toast.error("As senhas não conferem.");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) return toast.error(error.message);
    toast.success("Senha atualizada! Entrando...");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight">Nova senha</h1>
          <p className="text-sm text-muted-foreground">
            {ready ? "Defina sua nova senha abaixo." : "Validando link de recuperação..."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Nova senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={!ready}
              className="bg-secondary border-border/50"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Confirmar senha</Label>
            <Input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              disabled={!ready}
              className="bg-secondary border-border/50"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !ready}>
            {loading ? "Salvando..." : "Atualizar senha"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
