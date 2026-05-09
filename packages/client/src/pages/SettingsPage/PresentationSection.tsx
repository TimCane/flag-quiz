import { useState } from "react";
import { useNavigate } from "react-router";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Toggle } from "../../components/ui/toggle";
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Play,
} from "lucide-react";
import { usePresentationSection } from "./usePresentationSection";

export function PresentationSection() {
  const {
    config,
    tags,
    loading,
    expanded,
    setExpanded,
    toggleTag,
    reorderTags,
    toggleOption,
    setFragmentDelay,
  } = usePresentationSection();

  const navigate = useNavigate();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  if (loading) return null;

  const selectedTags = config.tag_order
    .map((id) => tags.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => !!t);

  const unselectedTags = tags.filter((t) => !config.tag_order.includes(t.id));

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    if (dragIndex !== null && dragIndex !== index) {
      reorderTags(dragIndex, index);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  return (
    <Card>
      <CardHeader>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between min-h-[44px] cursor-pointer"
        >
          <CardTitle>Presentation</CardTitle>
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-surface-500 transition-transform duration-200" />
          ) : (
            <ChevronRight className="h-5 w-5 text-surface-500 transition-transform duration-200" />
          )}
        </button>
      </CardHeader>
      {expanded && (
        <CardContent className="space-y-5">
          {tags.length === 0 ? (
            <p className="text-sm text-surface-500 italic">
              Create tags first to configure the presentation.
            </p>
          ) : (
            <>
              {/* Tag group selection & ordering */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-surface-400">
                  Tag groups (drag to reorder)
                </label>

                {/* Selected tags - reorderable */}
                {selectedTags.map((tag, index) => (
                  <div
                    key={tag.id}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => {
                      setDragIndex(null);
                      setDragOverIndex(null);
                    }}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                      dragOverIndex === index && dragIndex !== index
                        ? "bg-emerald-500/10 border border-emerald-500/30"
                        : "bg-surface-800/20 border border-transparent"
                    } ${dragIndex === index ? "opacity-50" : ""}`}
                  >
                    <div className="cursor-grab text-surface-600 hover:text-surface-400 active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm text-white">{tag.name || "Unnamed"}</span>
                      {tag.description && (
                        <span className="ml-2 text-xs text-surface-500">
                          {tag.description}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => toggleTag(tag.id)}
                      className="rounded-lg px-2 py-1 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {/* Unselected tags */}
                {unselectedTags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center gap-2 rounded-xl bg-surface-800/10 border border-dashed border-surface-700/40 px-3 py-2.5"
                  >
                    <div className="w-4" />
                    <span className="flex-1 text-sm text-surface-500">
                      {tag.name || "Unnamed"}
                    </span>
                    <button
                      onClick={() => toggleTag(tag.id)}
                      className="rounded-lg px-2 py-1 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors duration-200 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-surface-800/20 px-4 py-3">
                  <span className="text-sm text-surface-400">Title slide</span>
                  <Toggle
                    checked={config.show_title_slide}
                    onChange={() => toggleOption("show_title_slide")}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-800/20 px-4 py-3">
                  <span className="text-sm text-surface-400">End slide</span>
                  <Toggle
                    checked={config.show_end_slide}
                    onChange={() => toggleOption("show_end_slide")}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-800/20 px-4 py-3">
                  <span className="text-sm text-surface-400">
                    Show notes
                  </span>
                  <Toggle
                    checked={config.show_mnemonics}
                    onChange={() => toggleOption("show_mnemonics")}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-800/20 px-4 py-3">
                  <span className="text-sm text-surface-400">
                    Show analytics
                  </span>
                  <Toggle
                    checked={config.show_analytics}
                    onChange={() => toggleOption("show_analytics")}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl bg-surface-800/20 px-4 py-3">
                  <span className="text-sm text-surface-400">
                    Auto-reveal delay (ms)
                  </span>
                  <input
                    type="number"
                    value={config.fragment_delay_ms}
                    onChange={(e) => setFragmentDelay(Math.max(0, parseInt(e.target.value) || 0))}
                    min={0}
                    step={100}
                    className="w-24 rounded-xl border border-surface-700/80 bg-surface-800/60 px-3 py-2 text-sm text-white text-right backdrop-blur-sm transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                  />
                </div>
              </div>

              {/* Launch button */}
              <Button
                onClick={() => navigate("/presentation")}
                disabled={config.tag_order.length === 0}
                variant="success"
                className="w-full gap-2"
              >
                <Play className="h-4 w-4" />
                Launch Presentation
              </Button>
              {config.tag_order.length === 0 && (
                <p className="text-xs text-surface-500 text-center">
                  Add at least one tag group to launch
                </p>
              )}
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
