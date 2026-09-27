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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
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
    <div className="min-h-screen bg-[#06111f] text-white flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-[#0a1a2e] border-white/10">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">
            Sign In
          </CardTitle>
          <CardDescription className="text-[#b7c5d5]">
            Access your Layer One Staging portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="bg-white/5 border-white/15 text-white placeholder:text-[#5b6b7f]"
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
                className="bg-white/5 border-white/15 text-white placeholder:text-[#5b6b7f]"
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
              className="w-full bg-[#39a7ff] hover:bg-[#2b8fe0] text-white font-semibold"
            >
              {loginMutation.isPending ? "Signing in…" : "Sign In"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-[#b7c5d5]">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-[#39a7ff] font-semibold hover:underline"
            >
              Create one
            </Link>
          </p>
          <p className="mt-4 text-center text-sm">
            <Link
              href="/"
              className="text-[#5b6b7f] hover:text-white transition-colors"
            >
              ← Back to home
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
