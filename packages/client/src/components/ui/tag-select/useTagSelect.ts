import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { type Tag } from "@flag-quiz/shared";

interface UseTagSelectProps {
  tags: Tag[];
  selectedIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function useTagSelect({ tags, selectedIds, onChange }: UseTagSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const select = useCallback(
    (tagId: string) => {
      // Single select: toggle off if already selected, otherwise replace
      const next = selectedIds.includes(tagId) ? [] : [tagId];
      onChange(next);
      setOpen(false);
    },
    [selectedIds, onChange],
  );

  const toggleOpen = useCallback(() => setOpen((prev) => !prev), []);

  const selectedName = useMemo(() => {
    const selected = tags.find((t) => selectedIds.includes(t.id));
    return selected?.name || null;
  }, [tags, selectedIds]);

  return {
    open,
    ref,
    select,
    toggleOpen,
    selectedName,
  };
}
