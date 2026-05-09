import { useHistoryList, type SortKey, type StateFilter } from "./useHistoryList";
import { PageSkeleton } from "../../components/ui/skeleton";
import { FilterSelect } from "../../components/ui/filter-select";
import { CONTINENT_LABELS } from "../../lib/labels";
import { FlagRow } from "./FlagRow";

export function HistoryList() {
  const {
    statsMap,
    progressMap,
    sparklines,
    loading,
    sortKey,
    setSortKey,
    continentFilter,
    setContinentFilter,
    stateFilter,
    setStateFilter,
    mnemonicFilter,
    setMnemonicFilter,
    search,
    setSearch,
    sortedFlags,
  } = useHistoryList();

  if (loading) return <PageSkeleton rows={8} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="font-display text-3xl italic">History</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search flags..."
        className="w-full rounded-xl border border-surface-700/80 bg-surface-800/60 px-4 py-3 text-sm text-white placeholder-surface-500 italic backdrop-blur-sm transition-all duration-200 focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
      />

      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap gap-2 bg-surface-950/80 px-4 py-2 backdrop-blur-lg">
        <FilterSelect
          value={continentFilter}
          onChange={setContinentFilter}
          options={[
            { value: "all", label: "All continents" },
            ...Object.entries(CONTINENT_LABELS).map(([v, l]) => ({ value: v, label: l })),
          ]}
        />
        <FilterSelect
          value={stateFilter}
          onChange={(v) => setStateFilter(v as StateFilter)}
          options={[
            { value: "all", label: "All states" },
            { value: "new", label: "New" },
            { value: "learning", label: "Learning" },
            { value: "review", label: "Review" },
          ]}
        />
        <FilterSelect
          value={mnemonicFilter}
          onChange={setMnemonicFilter}
          options={[
            { value: "all", label: "All notes" },
            { value: "has", label: "Has note" },
            { value: "none", label: "No note" },
          ]}
        />
        <FilterSelect
          value={sortKey}
          onChange={(v) => setSortKey(v as SortKey)}
          options={[
            { value: "name", label: "Sort: Name" },
            { value: "accuracy", label: "Sort: Accuracy" },
            { value: "last_seen", label: "Sort: Last seen" },
            { value: "due", label: "Sort: Due date" },
          ]}
        />
      </div>

      <div className="text-sm font-medium text-surface-500">{sortedFlags.length} flags</div>

      <div className="space-y-2">
        {sortedFlags.map((flag) => {
          const stats = statsMap.get(flag.code);
          const progress = progressMap.get(flag.code);

          return (
            <FlagRow
              key={flag.code}
              flag={flag}
              state={progress?.state ?? 0}
              mnemonic={progress?.mnemonic}
              sparklineData={sparklines[flag.code]}
              accuracy={stats?.accuracy}
              attemptCount={stats?.attempt_count}
            />
          );
        })}
      </div>
    </div>
  );
}
