import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { isAuthenticated } from "./lib/auth";
import { Layout } from "./components/shared/Layout";
import { Login } from "./pages/Login";
import { Home } from "./pages/Home";
import { Play } from "./pages/Play";
import { Summary } from "./pages/Summary";
import { HistoryList } from "./pages/HistoryList";
import { FlagDetail } from "./pages/FlagDetail";
import { SessionsList } from "./pages/SessionsList";
import { SessionDetail } from "./pages/SessionDetail";
import { Analytics } from "./pages/Analytics";
import { SettingsPage } from "./pages/SettingsPage";
import { MnemonicWorkshop } from "./pages/MnemonicWorkshop";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/play" element={<Play />} />
          <Route path="/summary/:sessionId" element={<Summary />} />
          <Route path="/history" element={<HistoryList />} />
          <Route path="/history/:flag" element={<FlagDetail />} />
          <Route path="/sessions" element={<SessionsList />} />
          <Route path="/sessions/:id" element={<SessionDetail />} />
          <Route path="/mnemonics" element={<MnemonicWorkshop />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
