import { Tag } from "lucide-react";

interface TagPillsProps {
  tagNames: string[];
}

export function TagPills({ tagNames }: TagPillsProps) {
  if (tagNames.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <Tag className="h-3 w-3 text-surface-500" />
      <span className="inline-block rounded-full bg-surface-800/60 border border-surface-700/60 px-2.5 py-0.5 text-xs text-surface-400">
        {tagNames[0]}
      </span>
    </div>
  );
}
