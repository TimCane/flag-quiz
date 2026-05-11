import { Link } from "react-router";
import { ChevronDown } from "lucide-react";
import { useDeckSwitcher } from "./useDeckSwitcher";

export function DeckSwitcher() {
  const {
    collection,
    open,
    ref,
    others,
    handleToggle,
    handleSelect,
    handleClose,
  } = useDeckSwitcher();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 rounded-lg border border-surface-700/60 bg-surface-800/60 px-2.5 py-1.5 text-sm font-medium text-surface-200 transition-colors hover:bg-surface-800 hover:text-white cursor-pointer"
      >
        <span className="max-w-[12rem] truncate">{collection.name}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" className="absolute left-0 top-full z-50 mt-1.5 min-w-[14rem] overflow-hidden rounded-xl border border-surface-700/60 bg-surface-900/95 shadow-xl shadow-black/30 backdrop-blur-lg animate-dropdown-in">
          {others.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleSelect(c)}
              role="option"
              className="block w-full px-3 py-2 text-left text-sm text-surface-300 transition-colors hover:bg-surface-800/80 hover:text-white cursor-pointer"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-surface-500">{c.flags.length} flags</div>
            </button>
          ))}
          <div className="border-t border-surface-700/60">
            <Link
              to="/"
              onClick={handleClose}
              className="block px-3 py-2 text-xs font-medium text-surface-400 transition-colors hover:bg-surface-800/80 hover:text-white"
            >
              All decks →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
