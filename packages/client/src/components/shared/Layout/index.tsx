import { Link, Outlet } from "react-router";
import { Flag, BarChart3, History, Settings, LogOut, WifiOff, List, Home, PenLine } from "lucide-react";
import { useLayout } from "./useLayout";
import { DeckSwitcher } from "../DeckSwitcher";

export function Layout() {
  const { online, isPlaying, location, handleLogout, prefix } = useLayout();

  const homePath = `${prefix}`;
  const historyPath = `${prefix}/history`;
  const sessionsPath = `${prefix}/sessions`;
  const mnemonicsPath = `${prefix}/mnemonics`;
  const analyticsPath = `${prefix}/analytics`;
  const settingsPath = `${prefix}/settings`;

  return (
    <div className={`ambient-bg min-h-screen text-white ${isPlaying ? "" : "pb-20 sm:pb-0"}`}>
      {/* Desktop header */}
      <header className={`relative z-50 border-b border-surface-700/40 bg-surface-900/80 backdrop-blur-lg ${isPlaying ? "hidden" : "hidden sm:block"}`}>
        <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to={homePath} className="group flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-gold-500 shadow-md shadow-emerald-900/30 transition-transform duration-300 group-hover:rotate-6">
                <Flag className="h-4 w-4 text-white" />
              </div>
              <span className="font-display text-lg italic tracking-tight">Flag Quiz</span>
            </Link>
            <DeckSwitcher />
          </div>
          <div className="flex items-center gap-0.5">
            {!online && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-2.5 py-1.5 text-xs font-medium text-red-400">
                <WifiOff className="h-3.5 w-3.5" />
                <span>Offline</span>
              </div>
            )}
            <DesktopNavLink to={historyPath} icon={<History className="h-4 w-4" />} label="History" active={location.pathname.startsWith(historyPath)} />
            <DesktopNavLink to={sessionsPath} icon={<List className="h-4 w-4" />} label="Sessions" active={location.pathname.startsWith(sessionsPath)} />
            <DesktopNavLink to={mnemonicsPath} icon={<PenLine className="h-4 w-4" />} label="Notes" active={location.pathname === mnemonicsPath} />
            <DesktopNavLink to={analyticsPath} icon={<BarChart3 className="h-4 w-4" />} label="Analytics" active={location.pathname === analyticsPath} />
            <DesktopNavLink to={settingsPath} icon={<Settings className="h-4 w-4" />} label="Settings" active={location.pathname === settingsPath} />
            <button
              onClick={handleLogout}
              className="ml-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm text-surface-500 transition-all duration-200 hover:bg-surface-800/60 hover:text-surface-300 cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile header */}
      <header className={`relative z-50 flex items-center justify-between border-b border-surface-700/40 bg-surface-900/80 backdrop-blur-lg px-4 py-3 sm:hidden ${isPlaying ? "hidden" : ""}`}>
        <div className="flex items-center gap-2">
          <Link to={homePath} className="group flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-gold-500 shadow-md shadow-emerald-900/30">
              <Flag className="h-4 w-4 text-white" />
            </div>
          </Link>
          <DeckSwitcher />
        </div>
        <div className="flex items-center gap-2">
          {!online && <WifiOff className="h-4 w-4 text-red-400" />}
          <button
            onClick={handleLogout}
            className="rounded-xl p-2.5 text-surface-500 active:bg-surface-800 cursor-pointer"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main key={location.pathname} className="animate-page-enter mx-auto max-w-5xl px-4 py-5 sm:py-6">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 flex border-t border-surface-700/40 bg-surface-900/90 backdrop-blur-lg sm:hidden ${isPlaying ? "hidden" : ""}`}>
        <MobileNavLink to={homePath} icon={<Home className="h-5 w-5" />} label="Home" active={location.pathname === homePath} />
        <MobileNavLink to={historyPath} icon={<History className="h-5 w-5" />} label="History" active={location.pathname.startsWith(historyPath)} />
        <MobileNavLink to={sessionsPath} icon={<List className="h-5 w-5" />} label="Sessions" active={location.pathname.startsWith(sessionsPath)} />
        <MobileNavLink to={mnemonicsPath} icon={<PenLine className="h-5 w-5" />} label="Notes" active={location.pathname === mnemonicsPath} />
        <MobileNavLink to={analyticsPath} icon={<BarChart3 className="h-5 w-5" />} label="Analytics" active={location.pathname === analyticsPath} />
        <MobileNavLink to={settingsPath} icon={<Settings className="h-5 w-5" />} label="Settings" active={location.pathname === settingsPath} />
      </nav>
    </div>
  );
}

function DesktopNavLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? "bg-surface-800/80 text-white"
          : "text-surface-500 hover:bg-surface-800/40 hover:text-surface-300"
      }`}
    >
      {icon}
      <span>{label}</span>
      {active && (
        <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-emerald-500" />
      )}
    </Link>
  );
}

function MobileNavLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-all duration-200 ${
        active
          ? "text-emerald-400"
          : "text-surface-600"
      }`}
    >
      <span className={`transition-transform duration-200 ${active ? "scale-110" : ""}`}>
        {icon}
      </span>
      {label}
      {active && (
        <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-emerald-400" />
      )}
    </Link>
  );
}
