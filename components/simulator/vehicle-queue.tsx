"use client";

import { Badge } from "@/components/ui/badge";
import type {
  Assignment,
  Vehicle,
  AlgorithmStep,
} from "@/lib/algorithms/types";
import { cn } from "@/lib/utils";
import { Accessibility, Car, Plug } from "lucide-react";

interface Props {
  vehicles: Vehicle[];
  assignments: Assignment[];
  currentStep?: AlgorithmStep | null;
  isPlayback?: boolean;
}

const typeIcon = { G: Car, H: Accessibility, E: Plug } as const;
const typeName = { G: "General", H: "Accessible", E: "EV" } as const;

export function VehicleQueue({
  vehicles,
  assignments,
  currentStep,
  isPlayback,
}: Props) {
  const assignedMap = new Map(assignments.map((a) => [a.vehicleId, a]));
  const sorted = [...vehicles].sort((a, b) => a.priority - b.priority);

  const activeVehicleId = currentStep?.vehicleId;
  const activeStepLabel = currentStep
    ? currentStep.kind === "assign"
      ? `Assigning vehicle ${currentStep.vehicleId ?? "?"} to slot #${currentStep.slotId ?? "?"}`
      : currentStep.kind === "done"
        ? "Playback complete"
        : `Evaluating slot #${currentStep.slotId ?? "?"}`
    : "Waiting to start";

  return (
    <div className="card-soft p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">
            Vehicle queue
          </div>
          <h3 className="display text-2xl text-ink mt-1">Priority order</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{sorted.length} vehicles</Badge>
          {isPlayback && (
            <Badge
              variant="outline"
              className="text-[10px] border-amber-300 text-amber-700 bg-amber-50"
            >
              Live
            </Badge>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-line bg-[linear-gradient(135deg,rgba(255,255,255,0.9),rgba(245,241,234,0.95))] px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]">
        <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">
          Live status
        </div>
        <div className="mt-1 text-sm text-ink">{activeStepLabel}</div>
      </div>

      <ol className="space-y-2">
        {sorted.map((v, i) => {
          const Icon = typeIcon[v.type];
          const a = assignedMap.get(v.id);

          const isCurrentlyActive = isPlayback && activeVehicleId === v.id;
          const isAssigned = !!a;

          return (
            <li
              key={v.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300",
                isCurrentlyActive
                  ? "border-amber-400 bg-amber-50 shadow-[0_0_0_3px_rgba(251,191,36,0.2)]"
                  : isAssigned
                    ? "border-accent/30 bg-accent-soft/50"
                    : "border-line bg-card",
              )}
            >
              <span className="display text-xl text-subtle w-6 text-center shrink-0">
                {i + 1}
              </span>
              <span
                className={cn(
                  "grid place-items-center size-9 rounded-lg shrink-0 transition-colors",
                  isCurrentlyActive ? "bg-amber-100" : "bg-cream",
                )}
              >
                <Icon
                  className={cn(
                    "size-4 transition-colors",
                    isCurrentlyActive ? "text-amber-600" : "text-ink-soft",
                  )}
                  strokeWidth={1.8}
                />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-ink truncate">
                  {v.plate}
                </div>
                <div className="text-[11px] text-muted mt-0.5 flex items-center gap-2">
                  <span className="font-mono">V{v.id}</span>
                  <span className="size-1 rounded-full bg-line" />
                  <span>{typeName[v.type]}</span>
                  <span className="size-1 rounded-full bg-line" />
                  <span>P{v.priority}</span>
                </div>
              </div>
              {isCurrentlyActive ? (
                <Badge
                  variant="outline"
                  className="border-amber-400 text-amber-700 bg-amber-50 shrink-0"
                >
                  Checking…
                </Badge>
              ) : isAssigned ? (
                <Badge variant="accent" className="shrink-0">
                  #{a!.slotId} · {a!.distance}m
                </Badge>
              ) : (
                <Badge variant="outline" className="shrink-0 text-subtle">
                  queued
                </Badge>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
