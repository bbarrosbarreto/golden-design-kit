import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/redefinir-senha")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Redefinir senha | Bruno Barreto Imóveis" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // O link de recuperação cria uma sessão temporária (detectSessionInUrl).
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(
          /session|jwt|expired/i.test(updateError.message)
            ? "Link expirado ou inválido. Solicite um novo link de redefinição na tela de login."
            : updateError.message,
        );
        return;
      }
      setDone(true);
      setTimeout(() => navigate({ to: "/admin/login" }), 2000);
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
        <h2 className="font-heading text-2xl text-foreground">Nova senha</h2>

        {done ? (
          <p className="mt-4 font-body text-sm text-foreground">
            Senha alterada com sucesso! Redirecionando para o login…
          </p>
        ) : (
          <>
            <p className="mt-2 font-body text-sm text-muted-foreground">
              {ready
                ? "Defina a nova senha da sua conta administrativa."
                : "Validando o link de redefinição…"}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor="new-password" className="font-body text-sm text-foreground">
                  Nova senha
                </label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="confirm-password" className="font-body text-sm text-foreground">
                  Confirmar nova senha
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              {error && <p className="font-body text-sm text-destructive">{error}</p>}

              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading || !ready}
                className="w-full"
              >
                {loading ? "Salvando…" : "Salvar nova senha"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
