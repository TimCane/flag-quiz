import { useMnemonicWorkshop } from "./useMnemonicWorkshop";
import { Button } from "../../components/ui/button";
import { FilterSelect } from "../../components/ui/filter-select";
import { Save } from "lucide-react";
import { CONTINENT_LABELS } from "../../lib/labels";
import { Spinner } from "../../components/ui/spinner";
import { MnemonicCard } from "./MnemonicCard";

export function MnemonicWorkshop() {
  const {
    edits,
    loading,
    saving,
    savedCount,
    filter,
    setFilter,
    continentFilter,
    setContinentFilter,
    search,
    setSearch,
    getDisplayMnemonic,
    handleEdit,
    handleSaveAll,
    filteredFlags,
    filledCount,
    totalFlags,
  } = useMnemonicWorkshop();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl italic">Mnemonic Workshop</h1>
          <p className="mt-1 text-sm text-surface-500">
            <span className="font-bold text-emerald-400">{filledCount}</span>/{totalFlags} flags have mnemonics
          </p>
        </div>
        {edits.size > 0 && (
          <Button onClick={handleSaveAll} disabled={saving} className="gap-2" variant="success">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : `Save ${edits.size} change${edits.size !== 1 ? "s" : ""}`}
          </Button>
        )}
        {savedCount > 0 && (
          <span className="inline-block rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-sm font-semibold text-emerald-400">
            Saved {savedCount} mnemonics
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="flex-1 rounded-xl border border-surface-700/80 bg-surface-800/60 px-4 py-3 text-sm text-white placeholder-surface-500 italic backdrop-blur-sm transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none sm:max-w-xs"
        />
        <FilterSelect
          value={continentFilter}
          onChange={setContinentFilter}
          options={[
            { value: "all", label: "All continents" },
            ...Object.entries(CONTINENT_LABELS).map(([v, l]) => ({ value: v, label: l })),
          ]}
        />
        <FilterSelect
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "empty", label: "Needs mnemonic" },
            { value: "filled", label: "Has mnemonic" },
          ]}
        />
      </div>

      <div className="text-sm font-medium text-surface-500">{filteredFlags.length} flags</div>

      <div className="space-y-3">
        {filteredFlags.map((flag) => (
          <MnemonicCard
            key={flag.code}
            flag={flag}
            mnemonic={getDisplayMnemonic(flag.code)}
            isEdited={edits.has(flag.code)}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {edits.size > 0 && (
        <div className="fixed bottom-20 left-4 right-4 sm:hidden">
          <Button onClick={handleSaveAll} disabled={saving} className="w-full gap-2 shadow-2xl" variant="success" size="xl">
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : `Save ${edits.size} change${edits.size !== 1 ? "s" : ""}`}
          </Button>
        </div>
      )}
    </div>
  );
}
