import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { humanizeError } from "@/lib/humanizeError";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      // Refresh the cached auth state before entering the dashboard:
      // otherwise the dashboard sees the stale "not signed in" cache
      // and bounces back to the homepage.
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    },
    onError: err => {
      setError(humanizeError(err));
    },
  });

  const resetMutation = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: () => {
      setResetSent(true);
      setResetError(null);
    },
    onError: err => setResetError(humanizeError(err)),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password });
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetError(null);
    resetMutation.mutate({ email: resetEmail || email });
  };

  return (
    <div
      className="min-h-screen text-white flex items-center justify-center px-4 py-10"
      style={{
        background:
          "radial-gradient(circle at top left, rgba(10,132,255,0.14) 0%, transparent 40%), linear-gradient(135deg, #0B1320, #0B1320)",
      }}
    >
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <img
              src="/images/layerone-logo-on-dark.png"
              alt="Layer One Staging"
              style={{ height: 56, width: "auto" }}
            />
          </Link>
        </div>
        <Card className="bg-[#111c30] border-white/10 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl font-bold text-white">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-slate-400">
              Sign in to your customer portal
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-[#0A84FF] focus-visible:border-[#0A84FF]"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(v => !v)}
                    className="text-xs text-[#0A84FF] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-[#0A84FF] focus-visible:border-[#0A84FF] pr-11"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full bg-[#0A84FF] hover:bg-[#3d9dff] text-white font-semibold"
              >
                {loginMutation.isPending ? "Signing in…" : "Sign In →"}
              </Button>
            </form>
            {showForgot && (
              <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-4">
                {resetSent ? (
                  <p className="text-sm text-slate-300">
                    If an account exists for that email, a password-reset link
                    is on its way. Check your inbox (and spam folder).
                  </p>
                ) : (
                  <form onSubmit={handleForgotSubmit} className="space-y-3">
                    <Label htmlFor="reset-email" className="text-white text-sm">
                      Email for password reset
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      required
                      value={resetEmail || email}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-[#0A84FF] focus-visible:border-[#0A84FF]"
                    />
                    {resetError && (
                      <p className="text-sm text-red-400">{resetError}</p>
                    )}
                    <Button
                      type="submit"
                      disabled={resetMutation.isPending}
                      variant="outline"
                      className="w-full border-white/15 text-white hover:bg-white/10"
                    >
                      {resetMutation.isPending ? "Sending…" : "Send Reset Link"}
                    </Button>
                  </form>
                )}
              </div>
            )}
            <p className="mt-6 text-center text-sm text-slate-400">
              Need an account?{" "}
              <Link
                href="/get-started"
                className="text-[#0A84FF] font-semibold hover:underline"
              >
                Contact us to get started
              </Link>
            </p>
            <p className="mt-4 text-center text-sm">
              <Link
                href="/"
                className="text-slate-500 hover:text-white transition-colors"
              >
                ← Back to home
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
