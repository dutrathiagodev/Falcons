"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LockKeyhole, ShieldCheck } from "lucide-react";
import { apiRequest } from "@/lib/api-client";

export default function Login({ initialStep }: { initialStep: "password" | "code" }) {
  const router = useRouter();
  // The proxy sends sessions that still owe the 2FA code straight to the code step.
  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function enterPanel() {
    router.replace("/dashboard");
    router.refresh();
  }

  async function handlePassword(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await apiRequest<{ mfaRequired: boolean }>("/api/auth/login", "POST", {
        email,
        password,
      });
      setPassword("");
      if (result.mfaRequired) {
        setStep("code");
        setLoading(false);
        return;
      }
      enterPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar.");
      setLoading(false);
    }
  }

  async function handleCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiRequest("/api/auth/mfa/verify", "POST", { code });
      enterPanel();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Codigo invalido.");
      setCode("");
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <Image src="/falcons-logo.png" alt="" width={48} height={48} className="auth-brand-logo" priority />
          <div>
            <strong>Falcons Volei</strong>
            <span>Atletica FAP</span>
          </div>
        </div>

        {step === "password" ? (
          <form className="auth-form" onSubmit={handlePassword}>
            <span className="page-hero-kicker">
              <LockKeyhole size={14} />
              Acesso restrito
            </span>
            <h1 className="auth-title">Entrar no painel</h1>
            <p className="auth-subtitle">Use o e-mail e a senha cadastrados pela comissao.</p>

            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="form-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                className="form-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleCode}>
            <span className="page-hero-kicker">
              <ShieldCheck size={14} />
              Verificacao em duas etapas
            </span>
            <h1 className="auth-title">Confirme o codigo</h1>
            <p className="auth-subtitle">Digite o codigo de 6 digitos do seu aplicativo autenticador.</p>

            <div className="form-group">
              <label className="form-label" htmlFor="code">Código</label>
              <input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                className="form-input"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                autoFocus
                required
              />
            </div>

            {error && <p className="auth-error" role="alert">{error}</p>}

            <button className="btn btn-primary auth-submit" type="submit" disabled={loading || code.length !== 6}>
              {loading ? "Verificando..." : "Confirmar"}
            </button>
          </form>
        )}

        <p className="auth-footnote">
          <ShieldCheck size={14} />
          Conexao protegida. Dados dos atletas visiveis so para a comissao.
        </p>
      </div>
    </div>
  );
}
