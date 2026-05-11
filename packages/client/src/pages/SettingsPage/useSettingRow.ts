import { useState, useEffect } from "react";
import { type Setting } from "@flag-quiz/shared";

interface UseSettingRowProps {
  setting: Setting;
  onUpdate: (key: string, value: string) => void;
}

export function useSettingRow({ setting, onUpdate }: UseSettingRowProps) {
  const [localValue, setLocalValue] = useState(setting.value);

  useEffect(() => {
    setLocalValue(setting.value);
  }, [setting.value]);

  function handleBlur() {
    if (localValue !== setting.value) {
      onUpdate(setting.key, localValue);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  }

  return {
    localValue,
    setLocalValue,
    handleBlur,
    handleKeyDown,
  };
}
