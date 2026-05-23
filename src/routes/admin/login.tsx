import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/login")({
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) {
        const msg = signInError.message || "";
        if (/invalid login credentials/i.test(msg)) {
          setError(
            "Email ou senha incorretos. Verifique o usuário no painel do Supabase (Authentication → Users) e, se necessário, redefina a senha por lá.",
          );
        } else if (/database error querying schema/i.test(msg)) {
          setError(
            "Erro interno do seu projeto Supabase: 'Database error querying schema'. Isso não é um problema do app — geralmente é causado por trigger quebrado em auth.users, função SECURITY DEFINER com erro, ou hook de Auth mal configurado no seu Supabase.",
          );
        } else if (/email not confirmed/i.test(msg)) {
          setError(
            "Email não confirmado. No Supabase (Authentication → Users) marque o usuário como confirmado.",
          );
        } else {
          setError(msg);
        }
        return;
      }
      navigate({ to: "/admin" });
    } catch (err) {
      setError(
        err instanceof Error
          ? `Falha de conexão: ${err.message}`
          : "Falha de conexão com o Supabase.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-surface px-6">
      <h1 className="font-heading text-4xl text-foreground">BB</h1>

      <div className="w-full max-w-sm rounded-lg bg-card p-8 shadow-md">
        <h2 className="font-heading text-2xl text-foreground">Acesso Restrito</h2>
        <p className="mt-2 font-body text-sm text-muted-foreground">
          Área administrativa
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="font-body text-sm text-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-body text-sm text-foreground">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="font-body text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
