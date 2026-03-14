"use client";

import Image from "next/image";
import { useEffect, useState, useTransition } from "react";
import { Button, Card, CardDescription, CardTitle } from "@banking/ui";

type MfaApiState = {
  data?: {
    factors: {
      all: Array<{ id: string; status: string; friendly_name?: string | null }>;
      totp: Array<{ id: string; status: string; friendly_name?: string | null }>;
    };
    assurance: {
      currentLevel: string | null;
      nextLevel: string | null;
    };
  };
  error?: string;
};

type EnrollmentState = {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
} | null;

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export function MfaManager({
  autoStart = false
}: {
  autoStart?: boolean;
}) {
  const [state, setState] = useState<MfaApiState["data"] | null>(null);
  const [loading, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrollment, setEnrollment] = useState<EnrollmentState>(null);
  const [code, setCode] = useState("");

  const loadState = async () => {
    const response = await fetch("/api/auth/mfa", { method: "GET" });
    const payload = await readJson<MfaApiState>(response);

    if (!response.ok || payload.error) {
      setError(payload.error ?? "Unable to load MFA state.");
      return;
    }

    setState(payload.data ?? null);
  };

  useEffect(() => {
    startTransition(() => {
      void loadState();
    });
  }, []);

  useEffect(() => {
    if (!autoStart || state?.factors?.totp?.length) {
      return;
    }

    startTransition(() => {
      void (async () => {
        setError(null);
        setMessage(null);

        const response = await fetch("/api/auth/mfa", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ action: "enroll" })
        });
        const payload = await readJson<{
          data?: EnrollmentState;
          error?: string;
        }>(response);

        if (!response.ok || payload.error || !payload.data) {
          setError(payload.error ?? "Unable to start MFA enrollment.");
          return;
        }

        setEnrollment(payload.data);
        await loadState();
      })();
    });
  }, [autoStart, state?.factors?.totp?.length]);

  const handleEnroll = async () => {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/auth/mfa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ action: "enroll" })
    });
    const payload = await readJson<{
      data?: EnrollmentState;
      error?: string;
    }>(response);

    if (!response.ok || payload.error || !payload.data) {
      setError(payload.error ?? "Unable to start MFA enrollment.");
      return;
    }

    setEnrollment(payload.data);
    await loadState();
  };

  const handleVerify = async () => {
    if (!enrollment || !code) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setError(null);
    setMessage(null);

    const response = await fetch("/api/auth/mfa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "verify",
        factorId: enrollment.factorId,
        code
      })
    });
    const payload = await readJson<{ error?: string }>(response);

    if (!response.ok || payload.error) {
      setError(payload.error ?? "Unable to verify MFA code.");
      return;
    }

    setEnrollment(null);
    setCode("");
    setMessage("MFA is enabled for this account.");
    await loadState();
  };

  const handleUnenroll = async (factorId: string) => {
    setError(null);
    setMessage(null);

    const response = await fetch("/api/auth/mfa", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "unenroll",
        factorId
      })
    });
    const payload = await readJson<{ error?: string }>(response);

    if (!response.ok || payload.error) {
      setError(
        payload.error ??
          "Unable to remove MFA. If this factor is already verified, sign in with MFA first and try again."
      );
      return;
    }

    setMessage("MFA factor removed.");
    await loadState();
  };

  const totpFactors = state?.factors?.totp ?? [];

  return (
    <Card className="space-y-4" id="mfa">
      <div>
        <CardTitle>Optional multi-factor authentication</CardTitle>
        <CardDescription>
          TOTP-based MFA is available for customers who want step-up protection.
        </CardDescription>
      </div>
      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
        Current assurance level: {state?.assurance?.currentLevel ?? "aal1"}.
        Next level: {state?.assurance?.nextLevel ?? "aal2"}.
      </div>
      {totpFactors.length === 0 && !enrollment ? (
        <Button disabled={loading} onClick={() => startTransition(() => void handleEnroll())} type="button">
          Start TOTP setup
        </Button>
      ) : null}
      {enrollment ? (
        <div className="space-y-4 rounded-2xl bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-900">Scan this QR code in your authenticator app.</p>
          <Image
            alt="MFA QR code"
            className="h-40 w-40 rounded-2xl border border-slate-200 bg-white p-2"
            height={160}
            src={`data:image/svg+xml;utf-8,${encodeURIComponent(enrollment.qrCode)}`}
            width={160}
          />
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm text-slate-600">
            Secret: <span className="font-mono text-slate-900">{enrollment.secret}</span>
          </div>
          <input
            className="h-11 w-full rounded-2xl border border-slate-200 px-4"
            maxLength={6}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Enter 6-digit code"
            type="text"
            value={code}
          />
          <div className="flex gap-3">
            <Button disabled={loading} onClick={() => startTransition(() => void handleVerify())} type="button">
              Verify MFA
            </Button>
            <Button
              disabled={loading}
              onClick={() => {
                setEnrollment(null);
                setCode("");
              }}
              type="button"
              variant="ghost"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
      {totpFactors.length > 0 ? (
        <div className="space-y-3">
          {totpFactors.map((factor) => (
            <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3" key={factor.id}>
              <div>
                <p className="font-medium text-slate-950">
                  {factor.friendly_name || "Authenticator app"}
                </p>
                <p className="text-sm text-slate-500">Status: {factor.status}</p>
              </div>
              <Button
                disabled={loading}
                onClick={() => startTransition(() => void handleUnenroll(factor.id))}
                type="button"
                variant="secondary"
              >
                Remove MFA
              </Button>
            </div>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
