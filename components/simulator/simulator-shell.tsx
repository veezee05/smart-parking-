"use client";

import { useEffect, useRef, useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALGORITHM_META, ALGORITHM_ORDER } from "@/lib/algorithms";
import type {
  AlgorithmName,
  AlgorithmResult,
  Assignment,
} from "@/lib/algorithms/types";
import { SimulatorSidebar } from "@/components/simulator/simulator-sidebar";
import { RunBar } from "@/components/simulator/run-bar";
import { ParkingMap } from "@/components/simulator/parking-map";
import { VehicleQueue } from "@/components/simulator/vehicle-queue";
import { ComparisonTable } from "@/components/simulator/comparison-table";
import { ExecutionLog } from "@/components/simulator/execution-log";
import { useSimulation } from "@/hooks/use-simulation";

function getVisibleAssignments(
  result: AlgorithmResult | null,
  playbackIndex: number,
): Assignment[] {
  if (!result) return [];
  if (playbackIndex < 0) return result.assignments;
  if (playbackIndex >= result.steps.length - 1) return result.assignments;

  const committed = new Set<string>();

  for (let index = 0; index <= playbackIndex; index += 1) {
    const step = result.steps[index];
    if (
      step?.kind === "assign" &&
      step.vehicleId !== undefined &&
      step.slotId !== undefined
    ) {
      committed.add(`${step.vehicleId}:${step.slotId}`);
    }
  }

  return result.assignments.filter((assignment) =>
    committed.has(`${assignment.vehicleId}:${assignment.slotId}`),
  );
}

export function SimulatorShell() {
  const sim = useSimulation();
  const activeResult = sim.results[sim.active];
  const [mapKey, setMapKey] = useState(0);
  const playbackPreview =
    sim.playbackIndex >= 0 && sim.currentStep?.kind !== "done";
  const visibleAssignments = playbackPreview
    ? getVisibleAssignments(activeResult, sim.playbackIndex)
    : (activeResult?.assignments ?? []);

  // bump map key whenever algorithm changes or a run completes to restart CSS animations
  const prevActive = useRef(sim.active);
  const prevResult = useRef(activeResult);
  useEffect(() => {
    if (
      prevActive.current !== sim.active ||
      prevResult.current !== activeResult
    ) {
      setMapKey((k) => k + 1);
      prevActive.current = sim.active;
      prevResult.current = activeResult;
    }
  }, [sim.active, activeResult]);

  return (
    <div className="flex min-h-dvh overflow-x-hidden">
      <SimulatorSidebar
        active={sim.active}
        onSelect={(n) => sim.setActive(n)}
        results={sim.results}
      />
      <main className="flex-1 min-w-0 flex flex-col">
        <Header active={sim.active} onSelect={(n) => sim.setActive(n)} />

        <div className="flex-1 px-4 sm:px-6 lg:px-10 py-6 lg:py-8 space-y-6 max-w-full">
          <RunBar
            active={sim.active}
            result={activeResult}
            sim={sim}
            onRun={() => sim.runOne(sim.active)}
            onRunAll={() => sim.runAll()}
            onReset={() => sim.reset()}
          />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-w-0" key={`map-${mapKey}`}>
              <ParkingMap
                slots={sim.slots}
                vehicles={sim.vehicles}
                assignments={visibleAssignments}
                onToggle={sim.toggleSlotOccupied}
                currentStep={sim.currentStep}
              />
            </div>
            <div className="min-w-0">
              <VehicleQueue
                vehicles={sim.vehicles}
                assignments={visibleAssignments}
                currentStep={sim.currentStep}
                isPlayback={playbackPreview}
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,560px)]">
            <div className="min-w-0">
              <ExecutionLog
                result={activeResult}
                playbackIndex={sim.playbackIndex}
              />
            </div>
            <div className="min-w-0">
              <ComparisonTable
                results={sim.results}
                active={sim.active}
                onSelect={(n) => sim.setActive(n)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Header({
  active,
  onSelect,
}: {
  active: AlgorithmName;
  onSelect: (n: AlgorithmName) => void;
}) {
  return (
    <div className="sticky top-0 z-20 glass border-b border-line/70 rounded-none">
      <div className="px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">
            Simulator
          </div>
          <h1 className="text-[15px] font-semibold text-ink truncate">
            {ALGORITHM_META[active].label}{" "}
            <span className="text-muted font-normal">· interactive studio</span>
          </h1>
        </div>
        <Tabs
          value={active}
          onValueChange={(v) => onSelect(v as AlgorithmName)}
        >
          <TabsList className="max-w-full overflow-x-auto no-scrollbar">
            {ALGORITHM_ORDER.map((n) => (
              <TabsTrigger key={n} value={n}>
                <span className="hidden sm:inline">
                  {ALGORITHM_META[n].label}
                </span>
                <span className="sm:hidden">
                  {ALGORITHM_META[n].label.split(" ")[0]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
