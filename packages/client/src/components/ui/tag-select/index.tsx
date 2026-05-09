import { type Tag } from "@flag-quiz/shared";
import { ChevronDown, Check } from "lucide-react";
import { useTagSelect } from "./useTagSelect";

interface TagSelectProps {
  tags: Tag[];
  selectedIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagSelect({ tags, selectedIds, onChange }: TagSelectProps) {
  const { open, ref, select, toggleOpen, selectedName } = useTagSelect({
    tags,
    selectedIds,
    onChange,
  });

  if (tags.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-surface-700/80 bg-surface-800/60 px-3 py-2 text-xs text-surface-400 backdrop-blur-sm transition-all duration-200 ease-out hover:border-surface-600 glow-border cursor-pointer"
      >
        <span className="truncate">
          {selectedName || "Assign tag..."}
        </span>
        <ChevronDown className={`h-3 w-3 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-surface-700/80 bg-surface-900 shadow-xl shadow-black/40 backdrop-blur-md">
          {tags.map((tag) => {
            const selected = selectedIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => select(tag.id)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors duration-150 cursor-pointer first:rounded-t-lg last:rounded-b-lg ${
                  selected
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-surface-400 hover:bg-surface-800/60 hover:text-white"
                }`}
              >
                <div className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                  selected
                    ? "border-emerald-500 bg-emerald-500"
                    : "border-surface-600"
                }`}>
                  {selected && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className="truncate">{tag.name || "Unnamed tag"}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
