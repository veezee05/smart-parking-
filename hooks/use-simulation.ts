"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { ALGORITHM_ORDER } from "@/lib/algorithms";
import type {
  AlgorithmName,
  AlgorithmResult,
  AlgorithmStep,
  ParkingSlot,
  Vehicle,
} from "@/lib/algorithms/types";
import { SAMPLE_SLOTS, SAMPLE_VEHICLES } from "@/lib/algorithms/sample-data";

export interface SimulationState {
  slots: ParkingSlot[];
  vehicles: Vehicle[];
  active: AlgorithmName;
  results: Record<AlgorithmName, AlgorithmResult | null>;
  isRunning: boolean;
  errorMessage: string | null;
  playbackIndex: number;
  playbackActive: boolean;
  currentStep: AlgorithmStep | null;
  playbackSpeed: number;
  setActive: (name: AlgorithmName) => void;
  setSlots: (slots: ParkingSlot[]) => void;
  setVehicles: (vehicles: Vehicle[]) => void;
  toggleSlotOccupied: (id: number) => void;
  runOne: (name: AlgorithmName) => Promise<void>;
  runAll: () => Promise<void>;
  reset: () => void;
  togglePlayback: () => void;
  restartPlayback: () => void;
  setPlaybackSpeed: (speed: number) => void;
  setPlaybackIndex: (index: number) => void;
}

const emptyResults: Record<AlgorithmName, AlgorithmResult | null> = {
  greedy: null,
  dp: null,
  backtracking: null,
  "branch-bound": null,
};

async function readErrorMessage(res: Response) {
  try {
    const payload = (await res.json()) as { error?: string };
    if (typeof payload.error === "string" && payload.error.length > 0) {
      return payload.error;
    }
  } catch {}

  return `Simulation request failed (${res.status}).`;
}

export function useSimulation(): SimulationState {
  const [slots, setSlots] = useState<ParkingSlot[]>(SAMPLE_SLOTS);
  const [vehicles, setVehicles] = useState<Vehicle[]>(SAMPLE_VEHICLES);
  const [active, setActiveState] = useState<AlgorithmName>("greedy");
  const [results, setResults] =
    useState<Record<AlgorithmName, AlgorithmResult | null>>(emptyResults);
  const [isRunning, setIsRunning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [playbackIndex, setPlaybackIndex] = useState(-1);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(2);

  const activeResult = results[active];
  const steps = activeResult?.steps ?? [];
  const currentStep =
    playbackIndex >= 0 ? (steps[playbackIndex] ?? null) : null;

  // Interval-driven playback engine
  useEffect(() => {
    if (!playbackActive || steps.length === 0) return;
    const ms = 350 / playbackSpeed;
    const id = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= steps.length - 1) {
          setPlaybackActive(false);
          return steps.length - 1;
        }
        return prev + 1;
      });
    }, ms);
    return () => clearInterval(id);
  }, [playbackActive, steps, playbackSpeed]);

  // When active algorithm changes, stop playback
  const setActive = useCallback((name: AlgorithmName) => {
    setActiveState(name);
    setPlaybackIndex(-1);
    setPlaybackActive(false);
    setErrorMessage(null);
  }, []);

  const runOne = useCallback(
    async (name: AlgorithmName) => {
      setIsRunning(true);
      setErrorMessage(null);
      setPlaybackIndex(-1);
      setPlaybackActive(false);
      try {
        const res = await fetch("/api/allocate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ algorithm: name, slots, vehicles }),
        });

        if (!res.ok) {
          setErrorMessage(await readErrorMessage(res));
          return;
        }

        const r: AlgorithmResult = await res.json();
        setResults((prev) => ({ ...prev, [name]: r }));
        setActiveState(name);
        setPlaybackIndex(r.steps.length > 0 ? 0 : -1);
        setPlaybackActive(r.steps.length > 1);
      } catch (err) {
        console.error("runOne error:", err);
        setErrorMessage("Could not reach the simulator API.");
      } finally {
        setIsRunning(false);
      }
    },
    [slots, vehicles],
  );

  const runAll = useCallback(async () => {
    setIsRunning(true);
    setErrorMessage(null);
    setPlaybackIndex(-1);
    setPlaybackActive(false);
    const all = { ...emptyResults };
    try {
      for (const n of ALGORITHM_ORDER) {
        const res = await fetch("/api/allocate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ algorithm: n, slots, vehicles }),
        });

        if (!res.ok) {
          setErrorMessage(await readErrorMessage(res));
          return;
        }

        all[n] = (await res.json()) as AlgorithmResult;
      }

      setResults(all);
      setActiveState("greedy");
      setPlaybackIndex(all.greedy?.steps.length ? 0 : -1);
      setPlaybackActive((all.greedy?.steps.length ?? 0) > 1);
    } catch (err) {
      console.error("runAll error:", err);
      setErrorMessage("Could not reach the simulator API.");
    } finally {
      setIsRunning(false);
    }
  }, [slots, vehicles]);

  const togglePlayback = useCallback(() => {
    if (steps.length === 0) return;

    setPlaybackActive((prev) => {
      if (prev) {
        return false;
      }

      if (playbackIndex < 0 || playbackIndex >= steps.length - 1) {
        setPlaybackIndex(0);
        return steps.length > 1;
      }

      return true;
    });
  }, [playbackIndex, steps.length]);

  const restartPlayback = useCallback(() => {
    if (steps.length === 0) return;

    setPlaybackIndex(0);
    setPlaybackActive(steps.length > 1);
  }, [steps.length]);

  const toggleSlotOccupied = useCallback((id: number) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, occupied: !s.occupied } : s)),
    );
    setResults(emptyResults);
    setPlaybackIndex(-1);
    setPlaybackActive(false);
    setErrorMessage(null);
  }, []);

  const reset = useCallback(() => {
    setSlots(SAMPLE_SLOTS);
    setVehicles(SAMPLE_VEHICLES);
    setResults(emptyResults);
    setActiveState("greedy");
    setPlaybackIndex(-1);
    setPlaybackActive(false);
    setErrorMessage(null);
  }, []);

  return useMemo(
    () => ({
      slots,
      vehicles,
      active,
      results,
      isRunning,
      errorMessage,
      playbackIndex,
      playbackActive,
      currentStep,
      playbackSpeed,
      setActive,
      setSlots: (s) => {
        setSlots(s);
        setResults(emptyResults);
        setPlaybackIndex(-1);
        setPlaybackActive(false);
        setErrorMessage(null);
      },
      setVehicles: (v) => {
        setVehicles(v);
        setResults(emptyResults);
        setPlaybackIndex(-1);
        setPlaybackActive(false);
        setErrorMessage(null);
      },
      toggleSlotOccupied,
      runOne,
      runAll,
      reset,
      togglePlayback,
      restartPlayback,
      setPlaybackSpeed,
      setPlaybackIndex,
    }),
    [
      slots,
      vehicles,
      active,
      results,
      isRunning,
      errorMessage,
      playbackIndex,
      playbackActive,
      currentStep,
      playbackSpeed,
      setActive,
      runOne,
      runAll,
      toggleSlotOccupied,
      reset,
      togglePlayback,
      restartPlayback,
    ],
  );
}
