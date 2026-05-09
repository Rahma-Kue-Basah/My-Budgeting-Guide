"use client";

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/auth-context";
import { login, register } from "@/lib/api";
import { cn } from "@/lib/utils";

export type AuthMode = "login" | "signup";

const DEFAULT_LOGIN_EMAIL = "demo@expensave.local";
const DEFAULT_LOGIN_PASSWORD = "Demo12345!";

const modeCopy: Record<
  AuthMode,
  {
    eyebrow: string;
    title: string;
    description: string;
    submit: string;
    switchLabel: string;
    switchCopy: string;
  }
> = {
  login: {
    eyebrow: "Welcome back",
    title: "Sign in to continue your budgeting flow",
    description:
      "Open your workspace, review transactions, and keep budgets visible without leaving the same interface language.",
    submit: "Sign in",
    switchLabel: "Create account",
    switchCopy: "Don’t have an account yet?",
  },
  signup: {
    eyebrow: "Create account",
    title: "Start a cleaner budgeting workspace",
    description:
      "Create your account, set up your wallets, and begin with a calmer entry point before moving into the app.",
    submit: "Create account",
    switchLabel: "Sign in",
    switchCopy: "Already have an account?",
  },
};

function FieldShell({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block rounded-[16px] bg-white/80 px-4 py-3 shadow-[inset_0_0_0_1px_rgb(0_0_0/0.05)] backdrop-blur-md dark:bg-[rgb(255_255_255/0.08)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
      <span className="mb-1.5 flex items-center gap-2 text-[11px] font-medium text-secondary">
        <span className="text-tertiary">{icon}</span>
        {label}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-[11px] text-tertiary">{hint}</span> : null}
    </label>
  );
}

function AuthModalInner({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser, status } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(mode === "login" ? DEFAULT_LOGIN_EMAIL : "");
  const [password1, setPassword1] = useState(mode === "login" ? DEFAULT_LOGIN_PASSWORD : "");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copy = modeCopy[mode];
  const nextPath = useMemo(
    () => (mode === "login" ? searchParams.get("next") ?? "/overview" : "/overview"),
    [mode, searchParams],
  );
  const switchHref = useMemo(() => {
    if (mode === "login") {
      return "/?auth=signup";
    }

    const next = searchParams.get("next");
    return next ? `/?auth=login&next=${encodeURIComponent(next)}` : "/?auth=login";
  }, [mode, searchParams]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(nextPath);
    }
  }, [nextPath, router, status]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (mode === "signup" && password1 !== password2) {
      setError("Passwords do not match.");
      setIsSubmitting(false);
      return;
    }

    const result =
      mode === "login"
        ? await login(email, password1)
        : await register({
            email,
            password1,
            password2,
            full_name: fullName,
          });

    if (result.error) {
      setError(result.error);
      setIsSubmitting(false);
      return;
    }

    await refreshUser();
    router.replace(nextPath);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          router.replace("/", { scroll: false });
        }
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="liquid-modal max-h-[calc(100vh-2rem)] w-full max-w-[min(560px,calc(100vw-1rem))] overflow-auto rounded-[30px] p-2 sm:max-w-[min(560px,calc(100vw-3rem))] sm:p-3"
      >
        <form
          onSubmit={handleSubmit}
          className="rounded-[24px] border border-white/34 bg-white/72 p-5 backdrop-blur-md dark:border-white/8 dark:bg-[rgb(14_19_32/0.46)] sm:p-6"
        >
          <div className="mb-5">
            <div className="inline-flex items-center rounded-full bg-[var(--accent)]/10 px-3 py-1 text-[11px] font-medium text-accent">
              {copy.eyebrow}
            </div>
            <h1 className="mt-3 text-xl font-semibold text-primary sm:text-2xl">
              {copy.title}
            </h1>
            <p className="mt-2 max-w-md text-sm leading-6 text-secondary">
              {copy.description}
            </p>
          </div>

          <div className="mb-5 inline-flex rounded-full bg-black/4 p-1 dark:bg-white/6">
            <Link
              href={
                nextPath !== "/overview"
                  ? `/?auth=login&next=${encodeURIComponent(nextPath)}`
                  : "/?auth=login"
              }
              scroll={false}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "login"
                  ? "bg-white text-primary shadow-[0_6px_14px_rgba(15,23,42,0.08)] dark:bg-white/12"
                  : "text-secondary hover:text-primary",
              )}
            >
              Sign in
            </Link>
            <Link
              href="/?auth=signup"
              scroll={false}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                mode === "signup"
                  ? "bg-white text-primary shadow-[0_6px_14px_rgba(15,23,42,0.08)] dark:bg-white/12"
                  : "text-secondary hover:text-primary",
              )}
            >
              Create account
            </Link>
          </div>

          <div className="space-y-3">
            {mode === "login" ? (
              <p className="rounded-[14px] bg-[rgb(0_122_255/0.08)] px-4 py-3 text-xs text-accent">
                Default login: {DEFAULT_LOGIN_EMAIL} / {DEFAULT_LOGIN_PASSWORD}
              </p>
            ) : null}

            {mode === "signup" ? (
              <FieldShell
                label="Full name"
                hint="Used to personalize your workspace."
                icon={<UserRound className="size-3.5" />}
              >
                <input
                  type="text"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Jane Doe"
                  className="w-full border-0 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-tertiary"
                />
              </FieldShell>
            ) : null}

              <FieldShell
                label="Email"
                icon={<Mail className="size-3.5" />}
              >
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full border-0 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-tertiary"
                />
              </FieldShell>

              <FieldShell
                label={mode === "login" ? "Password" : "Create password"}
                hint={
                  mode === "signup"
                    ? "Use at least one password you can remember comfortably."
                    : undefined
                }
                icon={<LockKeyhole className="size-3.5" />}
              >
                <input
                  type="password"
                  value={password1}
                  onChange={(event) => setPassword1(event.target.value)}
                  required
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  placeholder="••••••••"
                  className="w-full border-0 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-tertiary"
                />
              </FieldShell>

              {mode === "signup" ? (
                <FieldShell
                  label="Confirm password"
                  icon={<LockKeyhole className="size-3.5" />}
                >
                  <input
                    type="password"
                    value={password2}
                    onChange={(event) => setPassword2(event.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full border-0 bg-transparent text-sm font-medium text-primary outline-none placeholder:text-tertiary"
                  />
                </FieldShell>
              ) : null}
          </div>

          {error ? (
            <p className="mt-3 rounded-[14px] bg-[rgb(225_29_72/0.08)] px-4 py-3 text-xs text-danger">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-[14px] bg-[var(--accent)] text-sm font-medium text-white shadow-[0_18px_36px_rgb(0_122_255/0.2)] transition-all hover:-translate-y-0.5 hover:opacity-95 disabled:translate-y-0 disabled:opacity-50"
          >
            {isSubmitting
              ? mode === "login"
                ? "Signing in…"
                : "Creating account…"
              : copy.submit}
          </button>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/35 pt-4 text-sm dark:border-white/8">
            <p className="text-secondary">{copy.switchCopy}</p>
            <Link
              href={switchHref}
              scroll={false}
              className="inline-flex items-center gap-2 font-medium text-accent"
            >
              {copy.switchLabel}
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AuthModalOverlay({ mode }: { mode: AuthMode }) {
  return (
    <Suspense>
      <AuthModalInner mode={mode} />
    </Suspense>
  );
}
