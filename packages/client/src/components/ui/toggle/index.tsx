interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, disabled }: ToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative h-8 w-14 rounded-full transition-all duration-200 ${
        checked
          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-inner shadow-emerald-900/30"
          : "bg-surface-700/80"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      <div
        className={`toggle-knob absolute top-1 h-6 w-6 rounded-full bg-white shadow-md ${
          checked ? "translate-x-7" : "translate-x-1"
        }`}
      />
    </button>
  );
}
