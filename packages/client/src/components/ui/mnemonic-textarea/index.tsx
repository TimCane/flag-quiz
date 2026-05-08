interface MnemonicTextareaProps {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  autoFocus?: boolean;
  label?: boolean;
}

export function MnemonicTextarea({
  value,
  onChange,
  rows = 2,
  autoFocus,
  label = true,
}: MnemonicTextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-surface-400">
          Mnemonic
        </label>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="How will you remember this flag? e.g. colors, shapes, associations..."
        rows={rows}
        autoFocus={autoFocus}
        className="w-full rounded-xl border border-surface-700/80 bg-surface-800/60 px-4 py-3 text-sm text-white placeholder-surface-600 italic transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none backdrop-blur-sm"
      />
    </div>
  );
}
