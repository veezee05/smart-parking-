import { NextResponse } from "next/server";
import { runAlgorithm } from "@/lib/algorithms";
import { AlgorithmName, ParkingSlot, Vehicle } from "@/lib/algorithms/types";

async function logSimulationRun(args: {
  algorithm: AlgorithmName;
  result: ReturnType<typeof runAlgorithm>;
  slots: ParkingSlot[];
  vehicles: Vehicle[];
  elapsedMs: number;
}) {
  try {
    const { prisma } = await import("@/lib/prisma");

    await prisma.simulationRun.create({
      data: {
        algorithm: args.algorithm,
        totalDistance: args.result.totalDistance,
        nodesExplored: args.result.nodesExplored,
        elapsedMs: args.elapsedMs,
        slots: JSON.stringify(args.slots),
        vehicles: JSON.stringify(args.vehicles),
        steps: JSON.stringify(args.result.steps),
      },
    });
  } catch (error) {
    console.warn("Skipping simulation log:", error);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { algorithm, slots, vehicles } = body as {
      algorithm: AlgorithmName;
      slots: ParkingSlot[];
      vehicles: Vehicle[];
    };

    if (!algorithm || !slots || !vehicles) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const t0 = performance.now();
    const result = runAlgorithm(algorithm, slots, vehicles);
    const t1 = performance.now();

    await logSimulationRun({
      algorithm,
      result,
      slots,
      vehicles,
      elapsedMs: t1 - t0,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in /api/allocate:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
