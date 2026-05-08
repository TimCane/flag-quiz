export function Spinner() {
  return (
    <div className="relative h-8 w-8">
      <div className="absolute inset-0 animate-spin rounded-full border-2 border-surface-700 border-t-emerald-500" />
      <div className="absolute inset-1 animate-spin rounded-full border border-surface-800 border-b-gold-400" style={{ animationDirection: "reverse", animationDuration: "0.8s" }} />
    </div>
  );
}
