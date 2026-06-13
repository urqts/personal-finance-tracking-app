"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, LineChart, PiggyBank, ShieldCheck, Loader2 } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

const authSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type AuthInput = z.infer<typeof authSchema>;

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirectTo") ?? "/dashboard";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  const form = useForm<AuthInput>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: AuthInput) {
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(values);
        if (error) throw error;
        toast.success("Welcome back!");
        router.push(redirectTo);
        router.refresh();
      } else {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
        const { data, error } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: { emailRedirectTo: `${siteUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}` },
        });
        if (error) throw error;
        if (data.session) {
          toast.success("Account created!");
          router.push(redirectTo);
          router.refresh();
        } else {
          toast.success("Check your email to confirm your account.");
          setMode("signin");
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand / marketing panel */}
      <div className="relative hidden flex-col justify-between bg-zinc-950 p-12 text-zinc-50 lg:flex">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Wallet className="h-6 w-6" /> {APP_NAME}
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Your money, beautifully organised.
          </h1>
          <p className="max-w-md text-zinc-400">
            Track spending, set budgets, hit savings goals and manage subscriptions —
            all in one calm, minimalist dashboard.
          </p>
          <div className="grid gap-4 pt-4 text-sm text-zinc-300">
            <Feature icon={<LineChart className="h-4 w-4" />} text="Real-time insights & trends" />
            <Feature icon={<PiggyBank className="h-4 w-4" />} text="Goals, budgets & subscriptions" />
            <Feature icon={<ShieldCheck className="h-4 w-4" />} text="Private by default with row-level security" />
          </div>
        </div>
        <p className="text-xs text-zinc-500">© {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </div>

      {/* Auth panel */}
      <div className="flex items-center justify-center p-6">
        <Card className="w-full max-w-sm border-0 shadow-none">
          <CardContent className="space-y-6 p-0">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground lg:hidden">
                <Wallet className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {mode === "signin" ? "Welcome back" : "Create your account"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {mode === "signin" ? `Sign in to continue to ${APP_NAME}` : `Start tracking with ${APP_NAME}`}
              </p>
            </div>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...form.register("email")} />
                {form.formState.errors.email && <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} placeholder="••••••••" {...form.register("password")} />
                {form.formState.errors.password && <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); form.reset(); }}
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Feature({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">{icon}</span>
      {text}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
