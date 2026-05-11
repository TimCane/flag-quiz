import { useState, useRef, useEffect, useCallback } from "react";
import { useActiveCollection } from "../../../lib/collection-context";

interface UseItemSelectProps {
  onSelect: (code: string) => void;
}

export function useItemSelect({ onSelect }: UseItemSelectProps) {
  const { collection } = useActiveCollection();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [openUpward, setOpenUpward] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = query
    ? collection.flags.filter((f) => f.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  useEffect(() => {
    setHighlightIndex(0);
  }, [query]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || !isOpen) return;
    const item = list.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightIndex, isOpen]);

  const updateDropdownDirection = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    setOpenUpward(spaceBelow < 200 && spaceAbove > spaceBelow);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownDirection();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener("resize", updateDropdownDirection);
      return () => vv.removeEventListener("resize", updateDropdownDirection);
    }
  }, [isOpen, updateDropdownDirection]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (filtered[highlightIndex]) {
          handleSelect(filtered[highlightIndex].code);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  }

  function handleSelect(code: string) {
    setIsOpen(false);
    setQuery("");
    onSelect(code);
  }

  function handleInputChange(value: string) {
    setQuery(value);
    setIsOpen(true);
  }

  function handleFocus() {
    if (query) setIsOpen(true);
  }

  function handleBlur() {
    setTimeout(() => setIsOpen(false), 200);
  }

  return {
    itemLabel: collection.itemLabel,
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
  };
}
