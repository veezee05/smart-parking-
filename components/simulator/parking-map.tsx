"use client";

import type {
  Assignment,
  ParkingSlot,
  Vehicle,
  AlgorithmStep,
} from "@/lib/algorithms/types";
import { cn } from "@/lib/utils";
import { Accessibility, Car, Plug, MapPin } from "lucide-react";

interface Props {
  slots: ParkingSlot[];
  vehicles: Vehicle[];
  assignments: Assignment[];
  onToggle?: (id: number) => void;
  currentStep?: AlgorithmStep | null;
}

const VB_W = 960;
const VB_H = 540;
const ENTRANCE = { x: 80, y: 470 };

function positionFor(slot: ParkingSlot): { x: number; y: number } {
  const minD = 8;
  const maxD = 42;
  const t = (slot.distance - minD) / (maxD - minD);
  const x = 170 + t * 680;
  const y = slot.type === "E" ? 160 : slot.type === "H" ? 290 : 410;
  return { x, y };
}

const typeMeta = {
  G: { label: "General", Icon: Car, tone: "#8a7650" },
  H: { label: "Accessible", Icon: Accessibility, tone: "#325080" },
  E: { label: "EV", Icon: Plug, tone: "#3c6b46" },
} as const;

// Get slot highlight style based on the current step kind
function getStepStyle(kind: AlgorithmStep["kind"]): {
  stroke: string;
  fill: string;
  textColor: string;
  pathColor: string;
} {
  switch (kind) {
    case "assign":
      return {
        stroke: "var(--color-accent)",
        fill: "var(--color-ink)",
        textColor: "#faf7f2",
        pathColor: "#ff7a59",
      };
    case "prune":
    case "backtrack":
      return {
        stroke: "#d24c3a",
        fill: "#fef2f2",
        textColor: "#0f0d0a",
        pathColor: "#d24c3a",
      };
    case "skip":
      return {
        stroke: "#c49b5a",
        fill: "#fff8ee",
        textColor: "#0f0d0a",
        pathColor: "#c49b5a",
      };
    default: // try, bound
      return {
        stroke: "#e5b94b",
        fill: "#fffbef",
        textColor: "#0f0d0a",
        pathColor: "#e5b94b",
      };
  }
}

export function ParkingMap({
  slots,
  vehicles,
  assignments,
  onToggle,
  currentStep,
}: Props) {
  const assignedBySlot = new Map(assignments.map((a) => [a.slotId, a]));
  const vehicleMap = new Map(vehicles.map((v) => [v.id, v]));
  const freeSlots = slots.filter((slot) => !slot.occupied).length;
  const blockedSlots = slots.length - freeSlots;
  const activeStepLabel = currentStep
    ? currentStep.kind === "assign"
      ? `Vehicle ${currentStep.vehicleId ?? "?"} locked into bay #${currentStep.slotId ?? "?"}`
      : currentStep.kind === "done"
        ? "Playback complete"
        : `Inspecting bay #${currentStep.slotId ?? "?"}`
    : "Run an algorithm to watch the lot fill in real time";

  const isInPlayback =
    currentStep !== null &&
    currentStep !== undefined &&
    currentStep.kind !== "done";

  const noResults = assignments.length === 0 && !isInPlayback;

  return (
    <div className="card-soft p-4 sm:p-6 overflow-hidden">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">
            Parking lot · aerial
          </div>
          <h3 className="display text-2xl text-ink mt-1 truncate">
            Live allocation map
          </h3>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Legend dot="#d9d1c4" label="Free" />
          <Legend dot="var(--color-accent)" label="Assigned" />
          <Legend dot="#c6b79b" label="Occupied" />
          {isInPlayback && <Legend dot="#e5b94b" label="Evaluating" />}
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="rounded-2xl border border-line bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(245,241,234,0.95))] px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]">
          <div className="text-[10px] uppercase tracking-[0.16em] text-subtle">
            Current focus
          </div>
          <div className="mt-1 text-sm text-ink">{activeStepLabel}</div>
        </div>
        <StatPill label="Assigned" value={assignments.length} tone="accent" />
        <StatPill label="Free" value={freeSlots} tone="sage" />
        <StatPill label="Blocked" value={blockedSlots} tone="neutral" />
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-line bg-[#eef1e8]">
        <div
          className="absolute inset-0 gradient-iris opacity-70"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,#0f0d0a 0 2px,transparent 2px 14px)",
          }}
          aria-hidden
        />

        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="relative block w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="road" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2a2620" />
              <stop offset="100%" stopColor="#3a3530" />
            </linearGradient>
            <linearGradient id="grass" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#d9e4c9" />
              <stop offset="100%" stopColor="#c3d2ae" />
            </linearGradient>
            <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Ground */}
          <rect
            x="0"
            y="0"
            width={VB_W}
            height={VB_H}
            fill="url(#grass)"
            opacity="0.35"
          />

          {/* Road */}
          <path
            d={`M ${ENTRANCE.x - 40} ${VB_H} L ${ENTRANCE.x - 40} ${ENTRANCE.y - 20} Q ${ENTRANCE.x - 40} 110 260 110 L ${VB_W - 40} 110 L ${VB_W - 40} ${VB_H - 40} L ${ENTRANCE.x + 40} ${VB_H - 40} Z`}
            fill="url(#road)"
            opacity="0.92"
          />
          <path
            d={`M ${ENTRANCE.x} ${VB_H - 60} L ${ENTRANCE.x} ${ENTRANCE.y - 40} Q ${ENTRANCE.x} 150 300 150 L ${VB_W - 80} 150`}
            stroke="#f4c77b"
            strokeWidth="2"
            strokeDasharray="10 10"
            fill="none"
            opacity="0.8"
          />

          {/* Row labels */}
          {[
            { y: 160, label: "EV ROW" },
            { y: 290, label: "ACCESSIBLE" },
            { y: 410, label: "GENERAL" },
          ].map((r) => (
            <text
              key={r.label}
              x={120}
              y={r.y + 5}
              textAnchor="end"
              fontSize="11"
              fill="#2a2620"
              opacity="0.55"
              letterSpacing="2"
            >
              {r.label}
            </text>
          ))}

          {/* Entrance booth */}
          <g transform={`translate(${ENTRANCE.x - 55} ${ENTRANCE.y - 10})`}>
            <rect
              x="-20"
              y="10"
              width="110"
              height="50"
              rx="6"
              fill="#2a2620"
              opacity="0.85"
            />
            <text
              x="35"
              y="40"
              textAnchor="middle"
              fill="#faf7f2"
              fontSize="11"
              letterSpacing="2"
            >
              ENTRANCE
            </text>
          </g>

          {/* Active step scanning line */}
          {isInPlayback &&
            currentStep!.slotId !== undefined &&
            (() => {
              const targetSlot = slots.find(
                (s) => s.id === currentStep!.slotId,
              );
              if (!targetSlot) return null;
              const { x, y } = positionFor(targetSlot);
              const mx = (ENTRANCE.x + x) / 2;
              const my = Math.min(ENTRANCE.y, y) - 80;
              const d = `M ${ENTRANCE.x + 30} ${ENTRANCE.y - 10} Q ${mx} ${my} ${x} ${y + 18}`;
              const { pathColor } = getStepStyle(currentStep!.kind);
              const isAssigning = currentStep!.kind === "assign";
              return (
                <path
                  d={d}
                  stroke={pathColor}
                  strokeWidth={isAssigning ? 3 : 2}
                  strokeLinecap="round"
                  strokeDasharray={isAssigning ? "none" : "8 6"}
                  fill="none"
                  opacity="0.9"
                  style={
                    isAssigning
                      ? {}
                      : { animation: "dash 0.8s linear infinite" }
                  }
                />
              );
            })()}

          {/* Final assignment paths — fade to ghost during playback */}
          <g
            style={{
              opacity: isInPlayback ? 0.12 : 1,
              transition: "opacity 0.5s ease",
            }}
          >
            {assignments.map((a, i) => {
              const slot = slots.find((s) => s.id === a.slotId);
              if (!slot) return null;
              const { x, y } = positionFor(slot);
              const mx = (ENTRANCE.x + x) / 2;
              const my = Math.min(ENTRANCE.y, y) - 60;
              const d = `M ${ENTRANCE.x + 30} ${ENTRANCE.y - 10} Q ${mx} ${my} ${x} ${y + 18}`;
              return (
                <path
                  key={`path-${a.vehicleId}`}
                  d={d}
                  stroke="var(--color-accent)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray="6 6"
                  fill="none"
                  opacity="0.75"
                  style={{
                    strokeDashoffset: 600,
                    animation: `draw 0.9s ${i * 120}ms cubic-bezier(.2,.7,.2,1) forwards`,
                  }}
                />
              );
            })}
          </g>

          {/* Slots */}
          {slots.map((s, idx) => {
            const { x, y } = positionFor(s);
            const a = assignedBySlot.get(s.id);
            const v = a ? vehicleMap.get(a.vehicleId) : undefined;

            const isActiveSlot = isInPlayback && currentStep!.slotId === s.id;
            const isAssignedFinal = !isInPlayback && !!a;

            // Determine fill/stroke
            let fill = "#ffffff";
            let stroke = "#e8e2d8";
            let strokeWidth = 1.5;
            let textColor = "#0f0d0a";
            let typeChipColor = "rgba(255,255,255,0)"; // transparent

            if (s.occupied) {
              fill = "#e8dcc2";
            } else if (isActiveSlot) {
              const style = getStepStyle(currentStep!.kind);
              fill = style.fill;
              stroke = style.stroke;
              strokeWidth = 2.5;
              textColor = style.textColor;
            } else if (isAssignedFinal) {
              fill = "var(--color-ink)";
              stroke = "var(--color-accent)";
              textColor = "#faf7f2";
            }

            const { tone, Icon } = typeMeta[s.type];

            return (
              <g
                key={s.id}
                transform={`translate(${x - 46} ${y - 28})`}
                onClick={() => onToggle?.(s.id)}
                style={{
                  cursor: onToggle ? "pointer" : "default",
                }}
              >
                <g
                  style={{
                    opacity: 0,
                    animation: `fade-card-in 0.45s ${idx * 35}ms cubic-bezier(.2,.7,.2,1) forwards`,
                  }}
                >
                  {!isActiveSlot && (
                    <rect
                      x="2"
                      y="4"
                      width="92"
                      height="56"
                      rx="12"
                      fill="#0f0d0a"
                      opacity="0.07"
                      filter="url(#shadow)"
                    />
                  )}

                  <rect
                    width="92"
                    height="56"
                    rx="12"
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeWidth}
                    filter={isActiveSlot ? "url(#glow)" : undefined}
                  />

                  <rect
                    x="8"
                    y="8"
                    width="24"
                    height="18"
                    rx="6"
                    fill={
                      isAssignedFinal ? "rgba(255,255,255,0.12)" : "#f5f1ea"
                    }
                  />
                  <text
                    x="20"
                    y="21"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="600"
                    fill={isAssignedFinal ? "#faf7f2" : tone}
                  >
                    {s.type}
                  </text>

                  <text
                    x="84"
                    y="20"
                    textAnchor="end"
                    fontSize="10"
                    fill={
                      isAssignedFinal ? "rgba(250,247,242,0.55)" : "#9a928a"
                    }
                  >
                    #{s.id}
                  </text>

                  <text x="8" y="46" fontSize="18" fill={textColor}>
                    {s.distance}
                    <tspan
                      fontSize="10"
                      fill={
                        isAssignedFinal ? "rgba(250,247,242,0.55)" : "#9a928a"
                      }
                    >
                      {" "}
                      m
                    </tspan>
                  </text>

                  {isAssignedFinal && v && (
                    <g transform="translate(62 36)">
                      <rect
                        width="22"
                        height="14"
                        rx="7"
                        fill="var(--color-accent)"
                      />
                      <text
                        x="11"
                        y="10.5"
                        textAnchor="middle"
                        fontSize="9"
                        fontWeight="600"
                        fill="#fff"
                      >
                        V{v.id}
                      </text>
                    </g>
                  )}

                  {s.occupied && (
                    <g transform="translate(70 36)">
                      <circle cx="8" cy="8" r="8" fill="#c6b79b" />
                      <text
                        x="8"
                        y="11"
                        textAnchor="middle"
                        fontSize="10"
                        fill="#faf7f2"
                      >
                        ×
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}

          {/* Entrance pin */}
          <g transform={`translate(${ENTRANCE.x - 10} ${ENTRANCE.y - 30})`}>
            <circle cx="10" cy="10" r="10" fill="var(--color-accent)" />
            <circle cx="10" cy="10" r="4" fill="#fff" />
          </g>

          {/* Empty state overlay */}
          {noResults && (
            <g>
              <rect
                x="280"
                y="210"
                width="400"
                height="120"
                rx="20"
                fill="rgba(255,255,255,0.88)"
              />
              <text
                x="480"
                y="257"
                textAnchor="middle"
                fontSize="15"
                fill="#5e5650"
                fontWeight="600"
              >
                Press Run to start the algorithm
              </text>
              <text
                x="480"
                y="280"
                textAnchor="middle"
                fontSize="12"
                fill="#9a928a"
              >
                Slots will be assigned step by step
              </text>
              <text
                x="480"
                y="308"
                textAnchor="middle"
                fontSize="22"
                fill="#c8c0b6"
              >
                ↑ Use the control bar above
              </text>
            </g>
          )}

          <style>{`
            @keyframes draw { to { stroke-dashoffset: 0; } }
            @keyframes dash { to { stroke-dashoffset: -14; } }
            @keyframes fade-card-in {
              from { opacity: 0; }
              to { opacity: 1; }
            }
          `}</style>
        </svg>

        {/* Corner location badge */}
        <div className="absolute top-3 right-3 glass px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.16em] text-ink-soft flex items-center gap-1.5">
          <MapPin className="size-3 text-accent" /> PCCoE Lot · 10 bays
        </div>

        <div className="absolute left-3 bottom-3 glass-dark px-4 py-3 max-w-70">
          <div className="text-[10px] uppercase tracking-[0.16em] text-white/60">
            Playback note
          </div>
          <div className="mt-1 text-sm leading-5 text-paper">
            {activeStepLabel}
          </div>
        </div>
      </div>

      {/* Mobile list fallback */}
      <details className="mt-4 sm:hidden">
        <summary className="text-xs text-muted cursor-pointer">
          Tap-friendly list
        </summary>
        <ul className="mt-2 grid grid-cols-2 gap-2">
          {slots.map((s) => {
            const { Icon } = typeMeta[s.type];
            const a = assignedBySlot.get(s.id);
            return (
              <li key={s.id}>
                <button
                  onClick={() => onToggle?.(s.id)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3 text-xs",
                    s.occupied
                      ? "bg-[#f6efe3] border-[#e3d6bd] text-muted"
                      : a
                        ? "bg-ink text-paper border-ink"
                        : "bg-card border-line",
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5">
                      <Icon className="size-3" /> #{s.id}
                    </span>
                    <span className="font-mono">{s.distance}m</span>
                  </div>
                  <div className="mt-1 opacity-70">
                    {typeMeta[s.type].label}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </details>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "accent" | "sage" | "neutral";
}) {
  const toneClass =
    tone === "accent"
      ? "border-[#ffd1c6] bg-[#fff5f1] text-[#a34f34]"
      : tone === "sage"
        ? "border-[#d7e4d1] bg-[#f2f7ef] text-[#4a6a45]"
        : "border-line bg-white/80 text-muted";

  return (
    <div className={cn("rounded-2xl border px-4 py-3 min-w-27", toneClass)}>
      <div className="text-[10px] uppercase tracking-[0.16em] opacity-70">
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-ink">{value}</div>
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-muted">
      <span className="size-2.5 rounded-full" style={{ background: dot }} />
      {label}
    </span>
  );
}
