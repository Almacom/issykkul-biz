"use client";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { supabase } from "@/lib/supabase";
import { useAccount } from "./useAccount";

export function Login() {
  const t = useTranslations("account");
  const locale = useLocale();
  const router = useRouter();
  const { session, loading } = useAccount();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && session) router.replace("/cabinet");
  }, [loading, session, router]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const prefix = locale === "ru" ? "" : `/${locale}`;
    const { error } = await supabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${location.origin}${prefix}/cabinet`, shouldCreateUser: true },
    });
    setBusy(false);
    if (error) setError(error.status === 429 ? t("tooMany") : error.message);
    else setStep("code");
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const { error } = await supabase().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
    setBusy(false);
    if (error) setError(t("badCode"));
    else router.replace("/cabinet");
  }

  return (
    <div className="acc-box">
      <h1>{t("loginTitle")}</h1>
      {step === "email" ? (
        <form onSubmit={send} className="acc-form">
          <p className="muted">{t("loginLead")}</p>
          <label>{t("email")}
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
          </label>
          <button className="btn" disabled={busy}>{busy ? "…" : t("sendLink")}</button>
        </form>
      ) : (
        <form onSubmit={verify} className="acc-form">
          <p>{t("sent", { email })}</p>
          <label>{t("code")}
            <input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} maxLength={10} />
          </label>
          <button className="btn" disabled={busy}>{busy ? "…" : t("signIn")}</button>
          <button type="button" className="linkbtn" onClick={() => { setStep("email"); setCode(""); }}>{t("otherEmail")}</button>
        </form>
      )}
      {error && <p className="acc-error">{error}</p>}
    </div>
  );
}
