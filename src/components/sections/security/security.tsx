"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import TopBar from "@/components/layout/top-bar";
import { apiRequest } from "@/lib/api-client";

type Enrollment = { factorId: string; qrCode: string; secret: string };

export default function Security({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function startEnrollment() {
    setLoading(true);
    setError("");
    try {
      setEnrollment(await apiRequest<Enrollment>("/api/auth/mfa/enroll", "POST"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao iniciar.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmEnrollment(event: FormEvent) {
    event.preventDefault();
    if (!enrollment) return;
    setLoading(true);
    setError("");
    try {
      await apiRequest("/api/auth/mfa/verify", "POST", { factorId: enrollment.factorId, code });
      setEnrollment(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Codigo invalido.");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <TopBar
        title="Segurança da conta"
        badge="Proteção"
        description="Ative a verificação em duas etapas: além da senha, o login pede um código do seu celular."
      />

      <section className="panel" style={{ maxWidth: 560 }}>
        <h2 className="section-title">
          <ShieldCheck size={18} />
          Verificação em duas etapas
        </h2>

        {enabled ? (
          <p>Ativa. Todo login nesta conta pede o código do aplicativo autenticador.</p>
        ) : enrollment ? (
          <form onSubmit={confirmEnrollment}>
            <p>
              1. Abra um aplicativo autenticador (Google Authenticator, Microsoft Authenticator,
              Authy) e escaneie o QR code.
            </p>
            {/* QR code comes from Supabase as an SVG data URI; next/image adds nothing here. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enrollment.qrCode}
              alt="QR code para o aplicativo autenticador"
              width={200}
              height={200}
              style={{ background: "#fff", padding: 8, borderRadius: 12 }}
            />
            <p>
              Sem câmera? Digite a chave: <code>{enrollment.secret}</code>
            </p>

            <div className="form-group">
              <label className="form-label" htmlFor="mfa-code">2. Digite o código de 6 dígitos</label>
              <input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                className="form-input"
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            {error && <p role="alert">{error}</p>}

            <button className="btn btn-primary" type="submit" disabled={loading || code.length !== 6}>
              {loading ? "Verificando..." : "Ativar"}
            </button>
          </form>
        ) : (
          <>
            <p>Desativada. Recomendado para quem administra o time e os dados dos atletas.</p>
            {error && <p role="alert">{error}</p>}
            <button className="btn btn-primary" type="button" onClick={startEnrollment} disabled={loading}>
              {loading ? "Gerando..." : "Ativar verificação"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
