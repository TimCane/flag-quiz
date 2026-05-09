import { type Flag, type Tag } from "@flag-quiz/shared";
import { FlagDisplay } from "../../components/game/FlagDisplay";
import { MnemonicTextarea } from "../../components/ui/mnemonic-textarea";
import { TagSelect } from "../../components/ui/tag-select";
import { CONTINENT_LABELS } from "../../lib/labels";

interface MnemonicCardProps {
  flag: Flag;
  mnemonic: string;
  isEdited: boolean;
  onEdit: (code: string, value: string) => void;
  tags: Tag[];
  assignedTagIds: string[];
  onTagsChange: (code: string, tagIds: string[]) => void;
}

export function MnemonicCard({ flag, mnemonic, isEdited, onEdit, tags, assignedTagIds, onTagsChange }: MnemonicCardProps) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border p-5 transition-all duration-200 ${
        isEdited
          ? "border-amber-500/40 bg-amber-500/5"
          : "border-surface-800/80 bg-surface-900/50 hover:bg-surface-800/30"
      }`}
    >
      <div className="rounded-xl bg-surface-800/30 p-2">
        <FlagDisplay code={flag.code} size="md" />
      </div>
      <div className="text-center">
        <span className="font-semibold text-surface-300">{flag.name}</span>
        <span className="ml-2 text-xs font-medium text-surface-600">
          {CONTINENT_LABELS[flag.continent]}
        </span>
      </div>
      <MnemonicTextarea
        value={mnemonic}
        onChange={(v) => onEdit(flag.code, v)}
        rows={2}
        label={false}
      />
      <div className="w-full">
        <TagSelect
          tags={tags}
          selectedIds={assignedTagIds}
          onChange={(ids) => onTagsChange(flag.code, ids)}
        />
      </div>
    </div>
  );
}
