"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiRequest("/api/auth/login", "POST", { email, password });
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao entrar.");
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <form className="panel" onSubmit={handleSubmit} style={{ maxWidth: 420, margin: "10vh auto 0" }}>
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
    </div>
  );
}
