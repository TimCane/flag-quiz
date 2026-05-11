import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { ErrorBoundary } from "react-error-boundary";
import { isAuthenticated } from "./lib/auth";
import { CollectionLayout } from "./lib/collection-context";
import { Layout } from "./components/shared/Layout";
import { Spinner } from "./components/ui/spinner";
import { Login } from "./pages/Login";
import { DeckPicker } from "./pages/DeckPicker";
import { Home } from "./pages/Home";
import { Play } from "./pages/Play";
import { Summary } from "./pages/Summary";
import { HistoryList } from "./pages/HistoryList";
import { FlagDetail } from "./pages/FlagDetail";
import { SessionsList } from "./pages/SessionsList";
import { SessionDetail } from "./pages/SessionDetail";
import { SettingsPage } from "./pages/SettingsPage";
import { MnemonicWorkshop } from "./pages/MnemonicWorkshop";

// Lazy-load heavy routes (recharts, reveal.js)
const Analytics = lazy(() => import("./pages/Analytics").then((m) => ({ default: m.Analytics })));
const Presentation = lazy(() => import("./pages/Presentation").then((m) => ({ default: m.Presentation })));

function LazyFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Spinner />
    </div>
  );
}

function ErrorFallback({ error, resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h2 className="text-lg font-semibold text-surface-200">Something went wrong</h2>
      <p className="max-w-md text-sm text-surface-400">{error instanceof Error ? error.message : "An unexpected error occurred"}</p>
      <button
        onClick={resetErrorBoundary}
        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
      >
        Try again
      </button>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Deck picker at root */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DeckPicker />
              </ProtectedRoute>
            }
          />

          {/* All in-deck routes — wrapped in CollectionLayout (validates :collection) */}
          <Route
            path="/:collection"
            element={
              <ProtectedRoute>
                <CollectionLayout />
              </ProtectedRoute>
            }
          >
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="play" element={<Play />} />
              <Route path="summary/:sessionId" element={<Summary />} />
              <Route path="history" element={<HistoryList />} />
              <Route path="history/:flag" element={<FlagDetail />} />
              <Route path="sessions" element={<SessionsList />} />
              <Route path="sessions/:id" element={<SessionDetail />} />
              <Route path="mnemonics" element={<MnemonicWorkshop />} />
              <Route path="analytics" element={<ErrorBoundary FallbackComponent={ErrorFallback}><Suspense fallback={<LazyFallback />}><Analytics /></Suspense></ErrorBoundary>} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="presentation" element={<ErrorBoundary FallbackComponent={ErrorFallback}><Suspense fallback={<LazyFallback />}><Presentation /></Suspense></ErrorBoundary>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
