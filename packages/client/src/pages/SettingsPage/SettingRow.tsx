import { type Setting } from "@flag-quiz/shared";
import { Toggle } from "../../components/ui/toggle";
import { Check } from "lucide-react";
import { useSettingRow } from "./useSettingRow";

interface SettingRowProps {
  setting: Setting;
  isSaving: boolean;
  isSaved: boolean;
  onUpdate: (key: string, value: string) => void;
}

export function SettingRow({ setting, isSaving, isSaved, onUpdate }: SettingRowProps) {
  const { localValue, setLocalValue, handleBlur, handleKeyDown } = useSettingRow({ setting, onUpdate });

  if (setting.type === "boolean") {
    return (
      <div className="flex items-center justify-between min-h-[48px] rounded-xl bg-surface-800/20 px-4 py-3 transition-all duration-200">
        <label className="text-sm font-medium text-surface-400">{setting.label}</label>
        <Toggle
          checked={setting.value === "true"}
          onChange={(checked) => onUpdate(setting.key, checked ? "true" : "false")}
          disabled={isSaving}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-surface-800/20 px-4 py-3 transition-all duration-200 sm:flex-row sm:items-center sm:gap-3">
      <label className="text-sm font-medium text-surface-400 sm:flex-1">{setting.label}</label>
      <div className="relative">
        <input
          type={setting.type === "number" ? "number" : "text"}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="w-full rounded-xl border border-surface-700/80 bg-surface-800/60 px-3 py-2.5 text-sm text-white backdrop-blur-sm transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none sm:w-32 sm:text-right"
        />
        {isSaved && (
          <Check className="absolute -right-6 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-400" />
        )}
      </div>
    </div>
  );
}
