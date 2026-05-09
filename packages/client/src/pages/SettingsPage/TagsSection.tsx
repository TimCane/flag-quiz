import { useState, useRef, useEffect } from "react";
import { type Tag } from "@flag-quiz/shared";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ChevronDown, ChevronRight, GripVertical, Trash2, Plus } from "lucide-react";
import { useTagsSection } from "./useTagsSection";

interface TagRowProps {
  tag: Tag;
  index: number;
  dragIndex: number | null;
  dragOverIndex: number | null;
  onDragStart: (i: number) => void;
  onDragOver: (e: React.DragEvent, i: number) => void;
  onDrop: (i: number) => void;
  onDragEnd: () => void;
  onUpdate: (id: string, updates: Partial<Pick<Tag, "name" | "description">>) => void;
  onDelete: (id: string) => void;
  autoFocusName: boolean;
}

function TagRow({
  tag,
  index,
  dragIndex,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onUpdate,
  onDelete,
  autoFocusName,
}: TagRowProps) {
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

  return (
    <div
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      className={`flex items-start gap-2 rounded-xl px-3 py-3 transition-all duration-200 ${
        dragOverIndex === index && dragIndex !== index
          ? "bg-emerald-500/10 border border-emerald-500/30"
          : "bg-surface-800/20 border border-transparent"
      } ${dragIndex === index ? "opacity-50" : ""}`}
    >
      <div className="mt-2.5 cursor-grab text-surface-600 hover:text-surface-400 active:cursor-grabbing">
        <GripVertical className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1.5">
        <input
          ref={nameRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleKeyDown}
          placeholder="Tag name..."
          className="w-full rounded-lg border border-surface-700/80 bg-surface-800/60 px-3 py-2 text-sm font-medium text-white placeholder-surface-600 backdrop-blur-sm transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescBlur}
          onKeyDown={handleKeyDown}
          placeholder="Description (shown on presentation slides)..."
          className="w-full rounded-lg border border-surface-700/80 bg-surface-800/60 px-3 py-2 text-xs text-surface-400 placeholder-surface-600 backdrop-blur-sm transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
        />
      </div>
      <button
        onClick={() => onDelete(tag.id)}
        className="mt-2.5 cursor-pointer text-surface-600 hover:text-red-400 transition-colors duration-200"
        title="Delete tag"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TagsSection() {
  const {
    tags,
    loading,
    expanded,
    setExpanded,
    addTag,
    updateTag,
    deleteTag,
    reorder,
  } = useTagsSection();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [newTagId, setNewTagId] = useState<string | null>(null);

  if (loading) return null;

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    if (dragIndex !== null && dragIndex !== index) {
      reorder(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  async function handleAdd() {
    const id = await addTag();
    if (id) setNewTagId(id);
  }

  return (
    <Card>
      <CardHeader>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between min-h-[44px] cursor-pointer"
        >
          <CardTitle>Tags</CardTitle>
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-surface-500 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-5 w-5 text-surface-500 transition-transform duration-200" />
          )}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-2">
          {tags.length === 0 && (
            <p className="text-sm text-surface-500 italic">
              No tags yet. Add one to start grouping flags.
            </p>
          )}
          {tags.map((tag, index) => (
            <TagRow
              key={tag.id}
              tag={tag}
              index={index}
              dragIndex={dragIndex}
              dragOverIndex={dragOverIndex}
              onDragStart={setDragIndex}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onUpdate={updateTag}
              onDelete={deleteTag}
              autoFocusName={tag.id === newTagId}
            />
          ))}
          <Button
            onClick={handleAdd}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Tag
          </Button>
        </CardContent>
      )}
    </Card>
  );
}
