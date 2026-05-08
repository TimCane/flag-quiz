interface FlagDisplayProps {
  code: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "h-16",
  md: "h-32",
  lg: "h-48",
};

export function FlagDisplay({ code, size = "lg" }: FlagDisplayProps) {
  return (
    <img
      src={`/flags/${code}.png`}
      alt={`Flag of ${code}`}
      className={`${sizes[size]} w-auto rounded-lg shadow-xl shadow-black/30 ring-1 ring-white/10 object-contain flag-reveal`}
      draggable={false}
    />
  );
}
