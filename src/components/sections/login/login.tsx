"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api-client";

export default function Login() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // The proxy sends sessions that still owe the 2FA code straight to the code step.
  const [step, setStep] = useState<"password" | "code">(
    searchParams.get("etapa") === "codigo" ? "code" : "password",
  );
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
    <div className="page-shell">
      {step === "password" ? (
        <form className="panel" onSubmit={handlePassword} style={{ maxWidth: 420, margin: "10vh auto 0" }}>
          <h1 className="card-title">Entrar no painel</h1>

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

          {error && <p role="alert">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      ) : (
        <form className="panel" onSubmit={handleCode} style={{ maxWidth: 420, margin: "10vh auto 0" }}>
          <h1 className="card-title">Verificação em duas etapas</h1>
          <p>Digite o código de 6 dígitos do seu aplicativo autenticador.</p>

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

          {error && <p role="alert">{error}</p>}

          <button className="btn btn-primary" type="submit" disabled={loading || code.length !== 6}>
            {loading ? "Verificando..." : "Confirmar"}
          </button>
        </form>
      )}
    </div>
  );
}
