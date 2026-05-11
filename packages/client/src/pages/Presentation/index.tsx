import { useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Cell,
  PieChart, Pie, ResponsiveContainer,
} from "recharts";
import { usePresentation } from "./usePresentation";
import { Spinner } from "../../components/ui/spinner";
import { Button } from "../../components/ui/button";
import { Sparkline } from "../../components/ui/sparkline";
import { ArrowLeft } from "lucide-react";
import { RATING_LABELS, CONFIDENCE_COLORS, PIE_COLORS, groupColors } from "../../lib/labels";
import "reveal.js/reveal.css";
import "reveal.js/theme/black.css";
import "./presentation.css";

const FSRS_STATE_STYLES: Record<number, { label: string; border: string; text: string }> = {
  0: { label: "New", border: "border-surface-600", text: "text-surface-400" },
  1: { label: "Learning", border: "border-amber-600", text: "text-amber-400" },
  2: { label: "Reviewing", border: "border-emerald-600", text: "text-emerald-400" },
  3: { label: "Relearning", border: "border-red-600", text: "text-red-400" },
};

function formatStability(stability: number): string {
  if (stability >= 365) return `${(stability / 365).toFixed(1)} yr`;
  if (stability >= 30) return `${(stability / 30).toFixed(1)} mo`;
  if (stability >= 1) return `${Math.round(stability)}d`;
  return `${Math.round(stability * 24)}h`;
}

function formatDue(due: string): { label: string; style: string } {
  const diffDays = Math.round((new Date(due).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, style: "text-red-400 border-red-700" };
  if (diffDays === 0) return { label: "Due today", style: "text-amber-400 border-amber-700" };
  return { label: `Due in ${diffDays}d`, style: "text-surface-300 border-surface-700" };
}

function formatDifficulty(d: number): { label: string; color: string } {
  if (d <= 3) return { label: "Easy", color: "text-emerald-400 border-emerald-700" };
  if (d <= 6) return { label: "Medium", color: "text-amber-400 border-amber-700" };
  return { label: "Hard", color: "text-red-400 border-red-700" };
}

/** Reveal.js is configured with this width — used to calculate column sizes for side-by-side layouts */
const REVEAL_WIDTH = 1920;

function fsrsStatusPills(state: number, stability: number | null, difficulty: number | null, due: string | null) {
  const s = FSRS_STATE_STYLES[state] || FSRS_STATE_STYLES[0];
  return (
    <>
      <span className={`inline-flex items-center rounded-full border ${s.border} bg-surface-900/60 px-4 py-1.5 text-sm font-semibold ${s.text}`}>
        {s.label}
      </span>
      {stability !== null && stability > 0 && (
        <span className="inline-flex items-center gap-2 rounded-full border border-surface-700 bg-surface-900/60 px-4 py-1.5 text-sm">
          <span className="text-surface-500">Strength</span>
          <span className="font-mono font-bold text-surface-300">{formatStability(stability)}</span>
        </span>
      )}
      {difficulty !== null && (
        <span className={`inline-flex items-center gap-2 rounded-full border bg-surface-900/60 px-4 py-1.5 text-sm ${formatDifficulty(difficulty).color}`}>
          <span className="text-surface-500">Difficulty</span>
          <span className="font-mono font-bold">{formatDifficulty(difficulty).label}</span>
        </span>
      )}
      {due && (
        <span className={`inline-flex items-center rounded-full border bg-surface-900/60 px-4 py-1.5 text-sm font-medium ${formatDue(due).style}`}>
          {formatDue(due).label}
        </span>
      )}
    </>
  );
}

interface FlagAnalyticsProps {
  flag: { code: string; accuracy: number | null; attemptCount: number; avgReactionTimeMs: number | null; fsrsState: number; fsrsStability: number | null; fsrsDifficulty: number | null; fsrsDue: string | null };
  sparklines: Record<string, number[]> | undefined;
  sparklineWidth: number;
  sparklineHeight: number;
  /** CSS class applied to the accuracy/attempts row */
  textClass?: string;
  /** CSS class applied to the reaction time label */
  reactionClass?: string;
  /** CSS class applied to the FSRS pills container gap */
  pillGap?: string;
}

function FlagAnalyticsBlock({ flag, sparklines, sparklineWidth, sparklineHeight, textClass = "text-lg", reactionClass = "text-base", pillGap = "12px" }: FlagAnalyticsProps) {
  return (
    <>
      <div className="fragment mt-4" data-fragment-index="2">
        <div style={{ display: "flex", alignItems: "center", gap: "20px", justifyContent: "center" }} className={textClass}>
          <span className={`font-mono font-bold ${
            flag.accuracy !== null && flag.accuracy >= 80 ? "text-emerald-400"
              : flag.accuracy !== null && flag.accuracy >= 50 ? "text-amber-400"
              : "text-red-400"
          }`}>
            {flag.accuracy !== null ? `${flag.accuracy}%` : "—"}
          </span>
          <span className="text-surface-500">
            {flag.attemptCount} attempt{flag.attemptCount !== 1 ? "s" : ""}
          </span>
        </div>
        {sparklines?.[flag.code] && (
          <div className="mt-3 flex justify-center">
            <Sparkline data={sparklines[flag.code]} width={sparklineWidth} height={sparklineHeight} />
          </div>
        )}
        {flag.avgReactionTimeMs !== null && (
          <p className={`mt-2 ${reactionClass} text-surface-500`}>
            Avg. <span className="font-mono font-bold text-surface-300">
              {(flag.avgReactionTimeMs / 1000).toFixed(1)}s
            </span>
          </p>
        )}
      </div>
      <div className="fragment mt-3" data-fragment-index="3">
        <div style={{ display: "flex", justifyContent: "center", gap: pillGap, flexWrap: "wrap" }}>
          {fsrsStatusPills(flag.fsrsState, flag.fsrsStability, flag.fsrsDifficulty, flag.fsrsDue)}
        </div>
      </div>
    </>
  );
}

export function Presentation() {
  const {
    collection,
    imageUrl,
    flagByCode,
    slideGroups,
    config,
    analyticsData,
    loading,
    error,
    deckRef,
    initReveal,
    destroyReveal,
    handleBack,
  } = usePresentation();

  useEffect(() => {
    if (!loading && !error && slideGroups.length > 0 && config) {
      const delay = config.fragment_delay_ms ?? 500;
      const timer = setTimeout(() => initReveal(delay), 100);
      return () => {
        clearTimeout(timer);
        destroyReveal();
      };
    }
  }, [loading, error, slideGroups, config, initReveal, destroyReveal]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleBack();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleBack]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-950">
        <Spinner />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-950">
        <div className="text-red-400">{error || "No configuration found"}</div>
        <Button variant="outline" onClick={() => handleBack()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Button>
      </div>
    );
  }

  if (slideGroups.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface-950">
        <div className="text-surface-400">No flags assigned to selected tags</div>
        <Button variant="outline" onClick={() => handleBack()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Button>
      </div>
    );
  }

  const totalFlags = slideGroups.reduce((sum, g) => sum + g.flags.length, 0);
  const hasAnalytics = analyticsData && analyticsData.progress.length > 0;

  return (
    <div className="reveal" ref={deckRef}>
      <div className="slides">
        {/* Title slide */}
        {config.show_title_slide && (
          <section>
            <h1 className="text-6xl font-bold">My Flag<br />Learning Journey</h1>
            <p className="text-2xl text-surface-400 mt-4">{totalFlags} flags. 1 brain. No guarantees.</p>
            <p className="text-lg text-surface-500 mt-8">
              Use arrow keys to navigate &middot; &darr; for flags &middot; &rarr; for groups
            </p>
          </section>
        )}

        {/* FSRS explainer slide */}
        {config.show_analytics && (
          <section>
            <h2 className="text-5xl font-bold">How I Track Learning</h2>
            <p className="text-xl text-surface-400 mt-4">Each flag is tracked using spaced repetition (FSRS)</p>
            <div className="fragment mt-12 flex justify-center gap-6 flex-wrap">
              <div className="pres-card">
                <span className="text-3xl font-bold text-surface-400">New</span>
                <p className="text-sm text-surface-500 mt-2">Not yet studied — waiting in the queue</p>
              </div>
              <div className="pres-card pres-card--amber">
                <span className="text-3xl font-bold text-amber-400">Learning</span>
                <p className="text-sm text-surface-500 mt-2">Recently introduced — reviewed frequently</p>
              </div>
              <div className="pres-card pres-card--emerald">
                <span className="text-3xl font-bold text-emerald-400">Reviewing</span>
                <p className="text-sm text-surface-500 mt-2">Known well — intervals grow over time</p>
              </div>
              <div className="pres-card pres-card--red">
                <span className="text-3xl font-bold text-red-400">Relearning</span>
                <p className="text-sm text-surface-500 mt-2">Forgotten — back to short intervals</p>
              </div>
            </div>
            <div className="fragment pres-stat-row mt-9">
              <div>
                <p className="text-lg text-surface-400"><span className="font-bold text-white">Strength</span></p>
                <p className="text-sm text-surface-500 mt-1">How long a memory is expected to last</p>
              </div>
              <div>
                <p className="text-lg text-surface-400"><span className="font-bold text-white">Due date</span></p>
                <p className="text-sm text-surface-500 mt-1">When the next review is scheduled</p>
              </div>
              <div>
                <p className="text-lg text-surface-400"><span className="font-bold text-white">Difficulty</span></p>
                <p className="text-sm text-surface-500 mt-1">How hard the algorithm thinks this flag is</p>
              </div>
            </div>
            <div className="fragment mt-9 text-center">
              <p className="text-lg text-surface-400"><span className="font-bold text-white">Sparkline</span></p>
              <p className="text-sm text-surface-500 mt-1">A mini chart showing my recent results for each flag</p>
              <div className="flex justify-center items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <svg width="60" height="20">
                    <polyline points="0,18 10,14 20,4 30,8 40,2 50,6 60,4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500" />
                  </svg>
                  <span className="text-sm text-emerald-400">Improving</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="60" height="20">
                    <polyline points="0,4 10,8 20,6 30,14 40,10 50,16 60,18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500" />
                  </svg>
                  <span className="text-sm text-red-400">Struggling</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="60" height="20">
                    <polyline points="0,10 10,8 20,12 30,10 40,11 50,9 60,10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500" />
                  </svg>
                  <span className="text-sm text-amber-400">Steady</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tag group sections */}
        {slideGroups.map((group) => (
          <section key={group.tag.id}>
            {/* Group title slide */}
            <section>
              <h2 className="text-5xl font-bold">{group.tag.name}</h2>
              {group.tag.description && (
                <p className="text-xl text-surface-400 mt-4">{group.tag.description}</p>
              )}
              <p className="text-lg text-surface-500 mt-8">
                {group.flags.length} flag{group.flags.length !== 1 ? "s" : ""} &middot; press &darr; to begin
              </p>
            </section>

            {group.tag.type === "similar" && group.flags.length > 1 ? (
              /* Similar tag: all flags side-by-side on one slide */
              <section>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "center", gap: "48px", flexWrap: "wrap" }}>
                  {group.flags.map((flag) => {
                    const colWidth = Math.min(400, Math.floor(REVEAL_WIDTH / group.flags.length - 60));
                    const imgHeight = group.flags.length <= 3 ? "220px" : "160px";
                    const nameSize = group.flags.length > 4 ? "text-2xl" : "text-3xl";
                    return (
                    <div key={flag.code} style={{ textAlign: "center", maxWidth: `${colWidth}px` }}>
                      <div className="flag-container" style={{ display: "inline-block" }}>
                        <img
                          src={imageUrl(flag.code)}
                          alt={flag.name}
                          className="flag-image"
                          style={{ height: imgHeight }}
                        />
                      </div>
                      <h3 className={`fragment ${nameSize} font-bold mt-4`} data-fragment-index="0">{flag.name}</h3>
                      {config.show_mnemonics && flag.mnemonic && (
                        <p className="fragment text-base text-surface-400 mt-2 italic" data-fragment-index="1" style={{ maxWidth: `${colWidth}px` }}>
                          &ldquo;{flag.mnemonic}&rdquo;
                        </p>
                      )}
                      {config.show_analytics && flag.attemptCount > 0 && (
                        <FlagAnalyticsBlock
                          flag={flag}
                          sparklines={analyticsData?.sparklines}
                          sparklineWidth={colWidth - 40}
                          sparklineHeight={30}
                          textClass="text-sm"
                          reactionClass="text-xs"
                          pillGap="6px"
                        />
                      )}
                    </div>
                    );
                  })}
                </div>
              </section>
            ) : (
              /* Group tag (or similar with only 1 flag): one slide per flag */
              group.flags.map((flag) => (
              <section key={flag.code}>
                {/* Top row: flag left, info right */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "60px" }}>
                  {/* Flag image — left side */}
                  <div className="flag-container">
                    <img src={imageUrl(flag.code)} alt={flag.name} className="flag-image" />
                  </div>

                  {/* Info — right side */}
                  <div style={{ textAlign: "left", minWidth: "400px" }}>
                    <h3 className="fragment text-4xl font-bold" data-fragment-index="0">{flag.name}</h3>

                    {config.show_mnemonics && flag.mnemonic && (
                      <p className="fragment text-xl text-surface-400 mt-3 italic" data-fragment-index="1" style={{ maxWidth: "500px" }}>
                        &ldquo;{flag.mnemonic}&rdquo;
                      </p>
                    )}

                    {config.show_analytics && flag.attemptCount > 0 && (
                      <FlagAnalyticsBlock
                        flag={flag}
                        sparklines={analyticsData?.sparklines}
                        sparklineWidth={300}
                        sparklineHeight={40}
                      />
                    )}
                  </div>
                </div>

                {/* Bottom row: confusions */}
                {config.show_analytics && flag.attemptCount > 0 && flag.confusions.length > 0 && (
                  <div className="fragment" data-fragment-index="4" style={{ marginTop: "40px" }}>
                    <p className="text-sm text-surface-500" style={{ marginBottom: "10px" }}>Often confused with</p>
                    <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
                      {flag.confusions.map((c) => (
                        <div key={c.code} className="pres-confusion-card">
                          <img src={imageUrl(c.code)} alt={c.name} />
                          <span className="text-xs text-surface-400">{c.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </section>
              ))
            )}
          </section>
        ))}

        {/* Analytics section */}
        {config.show_analytics && hasAnalytics && (
          <section>
            {/* Analytics title slide with overall stats */}
            <section>
              <h2 className="text-5xl font-bold">Analytics</h2>
              <p className="text-xl text-surface-400 mt-4">How am I doing?</p>
              {analyticsData!.overallStats && (
                <div className="fragment mt-12 flex items-center justify-center gap-12">
                  <div className="text-center">
                    <div className="text-6xl font-extrabold text-emerald-400">
                      {analyticsData!.overallStats.accuracy}%
                    </div>
                    <div className="mt-2 text-lg text-surface-500">Overall accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-extrabold text-white">
                      {analyticsData!.overallStats.total_attempts}
                    </div>
                    <div className="mt-2 text-lg text-surface-500">Total attempts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-6xl font-extrabold text-white">
                      {analyticsData!.overallStats.flags_attempted}
                    </div>
                    <div className="mt-2 text-lg text-surface-500">Flags attempted</div>
                  </div>
                  {analyticsData!.percentiles?.global && (
                    <div className="text-center">
                      <div className="text-6xl font-extrabold text-amber-400">
                        {(analyticsData!.percentiles.global.p25 / 1000).toFixed(1)}s
                        <span className="text-3xl text-surface-500"> — </span>
                        {(analyticsData!.percentiles.global.p75 / 1000).toFixed(1)}s
                      </div>
                      <div className="mt-2 text-lg text-surface-500">Recognition time (p25 — p75)</div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* Progress Over Time */}
            <section>
              <h3 className="text-3xl font-bold mb-8">Progress Over Time</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={analyticsData!.progress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2030" />
                    <XAxis dataKey="day" stroke="#5a6178" tick={{ fontSize: 16 }} />
                    <YAxis stroke="#5a6178" tick={{ fontSize: 16 }} domain={[0, 100]} />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ r: 4, fill: "#10b981" }}
                      name="Accuracy %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            {/* Accuracy by Continent */}
            {analyticsData!.groupData.length > 0 && (
              <section>
                <h3 className="text-3xl font-bold mb-8">Accuracy by Continent</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={analyticsData!.groupData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c2030" />
                      <XAxis dataKey="group" stroke="#5a6178" tick={{ fontSize: 16 }} />
                      <YAxis stroke="#5a6178" tick={{ fontSize: 16 }} domain={[0, 100]} />
                      <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                        {analyticsData!.groupData.map((d) => (
                          <Cell key={d.group} fill={groupColors(collection)[d.group] || "#10b981"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* Confidence Distribution */}
            {analyticsData!.confidenceDist.length > 0 && (
              <section>
                <h3 className="text-3xl font-bold mb-8">Confidence Distribution</h3>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={500}>
                    <BarChart data={analyticsData!.confidenceDist.map((d) => ({
                      ...d,
                      name: RATING_LABELS[d.confidence] || String(d.confidence),
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1c2030" />
                      <XAxis dataKey="name" stroke="#5a6178" tick={{ fontSize: 16 }} />
                      <YAxis stroke="#5a6178" tick={{ fontSize: 16 }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {analyticsData!.confidenceDist.map((d) => (
                          <Cell key={d.confidence} fill={CONFIDENCE_COLORS[d.confidence] || "#5a6178"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            {/* FSRS State Breakdown */}
            <section>
              <h3 className="text-3xl font-bold mb-8">Learning State Breakdown</h3>
              <div className="flex items-center justify-center gap-16">
                <div style={{ width: 400, height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData!.stateBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={160}
                        strokeWidth={0}
                      >
                        {analyticsData!.stateBreakdown.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-4">
                  {analyticsData!.stateBreakdown.map((s, i) => (
                    <div key={s.name} className="flex items-center gap-4 text-xl">
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-surface-400">{s.name}</span>
                      <span className="font-bold text-white">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Before / After */}
            {analyticsData!.comparison?.before && analyticsData!.comparison?.after &&
              analyticsData!.comparison.before.attempts > 0 && analyticsData!.comparison.after.attempts > 0 && (
              <section>
                <h3 className="text-3xl font-bold mb-8">Before / After</h3>
                <div className="flex items-center justify-center gap-12">
                  <div className="rounded-2xl border border-surface-700 bg-surface-900/50 p-12 text-center">
                    <div className="text-lg uppercase tracking-wider text-surface-500">First week</div>
                    <div className="mt-3 text-7xl font-extrabold text-surface-400">
                      {analyticsData!.comparison.before.accuracy}%
                    </div>
                    <div className="mt-2 text-lg text-surface-600">
                      {analyticsData!.comparison.before.attempts} attempts
                    </div>
                  </div>
                  <div className="text-4xl text-surface-600">&rarr;</div>
                  <div className="rounded-2xl border border-surface-700 bg-surface-900/50 p-12 text-center">
                    <div className="text-lg uppercase tracking-wider text-surface-500">Latest week</div>
                    <div className="mt-3 text-7xl font-extrabold text-emerald-400">
                      {analyticsData!.comparison.after.accuracy}%
                    </div>
                    <div className="mt-2 text-lg text-surface-600">
                      {analyticsData!.comparison.after.attempts} attempts
                    </div>
                  </div>
                </div>
                {analyticsData!.comparison.after.accuracy > analyticsData!.comparison.before.accuracy && (
                  <div className="mt-8 text-center">
                    <span className="inline-block rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 text-xl font-bold text-emerald-400">
                      +{(analyticsData!.comparison.after.accuracy - analyticsData!.comparison.before.accuracy).toFixed(1)}% improvement
                    </span>
                  </div>
                )}
              </section>
            )}

            {/* Hardest Flags */}
            {analyticsData!.hardest.length > 0 && (
              <section>
                <h3 className="text-3xl font-bold mb-8">Hardest Flags</h3>
                <div className="flex flex-wrap justify-center gap-6">
                  {analyticsData!.hardest.slice(0, 10).map((h, i) => {
                    const f = flagByCode(h.flag);
                    return (
                      <div key={h.flag} className="flex items-center gap-4 rounded-xl border border-surface-700 bg-surface-900/50 px-6 py-4">
                        <span className="text-2xl font-bold text-surface-500">#{i + 1}</span>
                        <img src={imageUrl(h.flag)} alt={f?.name} className="h-10 rounded" />
                        <div>
                          <div className="text-lg font-medium text-white">{f?.name}</div>
                          <div className="text-sm text-surface-500">
                            <span className="font-bold text-red-400">{h.accuracy}%</span> &middot; {h.attempt_count} attempts
                          </div>
                        </div>
                        {analyticsData?.sparklines[h.flag] && (
                          <Sparkline data={analyticsData.sparklines[h.flag]} width={80} height={24} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Most Confused Pairs */}
            {analyticsData!.mergedPairs.length > 0 && (
              <section>
                <h3 className="text-3xl font-bold mb-8">Most Confused Pairs</h3>
                <div className="flex flex-wrap justify-center gap-6">
                  {analyticsData!.mergedPairs.slice(0, 10).map((p) => {
                    const fa = flagByCode(p.flagA);
                    const fb = flagByCode(p.flagB);
                    return (
                      <div key={`${p.flagA}-${p.flagB}`} className="flex items-center gap-4 rounded-xl border border-surface-700 bg-surface-900/50 px-6 py-4">
                        <div className="text-center">
                          <img src={imageUrl(p.flagA)} alt={fa?.name} className="h-10 rounded" />
                          <div className="text-xs text-surface-400 mt-1">{fa?.name}</div>
                        </div>
                        <span className="text-xl font-bold text-amber-400">{p.count}x</span>
                        <div className="text-center">
                          <img src={imageUrl(p.flagB)} alt={fb?.name} className="h-10 rounded" />
                          <div className="text-xs text-surface-400 mt-1">{fb?.name}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </section>
        )}

        {/* End slide */}
        {config.show_end_slide && (
          <section>
            <h2 className="text-5xl font-bold">That&apos;s all!</h2>
            <p className="text-2xl text-surface-400 mt-6">
              Don&apos;t be a <span className="font-bold text-red-400">France</span>, be more like a <span className="font-bold text-emerald-400">Japan</span>.
            </p>
            <p className="text-lg text-surface-500 mt-8">
              Press Esc to exit
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
