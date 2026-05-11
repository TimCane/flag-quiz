import { useState } from "react";
import { useActiveCollection } from "../../../lib/collection-context";

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
  const { imageUrl, flagByCode } = useActiveCollection();
  const flag = flagByCode(code);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={`${sizes[size]} aspect-[3/2] flex items-center justify-center rounded-lg bg-surface-800 ring-1 ring-white/10 text-surface-500 font-mono text-sm uppercase`}
      >
        {code}
      </div>
    );
  }

  return (
    <img
      src={imageUrl(code)}
      alt={flag ? `Flag of ${flag.name}` : `Flag of ${code}`}
      className={`${sizes[size]} w-auto rounded-lg shadow-xl shadow-black/30 ring-1 ring-white/10 object-contain flag-reveal`}
      draggable={false}
      onError={() => setError(true)}
    />
  );
}
