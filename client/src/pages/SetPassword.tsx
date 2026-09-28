import { useState } from "react";
import { Link } from "wouter";
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
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function SetPassword() {
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const setupMutation = trpc.auth.setupPassword.useMutation({
    onSuccess: () => setDone(true),
    onError: err => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setupMutation.mutate({ token, password });
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
              {done ? "You're all set" : "Set your password"}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {done
                ? "Your password has been saved."
                : "Choose a password for your Layer One portal account."}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {done ? (
              <div className="text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto" />
                <p className="text-slate-300 text-sm">
                  You can now sign in with your email address and new password.
                </p>
                <Link href="/login">
                  <Button className="w-full bg-[#0A84FF] hover:bg-[#3d9dff] text-white font-semibold">
                    Sign In →
                  </Button>
                </Link>
              </div>
            ) : !token ? (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                This link is missing its token. Please use the link from your
                email, or ask your Layer One admin for a new invite.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-white">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="new-password"
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
                  <p className="text-xs text-slate-500">At least 8 characters.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-white">
                    Confirm password
                  </Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
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
                  disabled={setupMutation.isPending}
                  className="w-full bg-[#0A84FF] hover:bg-[#3d9dff] text-white font-semibold"
                >
                  {setupMutation.isPending ? "Saving…" : "Save Password →"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
