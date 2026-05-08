import { useCountrySelect } from "./useCountrySelect";

interface CountrySelectProps {
  onSelect: (code: string) => void;
  disabled?: boolean;
}

export function CountrySelect({ onSelect, disabled }: CountrySelectProps) {
  const {
    query,
    isOpen,
    highlightIndex,
    openUpward,
    inputRef,
    listRef,
    containerRef,
    filtered,
    handleKeyDown,
    handleSelect,
    handleInputChange,
    handleFocus,
    handleBlur,
  } = useCountrySelect({ onSelect });

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search country..."
        disabled={disabled}
        autoFocus
        className="w-full rounded-xl border border-surface-700/80 bg-surface-800/60 px-4 py-3.5 text-white placeholder-surface-500 backdrop-blur-sm transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
      />
      {isOpen && filtered.length > 0 && (
        <div
          ref={listRef}
          className={`absolute z-10 max-h-56 w-full overflow-auto rounded-xl border border-surface-700/80 bg-surface-900/95 shadow-2xl shadow-black/40 backdrop-blur-md ${
            openUpward ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          {filtered.map((flag, i) => (
            <button
              key={flag.code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(flag.code);
              }}
              className={`w-full px-4 py-3.5 text-left text-sm transition-all duration-150 ${
                i === highlightIndex
                  ? "bg-emerald-600/20 text-white"
                  : "text-surface-400 hover:bg-surface-800/60"
              } ${i === 0 ? "rounded-t-xl" : ""} ${i === filtered.length - 1 ? "rounded-b-xl" : ""}`}
            >
              {flag.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
