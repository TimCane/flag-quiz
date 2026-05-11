import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { collections, type Collection } from "@flag-quiz/shared";
import { useActiveCollection } from "../../../lib/collection-context";

export function useDeckSwitcher() {
  const { collection } = useActiveCollection();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const others = collections.filter((c) => c.id !== collection.id);

  function handleToggle() {
    setOpen((o) => !o);
  }

  function handleSelect(c: Collection) {
    setOpen(false);
    navigate(`/${c.id}`);
  }

  function handleClose() {
    setOpen(false);
  }

  return {
    collection,
    open,
    ref,
    others,
    handleToggle,
    handleSelect,
    handleClose,
  };
}
