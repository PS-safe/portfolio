"use client";

import { CheckCircle2, Loader2, Mail } from "lucide-react";
import { useState } from "react";

type Step = "email" | "code" | "verified";

export function TryOtpForm() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send the code.");
        return;
      }
      setStep("code");
      setCode("");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        return;
      }
      setStep("verified");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setStep("email");
    setEmail("");
    setCode("");
    setError(null);
  }

  return (
    <div className="not-prose my-6 rounded-lg border border-border bg-card p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-accent">
        Try it live
      </p>
      <p className="mt-2 text-sm text-muted-foreground">
        Send yourself a real 6-digit code, then verify it. Codes expire in 10
        minutes; max 5 attempts per code.
      </p>

      {step === "email" && (
        <form onSubmit={requestCode} className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            Send code
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Code sent to <span className="font-mono text-foreground">{email}</span>. Check your inbox.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              required
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-base tracking-widest text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Verify
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <button type="button" onClick={() => requestCode()} disabled={loading} className="hover:text-foreground">
              Resend code
            </button>
            <span className="opacity-50">·</span>
            <button type="button" onClick={reset} disabled={loading} className="hover:text-foreground">
              Use a different email
            </button>
          </div>
        </form>
      )}

      {step === "verified" && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-md border border-border bg-muted p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-medium text-foreground">Verified.</p>
              <p className="text-xs text-muted-foreground">
                {email} successfully completed the OTP flow.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={reset}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-muted"
          >
            Try again
          </button>
        </div>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
