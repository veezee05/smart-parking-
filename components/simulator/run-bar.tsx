"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ALGORITHM_META, ALGORITHM_ORDER } from "@/lib/algorithms";
import type { AlgorithmName, AlgorithmResult } from "@/lib/algorithms/types";
import {
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Zap,
  FastForward,
  Loader2,
  SkipBack,
} from "lucide-react";
import type { SimulationState } from "@/hooks/use-simulation";

interface Props {
  active: AlgorithmName;
  result: AlgorithmResult | null;
  sim: SimulationState;
  onRun: () => void;
  onRunAll: () => void;
  onReset: () => void;
}

export function RunBar({
  active,
  result,
  sim,
  onRun,
  onRunAll,
  onReset,
}: Props) {
  const meta = ALGORITHM_META[active];
  const steps = result?.steps ?? [];
  const isDonePlaying =
    result !== null && sim.playbackIndex >= steps.length - 1;
  const hasStartedPlayback = sim.playbackIndex >= 0;
  const playbackStep =
    result && sim.playbackIndex >= 0
      ? Math.min(sim.playbackIndex + 1, steps.length)
      : 0;
  const progress = steps.length > 0 ? (playbackStep / steps.length) * 100 : 0;

  return (
    <div className="card-soft relative overflow-hidden p-5 sm:p-6">
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255, 122, 89, 0.6), transparent)",
        }}
      />

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 xl:max-w-2xl">
            <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">
              Active algorithm
            </div>
            <div className="mt-1 flex items-center gap-3 flex-wrap">
              <div className="display text-2xl sm:text-3xl text-ink leading-tight truncate">
                {meta.label}
              </div>
              <Badge variant={result?.optimal ? "sage" : "accent"}>
                {result ? (result.optimal ? "optimal" : "heuristic") : "idle"}
              </Badge>
            </div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              {meta.blurb}
            </p>

            {sim.errorMessage && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#ffd1c6] bg-[#fff5f1] px-4 py-3 text-sm text-[#8d442d]">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-accent" />
                <div>
                  <div className="font-medium text-ink">Simulation failed</div>
                  <div className="mt-1 text-[#8d442d]">{sim.errorMessage}</div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              disabled={sim.isRunning}
            >
              <RotateCcw className="size-3.5" /> Reset
            </Button>

            {result && (
              <div className="flex items-center border border-line rounded-xl overflow-hidden bg-cream/50 divide-x divide-line shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none h-9 px-3"
                  title="Restart playback"
                  onClick={sim.restartPlayback}
                >
                  <SkipBack className="size-3.5" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none h-9 px-3.5"
                  onClick={sim.togglePlayback}
                >
                  {sim.playbackActive ? (
                    <Pause className="size-3.5 mr-1" />
                  ) : (
                    <Play className="size-3.5 mr-1" />
                  )}
                  {sim.playbackActive
                    ? "Pause"
                    : isDonePlaying
                      ? "Replay"
                      : hasStartedPlayback
                        ? "Resume"
                        : "Play"}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-none h-9 px-3 font-mono text-[11px]"
                  title="Change speed"
                  onClick={() =>
                    sim.setPlaybackSpeed(
                      sim.playbackSpeed >= 8 ? 1 : sim.playbackSpeed * 2,
                    )
                  }
                >
                  <FastForward className="size-3 mr-1" />
                  {sim.playbackSpeed}x
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={onRunAll}
              disabled={sim.isRunning}
            >
              {sim.isRunning ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Zap className="size-3.5" />
              )}
              Run all
            </Button>

            <Button
              size="sm"
              variant="accent"
              onClick={onRun}
              disabled={sim.isRunning}
            >
              {sim.isRunning ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              Run {meta.label}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Metric label="Time" value={meta.time} mono />
          <Metric label="Space" value={meta.space} mono />
          <Metric
            label="Total dist."
            value={result ? `${result.totalDistance}m` : "—"}
          />
          <Metric
            label="Nodes"
            value={result ? result.nodesExplored.toLocaleString() : "—"}
            mono
          />
          <Metric
            label="Playback"
            value={
              result ? `${playbackStep}/${steps.length || 0} steps` : "ready"
            }
            mono
          />
        </div>

        <div className="rounded-2xl border border-line bg-[linear-gradient(135deg,rgba(255,255,255,0.85),rgba(255,244,239,0.95))] px-4 py-4 shadow-[0_1px_0_rgba(255,255,255,0.75)_inset]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">
                Step progress
              </div>
              <div className="mt-1 text-sm text-ink">
                {result
                  ? `${playbackStep || 0} of ${steps.length} steps visible`
                  : "Run an algorithm to unlock the timeline."}
              </div>
            </div>
            {result && (
              <div className="text-xs font-mono text-muted">
                elapsed {result.elapsedMs.toFixed(2)}ms
              </div>
            )}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/70 border border-white/80">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#ff7a59,#f4c77b)] transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-card/70 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset]">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-subtle">
        {label}
      </dt>
      <dd
        className={`text-sm text-ink mt-1 mono-clamp ${
          mono ? "font-mono" : "font-medium"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
