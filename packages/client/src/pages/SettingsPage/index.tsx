import { useSettingsPage } from "./useSettingsPage";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";
import { SettingRow } from "./SettingRow";
import { TagsSection } from "./TagsSection";
import { PresentationSection } from "./PresentationSection";

export function SettingsPage() {
  const {
    loading,
    saving,
    saved,
    expandedCategories,
    handleUpdate,
    toggleCategory,
    grouped,
    categories,
  } = useSettingsPage();

  if (loading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="skeleton-shimmer h-8 w-32 rounded-lg" />
        <div className="skeleton-shimmer h-40 rounded-2xl" />
        <div className="skeleton-shimmer h-40 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="font-display text-3xl italic">Settings</h1>

      {categories.map((category) => {
        const isExpanded = expandedCategories.has(category);
        const items = grouped.get(category)!;

        return (
          <Card key={category}>
            <CardHeader>
              <button
                onClick={() => toggleCategory(category)}
                className="flex w-full items-center justify-between min-h-[44px] cursor-pointer"
              >
                <CardTitle>{category}</CardTitle>
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-surface-500 transition-transform duration-200" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-surface-500 transition-transform duration-200" />
                )}
              </button>
            </CardHeader>
            {isExpanded && (
              <CardContent className="space-y-4">
                {items.map((setting) => (
                  <SettingRow
                    key={setting.key}
                    setting={setting}
                    isSaving={saving === setting.key}
                    isSaved={saved === setting.key}
                    onUpdate={handleUpdate}
                  />
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}

      <TagsSection />
      <PresentationSection />
    </div>
  );
}
