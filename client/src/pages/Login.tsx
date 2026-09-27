import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
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

export default function Login() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      // Refresh the cached auth state before entering the dashboard:
      // otherwise the dashboard sees the stale "not signed in" cache
      // and bounces back to the homepage.
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    },
    onError: err => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password });
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
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-white/5 border-white/15 text-white placeholder:text-slate-500 focus-visible:ring-[#0A84FF] focus-visible:border-[#0A84FF]"
                />
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
