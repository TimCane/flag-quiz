import { Link } from "react-router";
import { Flag, LogOut } from "lucide-react";
import { useDeckPicker } from "./useDeckPicker";
import { Spinner } from "../../components/ui/spinner";
import { flagImageUrl } from "../../lib/flag-image";

export function DeckPicker() {
  const { decks, loading, error, handleLogout } = useDeckPicker();

  return (
    <div className="ambient-bg min-h-screen text-white">
      <header className="border-b border-surface-700/40 bg-surface-900/80 backdrop-blur-lg">
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-gold-500 shadow-md shadow-emerald-900/30">
              <Flag className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-lg italic tracking-tight">Flag Quiz</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-surface-500 transition-all duration-200 hover:bg-surface-800/60 hover:text-surface-300 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-16 animate-fade-in">
        <div className="mb-10">
          <h1 className="font-display text-3xl italic tracking-tight sm:text-4xl">
            Pick a deck
          </h1>
          <p className="mt-2 text-surface-400">
            Each deck has its own progress, history and analytics.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-in">
            {decks.map((deck) => (
              <Link
                key={deck.id}
                to={`/${deck.id}`}
                className="group relative overflow-hidden rounded-2xl border border-surface-700/60 bg-surface-900/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/40 hover:bg-surface-900/80 hover:shadow-xl hover:shadow-emerald-900/10 focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:outline-none"
              >
                <div className="mb-4 grid grid-cols-2 gap-1.5">
                  {deck.sampleFlags.map((f) => (
                    <div
                      key={f.code}
                      className="aspect-[3/2] overflow-hidden rounded-md border border-surface-700/40 bg-surface-800"
                    >
                      <img
                        src={flagImageUrl(deck.id, { code: f.code, ext: f.ext })}
                        alt={f.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                <h2 className="font-display text-xl italic tracking-tight text-white">
                  {deck.name}
                </h2>
                <p className="mt-1 text-sm text-surface-400">{deck.description}</p>
                <div className="mt-4 flex items-center gap-4 text-xs">
                  <span className="text-surface-500">
                    <span className="font-medium text-surface-300">{deck.flagCount}</span> flags
                  </span>
                  {deck.dueCount > 0 && (
                    <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-medium text-amber-300">
                      {deck.dueCount} due
                    </span>
                  )}
                  {deck.newCount > 0 && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-300">
                      {deck.newCount} new
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
