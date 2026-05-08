import { useLogin } from "./useLogin";
import { Button } from "../../components/ui/button";
import { Flag } from "lucide-react";

export function Login() {
  const { password, setPassword, error, loading, handleSubmit } = useLogin();

  return (
    <div className="ambient-bg flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-gold-500 shadow-xl shadow-emerald-900/30">
            <Flag className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-display text-3xl italic tracking-tight text-white">Flag Quiz</h1>
          <p className="text-sm text-surface-500">Learn the world's flags</p>
        </div>

        {/* Login form */}
        <div className="rounded-2xl border border-surface-700/60 bg-gradient-to-b from-surface-900/90 to-surface-900/70 p-6 shadow-xl shadow-black/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)] backdrop-blur-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoFocus
              className="w-full rounded-xl border border-surface-700/80 bg-surface-800/60 px-4 py-3.5 text-white placeholder-surface-500 italic backdrop-blur-sm transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
            />
            {error && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-center text-sm font-medium text-red-400 border border-red-500/20">
                {error}
              </p>
            )}
            <Button type="submit" disabled={loading} className="w-full" size="xl">
              {loading ? "..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
