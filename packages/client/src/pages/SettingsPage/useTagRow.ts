import { useState, useRef, useEffect } from "react";
import { type Tag } from "@flag-quiz/shared";

interface UseTagRowProps {
  tag: Tag;
  autoFocusName: boolean;
  onUpdate: (id: string, updates: Partial<Pick<Tag, "name" | "description" | "type">>) => void;
}

export function useTagRow({ tag, autoFocusName, onUpdate }: UseTagRowProps) {
  const [name, setName] = useState(tag.name);
  const [description, setDescription] = useState(tag.description);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(tag.name);
    setDescription(tag.description);
  }, [tag.name, tag.description]);

  useEffect(() => {
    if (autoFocusName) nameRef.current?.focus();
  }, [autoFocusName]);

  function handleNameBlur() {
    if (name !== tag.name) onUpdate(tag.id, { name });
  }

  function handleDescBlur() {
    if (description !== tag.description) onUpdate(tag.id, { description });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
  }

  return {
    name,
    setName,
    description,
    setDescription,
    nameRef,
    handleNameBlur,
    handleDescBlur,
    handleKeyDown,
  };
}
